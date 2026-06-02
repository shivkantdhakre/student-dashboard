'use client';

import { Course } from '@/types/database.types';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';

interface CourseGridProps {
  courses: Course[];
}

// Framer Motion container variants for staggered child entrance
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

// Framer Motion child card variants with custom spring physics
const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    } as const
  },
};

// Physics spring config for interactive states (hover/progress loading)
const springTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 20,
} as const;

export function CourseGrid({ courses }: CourseGridProps) {
  if (courses.length === 0) {
    return (
      <section className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#09090b]/40 p-12 text-center">
        <Icons.BookOpen size={48} className="text-slate-600 mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">No courses found</h3>
        <p className="text-sm text-slate-400 max-w-sm">
          Your database courses table is currently empty. Populate some rows in your Supabase database to see them here.
        </p>
      </section>
    );
  }

  return (
    <motion.section 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[220px]"
    >
      {courses.map((course, idx) => {
        // Dynamically resolve the Lucide icon, fallback to BookOpen if not found
        const IconComponent = (Icons as any)[course.icon_name] || Icons.BookOpen;

        // Bento grid spans
        const isFeatured = idx === 0;
        const gridSpan = isFeatured 
          ? 'md:col-span-2 md:row-span-2 h-full' 
          : 'md:col-span-1 h-full';

        return (
          <motion.article
            key={course.id}
            variants={cardVariants}
            whileHover={{ scale: 1.015, y: -2 }}
            transition={springTransition}
            className={`rounded-3xl border border-white/5 bg-[#09090b]/40 p-6 flex flex-col justify-between relative overflow-hidden group hover:border-indigo-500/30 transition-colors duration-300 cursor-pointer ${gridSpan}`}
          >
            {/* Subtle animated border glow backdrop */}
            <motion.div 
              className="absolute -inset-px bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 pointer-events-none rounded-3xl"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />

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
                {/* Custom Gradient Progress Bar (uses scaleX & origin-left to prevent layout shifts) */}
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: course.progress / 100 }}
                    transition={{
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
        );
      })}
    </motion.section>
  );
}
