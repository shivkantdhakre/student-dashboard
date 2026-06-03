import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import * as Icons from 'lucide-react';
import Link from 'next/link';
import { TrackClick } from '@/components/TrackClick';

export const revalidate = 0; // Disable static caching to fetch fresh database entries

type IconName = keyof typeof Icons;

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // 2. Fetch user profile & courses
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch courses:', error);
    throw new Error('Failed to load dashboard data. Please try again later.');
  }

  const activeCourses = (courses as any[]) || [];
  const totalCourses = activeCourses.length;

  // Calculate statistics
  const avgProgress = totalCourses > 0 
    ? Math.round(activeCourses.reduce((sum, c) => sum + c.progress, 0) / totalCourses)
    : 0;

  const completedCount = activeCourses.filter(c => c.progress === 100).length;
  const aiCredits = profile?.ai_credits_remaining ?? 0;
  const username = user.email ? user.email.split('@')[0] : 'Student';

  // Get top 3 most recently active/created courses for quick access
  const recentCourses = activeCourses.slice(-3);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Title */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Welcome back, {username}!
        </h2>
        <p className="text-slate-400 mt-2 text-sm md:text-base">
          Here is a summary of your academic progress, metrics, and active studies.
        </p>
      </div>

      {/* Stats Bento Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Courses */}
        <div className="rounded-2xl border border-white/5 bg-[#09090b]/40 p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">My Courses</span>
            <p className="text-2xl font-black text-white mt-1">{totalCourses}</p>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <Icons.BookOpen size={20} />
          </div>
        </div>

        {/* Avg Progress */}
        <div className="rounded-2xl border border-white/5 bg-[#09090b]/40 p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Avg Progress</span>
            <p className="text-2xl font-black text-white mt-1">{avgProgress}%</p>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <Icons.LineChart size={20} />
          </div>
        </div>

        {/* Completed */}
        <div className="rounded-2xl border border-white/5 bg-[#09090b]/40 p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Completed</span>
            <p className="text-2xl font-black text-white mt-1">{completedCount}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <Icons.CheckCircle2 size={20} />
          </div>
        </div>

        {/* AI Credits */}
        <div className="rounded-2xl border border-white/5 bg-[#09090b]/40 p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">AI Credits</span>
            <p className="text-2xl font-black text-white mt-1">{aiCredits}</p>
          </div>
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
            <Icons.Zap size={20} />
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Courses & Study Milestones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Courses List */}
        <div className="md:col-span-2 rounded-3xl border border-white/5 bg-[#09090b]/40 p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Icons.LayoutDashboard size={18} className="text-indigo-400" />
              Recently Active Courses
            </h3>
            <Link 
              href="/courses" 
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              View all library
              <Icons.ChevronRight size={14} />
            </Link>
          </div>

          {recentCourses.length === 0 ? (
            <div className="text-center py-12 space-y-3 bg-[#030303]/30 border border-dashed border-white/5 rounded-2xl">
              <Icons.FileText size={32} className="text-slate-600 mx-auto" />
              <div>
                <h5 className="font-bold text-white text-sm font-sans">No active courses yet</h5>
                <p className="text-xs text-slate-500 mt-1 max-w-[280px] mx-auto">
                  Go to the Courses tab to create your first learning syllabus dynamically.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {recentCourses.map((course) => {
                const iconKey = course.icon_name as IconName;
                const CourseIcon = (Icons[iconKey] as React.ElementType) || Icons.BookOpen;
                const isDone = course.progress === 100;

                return (
                  <TrackClick
                    key={course.id}
                    eventName="bento_tile_clicked"
                    properties={{ tile_id: 'recent_course', course_id: course.id }}
                  >
                    <Link 
                      href={`/courses/${course.id}`} 
                      className="block bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-500/20 hover:bg-white-[0.02] transition-all"
                    >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2.5 rounded-xl shrink-0 ${isDone ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-slate-300 border border-zinc-700'}`}>
                        <CourseIcon size={18} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-sm truncate">{course.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {isDone ? 'Completed Milestone' : 'In-Progress Study'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-1 sm:max-w-xs">
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400 font-medium">Completion</span>
                          <span className={`font-bold ${isDone ? 'text-emerald-400' : 'text-slate-200'}`}>
                            {course.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${isDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-purple-600'}`}
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    </Link>
                  </TrackClick>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Quick Action Bento slot */}
        <div className="rounded-3xl border border-indigo-500/15 bg-gradient-to-br from-indigo-950/20 via-slate-950/10 to-purple-950/20 p-6 md:p-8 flex flex-col justify-between relative overflow-hidden shadow-lg shadow-indigo-950/5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-4">
            <div className="p-3 w-fit rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Icons.Sparkles size={24} className="animate-pulse" />
            </div>
            <h4 className="text-lg font-extrabold text-white leading-snug">
              Curriculum Generator
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Want to learn something new today? Visit the Courses page to input any topic and let AI compile a personalized syllabus with matching lessons!
            </p>
          </div>

          <div className="pt-6">
            <TrackClick eventName="bento_tile_clicked" properties={{ tile_id: 'add_new_course_shortcut' }}>
              <Link 
                href="/courses"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/15"
              >
                <Icons.Plus size={12} />
                Add New Course
              </Link>
            </TrackClick>
          </div>
        </div>
      </div>
    </div>
  );
}
