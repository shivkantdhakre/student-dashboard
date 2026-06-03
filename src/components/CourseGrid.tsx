'use client';

import React from 'react';
import { Course } from '@/types/database.types';
import * as Icons from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CourseGridProps {
  courses: Course[];
}

type IconName = keyof typeof Icons;

export function CourseGrid({ courses }: CourseGridProps) {
  const shouldReduceMotion = useReducedMotion();
  const router = useRouter();

  // State for AI generator tile
  const [topic, setTopic] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState('');

  // Framer Motion container variants for staggered child entrance
  const activeContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
      },
    },
  };

  // Framer Motion child card variants with custom spring physics
  const activeCardVariants = {
    hidden: { 
      opacity: 0, 
      y: shouldReduceMotion ? 0 : 20 
    },
    show: { 
      opacity: 1, 
      y: 0,
      transition: shouldReduceMotion 
        ? { duration: 0.1 } 
        : {
            type: 'spring' as const,
            stiffness: 300,
            damping: 20,
          }
    },
  };

  // Physics spring config for interactive states (hover/progress loading)
  const activeTransition = shouldReduceMotion 
    ? { duration: 0.1 } 
    : {
        type: 'spring' as const,
        stiffness: 300,
        damping: 20,
      };

  const hoverAnimation = shouldReduceMotion ? {} : { scale: 1.015, y: -2 };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/courses/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate course');
      }

      setTopic('');
      router.refresh(); // Refresh page data to show new course
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (courses.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center rounded-3xl border border-white/5 bg-[#09090b]/40 p-8 md:p-12 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="space-y-4">
          <div className="p-3 w-fit rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
            <Icons.BookOpen size={32} className="text-indigo-400" />
          </div>
          <h3 className="text-2xl font-extrabold text-white">Your study board is empty</h3>
          <p className="text-sm text-slate-400 max-w-md leading-relaxed">
            Welcome to Academia! You don't have any active courses yet. Enter a topic you want to study on the right, and our AI will build a complete structured curriculum for you instantly.
          </p>
        </div>

        <motion.div
          variants={activeCardVariants}
          initial="hidden"
          animate="show"
          className="rounded-3xl border border-dashed border-indigo-500/30 bg-indigo-500/5 p-6 md:p-8 relative overflow-hidden group hover:border-indigo-400/50 transition-colors duration-300"
        >
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Icons.Sparkles size={20} className="text-indigo-400 animate-pulse" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full">
                  AI Powered
                </span>
              </div>
              <h3 className="font-extrabold text-white text-lg leading-snug">
                Generate Course
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Let AI build a personalized curriculum and syllabus for any topic you want to master.
              </p>
            </div>

            <form onSubmit={handleGenerate} className="mt-6 space-y-3">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Advanced React Hooks"
                disabled={isGenerating}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
              {error && <p className="text-[10px] text-rose-400 font-semibold">{error}</p>}
              <button
                type="submit"
                disabled={isGenerating || !topic.trim()}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all duration-200 shadow-md shadow-indigo-500/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Icons.Loader2 size={12} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Icons.Sparkles size={12} />
                    Generate Syllabus
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.section 
      variants={activeContainerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[220px]"
    >
      {courses.map((course, idx) => {
        // Dynamically resolve the Lucide icon, fallback to BookOpen if not found
        const iconKey = course.icon_name as IconName;
        const IconComponent = (Icons[iconKey] as React.ElementType) || Icons.BookOpen;

        // Bento grid spans
        const isFeatured = idx === 0;
        const gridSpan = isFeatured 
          ? 'md:col-span-2 md:row-span-2 h-full' 
          : 'md:col-span-1 h-full';

        return (
          <Link href={`/courses/${course.id}`} key={course.id} className={gridSpan}>
            <motion.article
              variants={activeCardVariants}
              whileHover={hoverAnimation}
              transition={activeTransition}
              className="rounded-3xl border border-white/5 bg-[#09090b]/40 p-6 flex flex-col justify-between relative overflow-hidden group hover:border-indigo-500/30 transition-colors duration-300 cursor-pointer h-full"
            >
            {/* Subtle animated border glow backdrop */}
            {!shouldReduceMotion && (
              <motion.div 
                className="absolute -inset-px bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 pointer-events-none rounded-3xl"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}

            {/* Top row: Icon and Date */}
            <div className="relative z-10 flex items-start justify-between">
              <div className={`p-3 rounded-2xl ${isFeatured ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-white/5 border border-white/5'} flex items-center justify-center`}>
                <IconComponent 
                  size={isFeatured ? 24 : 20} 
                  className={isFeatured ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200 transition-colors'} 
                />
              </div>
              <time className="text-xs text-slate-500 font-medium">
                {new Date(course.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </time>
            </div>

            {/* Middle/Bottom: Title & Progress */}
            <div className="relative z-10 mt-6 flex-grow flex flex-col justify-end">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                  {isFeatured ? 'Featured Course' : 'Active Study'}
                </span>
                <h3 className={`font-extrabold text-white mt-1 group-hover:text-indigo-300 transition-colors duration-200 leading-snug ${isFeatured ? 'text-2xl' : 'text-lg'}`}>
                  {course.title}
                </h3>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs text-slate-400">Progress</span>
                  <span className="text-xs font-bold text-slate-200">{course.progress}%</span>
                </div>
                {/* Custom Gradient Progress Bar */}
                <div 
                  role="progressbar" 
                  aria-valuenow={course.progress} 
                  aria-valuemin={0} 
                  aria-valuemax={100}
                  aria-label={`${course.title} progress`}
                  className="w-full bg-white/5 h-2 rounded-full overflow-hidden"
                >
                  <motion.div
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: course.progress / 100 }}
                    transition={shouldReduceMotion ? { duration: 0.1 } : {
                      type: 'spring',
                      stiffness: 300,
                      damping: 20,
                      delay: 0.2 + idx * 0.05 // Staggered progress loading for a premium loading experience
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.article>
        </Link>
      );
      })}

      {/* AI Course Generator Bento Card */}
      <motion.article
        variants={activeCardVariants}
        whileHover={hoverAnimation}
        transition={activeTransition}
        className="rounded-3xl border border-dashed border-indigo-500/30 bg-indigo-500/5 p-6 flex flex-col justify-between relative overflow-hidden group hover:border-indigo-400/50 transition-colors duration-300 md:col-span-1 h-full"
      >
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Icons.Sparkles size={20} className="text-indigo-400 animate-pulse" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full">
                AI Powered
              </span>
            </div>
            <h3 className="font-extrabold text-white text-lg leading-snug">
              Generate Course
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Build a custom syllabus for any topic and get immediate learning materials.
            </p>
          </div>

          <form onSubmit={handleGenerate} className="mt-4 space-y-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Advanced React Hooks"
              disabled={isGenerating}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
            {error && <p className="text-[10px] text-rose-400 font-semibold">{error}</p>}
            <button
              type="submit"
              disabled={isGenerating || !topic.trim()}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all duration-200 shadow-md shadow-indigo-500/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Icons.Loader2 size={12} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Icons.Sparkles size={12} />
                  Generate Syllabus
                </>
              )}
            </button>
          </form>
        </div>
      </motion.article>
    </motion.section>
  );
}

