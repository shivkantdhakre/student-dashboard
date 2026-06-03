import { NextResponse } from 'next/server';
import { google } from '@ai-sdk/google';
import { embed, streamText } from 'ai';
import { createClient as createSupabaseServerClient } from '@/utils/supabase/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate request parameters
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { messages, course_id } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required.' }, { status: 400 });
    }

    if (!course_id) {
      return NextResponse.json({ error: 'Course ID is required.' }, { status: 400 });
    }

    // 3. Initialize Admin Client to verify credit balance and query database
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY.');
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
    }

    const supabaseAdmin = createSupabaseAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    // Fetch user credits
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('ai_credits_remaining')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Failed to fetch profile credits:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 500 });
    }

    const credits = profile.ai_credits_remaining ?? 0;
    if (credits <= 0) {
      return NextResponse.json(
        { error: 'AI credits exhausted. Please upgrade your plan or top up.' }, 
        { status: 402 } // Payment Required
      );
    }

    // 4. Perform vector similarity search for course materials (RAG)
    const latestMessage = messages[messages.length - 1].content;
    let contextText = 'No relevant course materials found.';

    try {
      // Generate embedding vector for the user query (dimension 768)
      const { embedding } = await embed({
        model: google.textEmbeddingModel('text-embedding-004'),
        value: latestMessage,
      });

      // Call database match function via RPC
      const { data: matchedMaterials, error: matchError } = await supabaseAdmin.rpc('match_course_materials', {
        query_embedding: embedding,
        match_threshold: 0.3, // Similarity match threshold
        match_count: 3,       // Return top 3 matched chunks
        filter_course_id: course_id,
      });

      if (matchError) {
        console.error('Error matching course materials vector:', matchError);
      } else if (matchedMaterials && matchedMaterials.length > 0) {
        contextText = matchedMaterials.map((m: any) => m.content).join('\n\n');
      }
    } catch (vectorError) {
      console.error('RAG vector retrieval failed:', vectorError);
    }

    // 5. Build prompt injecting retrieved course context
    const systemPrompt = `You are a helpful academic study assistant. Use the following course materials to answer the student's questions. If the material does not contain the answer, use your general knowledge but mention it is not in the course materials.
    
Course Materials:
${contextText}`;

    // 6. Stream completion using Vercel AI SDK & Google Gemini model
    const result = streamText({
      model: google('gemini-1.5-flash'),
      messages,
      system: systemPrompt,
      onFinish: async () => {
        // Atomically deduct 1 AI credit on finish of stream
        const { error: deductError } = await supabaseAdmin.rpc('increment_credits', {
          user_id: user.id,
          amount: -1,
        });
        if (deductError) {
          console.error(`Failed to deduct credit for user ${user.id}:`, deductError);
        } else {
          console.log(`Deducted 1 credit for user ${user.id} query.`);
        }
      }
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate AI response' }, { status: 500 });
  }
}
