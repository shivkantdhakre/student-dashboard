import { createClient } from '@/utils/supabase/server';
import { CourseGrid } from '@/components/CourseGrid';

export const revalidate = 0; // Disable static caching to fetch fresh database entries

export default async function Page() {
  const supabase = await createClient();

  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch courses:', error);
    throw new Error('Failed to load dashboard data. Please try again later.');
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Dashboard Section Title */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Student Progress Dashboard
        </h2>
        <p className="text-slate-400 mt-2 text-sm md:text-base">
          Track your educational milestones, course progress, and schedules.
        </p>
      </div>

      {/* Bento Grid Container */}
      <CourseGrid courses={courses || []} />
    </div>
  );
}
