import { NextResponse } from 'next/server';
import { google } from '@/utils/google';
import { generateObject, embed } from 'ai';

import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';

function chunkText(text: string, chunkSize: number = 800, overlap: number = 100): string[] {
  const chunks: string[] = [];
  if (!text) return chunks;

  let startIndex = 0;
  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;
    
    // Don't slice in the middle of a word; find the nearest space
    if (endIndex < text.length) {
      const spaceIndex = text.lastIndexOf(' ', endIndex);
      if (spaceIndex > startIndex) {
        endIndex = spaceIndex;
      }
    }
    
    const chunk = text.slice(startIndex, endIndex).trim();
    if (chunk) {
      chunks.push(chunk);
    }
    
    // Move starting index back by the overlap amount (ensuring forward progress)
    const nextIndex = endIndex - overlap;
    if (nextIndex <= startIndex) {
      startIndex = endIndex;
    } else {
      startIndex = nextIndex;
    }
  }
  return chunks;
}

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request payload
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { topic } = body;
    if (!topic || typeof topic !== 'string' || topic.trim() === '') {
      return NextResponse.json({ error: 'A course topic is required.' }, { status: 400 });
    }

    // 3. Call generateObject to structure the course syllabus outline and select icon
    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: z.object({
        title: z.string().describe("A professional, short, and catchy name for the course."),
        icon_name: z.string().describe("Name of a Lucide icon that matches the course topic. Choose from: 'Laptop', 'Brain', 'Cpu', 'Database', 'Sparkles', 'Globe', 'BookOpen', 'Code', 'Terminal', 'LineChart', 'Activity', 'Award', 'Layers', 'Workflow'."),
        syllabus_content: z.string().describe("A comprehensive, detailed markdown syllabus outline. Include 3-4 distinct modules or sections, each filled with detailed paragraphs explaining the concepts, subtopics, and key definitions. This content will be chunked for retrieval context."),
      }),
      prompt: `You are an expert academic curriculum builder. Design a detailed, premium-quality structured course syllabus for the topic: "${topic}". Make the syllabus content informative and deep, so it serves as a great learning resource for study chat.`,
    });

    const { title, icon_name, syllabus_content } = result.object;

    // 4. Insert course into Supabase
    const { data: courseData, error: courseError } = await (supabase as any)
      .from('courses')
      .insert({
        title,
        icon_name,
        progress: 0,
        user_id: user.id,
      })
      .select('id')
      .single();


    if (courseError || !courseData) {
      console.error('Failed to insert course:', courseError);
      return NextResponse.json({ error: 'Failed to create course in the database' }, { status: 500 });
    }

    // 5. Chunk course syllabus content and generate embeddings
    const chunks = chunkText(syllabus_content);
    if (chunks.length > 0) {
      const materialsToInsert: any[] = [];
      
      for (const chunk of chunks) {
        const { embedding } = await embed({
          model: google.textEmbeddingModel('gemini-embedding-2'),
          value: chunk,
        });

        materialsToInsert.push({
          course_id: courseData.id,
          content: chunk,
          embedding,
        });
      }

      // Bulk insert course materials
      const { error: insertError } = await (supabase as any)
        .from('course_materials')
        .insert(materialsToInsert);

      if (insertError) {
        console.error('Failed to save generated course syllabus chunks:', insertError);
        // We continue because the course itself was created successfully
      }
    }

    return NextResponse.json({
      success: true,
      courseId: courseData.id,
      title,
      icon_name,
    });
  } catch (error: any) {
    console.error('Course Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate course' }, { status: 500 });
  }
}
