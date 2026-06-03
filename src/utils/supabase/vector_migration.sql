-- 1. Enable pgvector extension for similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create course_materials table with vector dimensions set to 768 to match Google Gemini text-embedding-004 model
CREATE TABLE IF NOT EXISTS public.course_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  embedding vector(768) NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for course_materials
DROP POLICY IF EXISTS "Users can access materials for their own courses" ON public.course_materials;
CREATE POLICY "Users can access materials for their own courses" ON public.course_materials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_materials.course_id
        AND c.user_id = auth.uid()
    )
  );

-- 5. Build an HNSW vector index for high performance similarity search
CREATE INDEX IF NOT EXISTS course_materials_embedding_idx 
ON public.course_materials 
USING hnsw (embedding vector_cosine_ops);

-- 6. Create RPC match function for querying course materials using cosine similarity
CREATE OR REPLACE FUNCTION public.match_course_materials (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_course_id uuid
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.id,
    cm.content,
    (1 - (cm.embedding <=> query_embedding))::float AS similarity
  FROM public.course_materials cm
  WHERE cm.course_id = filter_course_id
    AND (1 - (cm.embedding <=> query_embedding)) > match_threshold
  ORDER BY cm.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
