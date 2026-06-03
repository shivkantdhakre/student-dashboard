import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import * as Icons from 'lucide-react';

export const revalidate = 0; // Disable static caching to fetch fresh data and recommendations

type IconName = keyof typeof Icons;

export default async function AnalyticsPage() {
  const supabase = await createClient();

  // 1. Authenticate and retrieve user session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // 2. Fetch user profile and courses
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: courses } = await (supabase as any)
    .from('courses')
    .select('*')
    .order('created_at', { ascending: true });

  const activeCourses = (courses as any[]) || [];
  const totalCourses = activeCourses.length;


  // 3. Compute stats
  const completedCourses = activeCourses.filter(c => c.progress === 100).length;
  const inProgressCourses = activeCourses.filter(c => c.progress > 0 && c.progress < 100).length;
  
  const avgProgress = totalCourses > 0 
    ? Math.round(activeCourses.reduce((sum, c) => sum + c.progress, 0) / totalCourses)
    : 0;

  const aiCredits = profile?.ai_credits_remaining ?? 0;
  const emailName = user.email ? user.email.split('@')[0] : 'Student';

  // 4. Generate AI academic recommendation summary (Server-side RAG/Context feed)
  let aiSummary = "Create or generate a course syllabus on your dashboard to receive personalized AI recommendations and study milestones.";
  
  if (totalCourses > 0) {
    const coursesListText = activeCourses.map(c => `- ${c.title}: ${c.progress}% progress`).join('\n');
    try {
      const response = await generateText({
        model: google('gemini-1.5-flash'),
        prompt: `You are a smart personal academic learning advisor. Analyze the progress of this student:
Student Name: ${emailName}
Courses list and progress:
${coursesListText}

Generate a short, friendly, and actionable study recommendation (exactly 2-3 sentences). Address the student directly by their name. Mention specific courses where they have stalled or are making good progress, and suggest a precise task for today (e.g. recommend spending 15 minutes reviewing a specific course topic). Tone should be premium, modern, and highly encouraging. Return ONLY the plain text sentences. No markdown formatting, asterisks, or quotes.`,
      });
      aiSummary = response.text.trim();
    } catch (error) {
      console.error('Failed to generate AI analytics summary:', error);
      aiSummary = `Hey ${emailName}, you are currently managing ${totalCourses} courses with an average progress of ${avgProgress}%. Keep reviewing your syllabus materials daily and ask the Study Copilot if you have any questions!`;
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Title Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Smart Analytics
        </h2>
        <p className="text-slate-400 mt-2 text-sm md:text-base">
          Personalized study recommendations and course progression insights.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Courses */}
        <div className="rounded-2xl border border-white/5 bg-[#09090b]/40 p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Courses</span>
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

        {/* Completed Courses */}
        <div className="rounded-2xl border border-white/5 bg-[#09090b]/40 p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Completed</span>
            <p className="text-2xl font-black text-white mt-1">{completedCourses}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <Icons.CheckCircle2 size={20} />
          </div>
        </div>

        {/* Remaining Credits */}
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

      {/* AI Personal Advisor Recommendations Card */}
      <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/20 via-slate-950/10 to-purple-950/20 p-6 md:p-8 relative overflow-hidden shadow-lg shadow-indigo-950/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="p-4 bg-indigo-600/15 border border-indigo-500/30 rounded-2xl text-indigo-400 shrink-0">
            <Icons.Sparkles size={28} className="animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full">
                AI Personal Advisor
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-white">Daily Study Recommendations</h3>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed font-medium">
              "{aiSummary}"
            </p>
          </div>
        </div>
      </div>

      {/* Course Breakdown Chart/List */}
      <div className="rounded-3xl border border-white/5 bg-[#09090b]/40 p-6 md:p-8 space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Icons.LayoutDashboard size={18} className="text-indigo-400" />
          Active Courses Breakdown
        </h3>

        {totalCourses === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No courses found to display analytics.</p>
        ) : (
          <div className="space-y-4">
            {activeCourses.map((course) => {
              const iconKey = course.icon_name as IconName;
              const CourseIcon = (Icons[iconKey] as React.ElementType) || Icons.BookOpen;
              const isDone = course.progress === 100;
              
              return (
                <div key={course.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-500/20 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-xl shrink-0 ${isDone ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-slate-300 border border-zinc-700'}`}>
                      <CourseIcon size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-sm truncate">{course.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {isDone ? 'Completed Milestone' : 'In-Progress Syllabus'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-1 md:max-w-xs">
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
                    {isDone && (
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0" title="Completed">
                        <Icons.Award size={14} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
