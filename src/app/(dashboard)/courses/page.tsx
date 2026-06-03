import { createClient } from '@/utils/supabase/server';
import { CourseGrid } from '@/components/CourseGrid';

export const revalidate = 0; // Disable static caching to fetch fresh database entries

export default async function CoursesPage() {
  const supabase = await createClient();

  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch courses:', error);
    throw new Error('Failed to load courses. Please try again later.');
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          My Courses
        </h2>
        <p className="text-slate-400 mt-2 text-sm md:text-base">
          Manage and track your active study curriculums.
        </p>
      </div>

      <CourseGrid courses={courses || []} />
    </div>
  );
}
