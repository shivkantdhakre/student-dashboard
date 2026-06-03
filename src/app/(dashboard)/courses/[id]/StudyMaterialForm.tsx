'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';

interface StudyMaterialFormProps {
  courseId: string;
}

export function StudyMaterialForm({ courseId }: StudyMaterialFormProps) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ error?: string; success?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isUploading) return;

    setIsUploading(true);
    setFeedback({});

    try {
      const response = await fetch('/api/course-materials/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId, text: text.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save study materials');
      }

      setText('');
      setFeedback({ success: `Successfully processed and indexed ${data.chunksCount || 1} material chunks!` });
      router.refresh(); // Refresh page data to show new material chunks
    } catch (err: any) {
      console.error(err);
      setFeedback({ error: err.message || 'Something went wrong. Please try again.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="material-text" className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">
          Paste Course Materials or Notes
        </label>
        <textarea
          id="material-text"
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste extra chapters, study guides, definitions, or custom notes here... (minimum 50 characters recommended)"
          disabled={isUploading}
          className="w-full bg-[#030303]/60 border border-white/5 hover:border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 rounded-2xl p-4 text-xs text-white placeholder-slate-600 outline-none transition-all duration-200 resize-y"
        />
      </div>

      {feedback.error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
          <Icons.AlertCircle size={14} className="text-rose-400 shrink-0" />
          <span>{feedback.error}</span>
        </div>
      )}

      {feedback.success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <Icons.CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
          <span>{feedback.success}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isUploading || !text.trim()}
        className="w-full sm:w-auto py-2.5 px-5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold text-xs transition-all duration-200 flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
      >
        {isUploading ? (
          <>
            <Icons.Loader2 size={12} className="animate-spin" />
            <span>Analyzing & Embedding...</span>
          </>
        ) : (
          <>
            <Icons.UploadCloud size={12} />
            <span>Add Study Material</span>
          </>
        )}
      </button>
    </form>
  );
}
