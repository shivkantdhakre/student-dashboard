import { NextResponse } from 'next/server';
import { google } from '@ai-sdk/google';
import { embed } from 'ai';
import { createClient } from '@/utils/supabase/server';

function chunkText(text: string, chunkSize: number = 800, overlap: number = 100): string[] {
  const chunks: string[] = [];
  if (!text) return chunks;
  
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize));
    if (i + chunkSize >= text.length) break;
    i += chunkSize - overlap;
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

    // 2. Parse request parameters
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { course_id, text } = body;

    if (!course_id || !text) {
      return NextResponse.json({ error: 'Missing course_id or text content.' }, { status: 400 });
    }

    // 3. Verify user owns the course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('id', course_id)
      .eq('user_id', user.id)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 404 });
    }

    // 4. Split text into chunks
    const chunks = chunkText(text);
    if (chunks.length === 0) {
      return NextResponse.json({ error: 'Text content is too short or empty.' }, { status: 400 });
    }

    // 5. Generate embeddings and save in database
    const materialsToInsert: any[] = [];
    
    for (const chunk of chunks) {
      const { embedding } = await embed({
        model: google.textEmbeddingModel('text-embedding-004'),
        value: chunk,
      });

      materialsToInsert.push({
        course_id,
        content: chunk,
        embedding,
      });
    }

    // Bulk insert chunks
    const { error: insertError } = await (supabase as any)
      .from('course_materials')
      .insert(materialsToInsert);

    if (insertError) {
      console.error('Failed to save course materials:', insertError);
      return NextResponse.json({ error: 'Failed to save course materials in database' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      chunksCount: chunks.length 
    });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process document upload' }, { status: 500 });
  }
}
