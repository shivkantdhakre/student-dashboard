import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import * as Icons from 'lucide-react';
import Link from 'next/link';
import { StudyMaterialForm } from './StudyMaterialForm';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

type IconName = keyof typeof Icons;

export const revalidate = 0; // Disable static caching to fetch fresh database entries

export default async function CourseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // 2. Fetch course details
  const { data: course, error: courseError } = await (supabase as any)
    .from('courses')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (courseError || !course) {
    console.error('Course fetch error:', courseError);
    redirect('/courses');
  }

  // 3. Fetch course materials (syllabus chunks, custom study notes)
  const { data: materials, error: materialsError } = await (supabase as any)
    .from('course_materials')
    .select('id, content, created_at')
    .eq('course_id', id)
    .order('created_at', { ascending: true });

  const iconKey = course.icon_name as IconName;
  const CourseIcon = (Icons[iconKey] as React.ElementType) || Icons.BookOpen;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Back Button & Navigation Path */}
      <div className="flex items-center justify-between">
        <Link 
          href="/courses"
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer group"
        >
          <Icons.ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Courses
        </Link>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
          Course ID: {course.id.slice(0, 8)}...
        </span>
      </div>

      {/* Banner Card Header */}
      <div className="rounded-3xl border border-indigo-500/10 bg-gradient-to-r from-indigo-950/10 via-slate-950/10 to-purple-950/10 p-6 md:p-8 relative overflow-hidden shadow-lg shadow-indigo-950/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
            <CourseIcon size={28} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
              Active Curriculum
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-white mt-0.5">
              {course.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Syllabus & Custom Materials Chunks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-white/5 bg-[#09090b]/40 p-6 md:p-8 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Icons.BookOpen size={18} className="text-indigo-400" />
              Syllabus & Learning Materials
            </h3>

            {materialsError || !materials || materials.length === 0 ? (
              <div className="text-center py-12 space-y-3 bg-[#030303]/30 border border-dashed border-white/5 rounded-2xl">
                <Icons.FileText size={32} className="text-slate-600 mx-auto" />
                <div>
                  <h5 className="font-bold text-white text-sm">No course materials yet</h5>
                  <p className="text-xs text-slate-500 mt-1 max-w-[280px] mx-auto">
                    Paste some textbook notes or lecture scripts on the right side to build up study context.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {materials.map((material: any, idx: number) => (
                  <div 
                    key={material.id}
                    className="p-5 bg-[#030303]/40 border border-white/5 hover:border-white/10 rounded-2xl space-y-3 transition-colors relative group"
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                        Section {idx + 1}
                      </span>
                      <time className="text-[10px] text-slate-500 font-medium font-mono">
                        {new Date(material.created_at).toLocaleDateString()}
                      </time>
                    </div>
                    {/* Render content as text blocks preserving linebreaks */}
                    <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {material.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Upload Notes Action */}
        <div className="rounded-3xl border border-white/5 bg-[#09090b]/40 p-6 md:p-8 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Icons.PlusSquare size={18} className="text-indigo-400" />
            Study Workspace
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Upload course readings or personal notes. Our AI processes your uploaded materials and integrates them into the **Study Copilot** chat instantly.
          </p>

          <div className="border-t border-white/5 pt-4">
            <StudyMaterialForm courseId={course.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
