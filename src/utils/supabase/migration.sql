-- 1. Create a profiles table for storing additional user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text,
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  ai_credits_remaining integer DEFAULT 10,
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Enable Row Level Security (RLS) on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for profiles
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
CREATE POLICY "Users can read their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 4. Clean up any existing courses that don't have a user associated
DELETE FROM public.courses;

-- 5. Add user_id column to courses and set as NOT NULL to enforce multi-tenancy
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users ON DELETE CASCADE;
ALTER TABLE public.courses ALTER COLUMN user_id SET NOT NULL;

-- 6. Enable RLS on courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for courses
DROP POLICY IF EXISTS "Allow public read access" ON public.courses;
DROP POLICY IF EXISTS "Users can select their own courses" ON public.courses;
CREATE POLICY "Users can select their own courses" ON public.courses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own courses" ON public.courses;
CREATE POLICY "Users can insert their own courses" ON public.courses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own courses" ON public.courses;
CREATE POLICY "Users can update their own courses" ON public.courses
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own courses" ON public.courses;
CREATE POLICY "Users can delete their own courses" ON public.courses
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Create a trigger that auto-creates a user profile and seeds default courses when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, email, subscription_tier, ai_credits_remaining)
  VALUES (new.id, new.email, 'free', 10);

  -- Seed default courses for the new user
  INSERT INTO public.courses (title, progress, icon_name, user_id) VALUES
    ('Introduction to Web Development', 85, 'Laptop', new.id),
    ('Advanced React & Next.js App Router', 45, 'Globe', new.id),
    ('Framer Motion Animation Masterclass', 72, 'Sparkles', new.id),
    ('Database Design with Postgres & Supabase', 20, 'Database', new.id),
    ('Sleek Styling with Tailwind CSS', 95, 'Layers', new.id);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
