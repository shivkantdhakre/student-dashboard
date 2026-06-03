'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';

import { DefaultChatTransport } from 'ai';
import { Course } from '@/types/database.types';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const markdownComponents: any = {
  p: ({ children }: any) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
  strong: ({ children }: any) => <strong className="font-extrabold text-white">{children}</strong>,
  em: ({ children }: any) => <em className="italic text-slate-300">{children}</em>,
  ul: ({ children }: any) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children}</ol>,
  li: ({ children }: any) => <li className="text-slate-300">{children}</li>,
  code: ({ node, className, children, ...props }: any) => {
    return (
      <code className="bg-white/10 px-1 py-0.5 rounded text-[10px] font-mono text-indigo-300" {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }: any) => (
    <pre className="bg-[#030303]/60 border border-white/5 p-3 rounded-xl overflow-x-auto my-2 font-mono text-[10px] text-slate-200">
      {children}
    </pre>
  ),
};

interface AICopilotProps {
  initialCourses: Course[];
}

export function AICopilot({ initialCourses }: AICopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Set default selected course if available
  useEffect(() => {
    if (initialCourses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(initialCourses[0].id);
    }
  }, [initialCourses, selectedCourseId]);

  const activeCourse = initialCourses.find(c => c.id === selectedCourseId);

  // Ref to hold setMessages for custom fetch response interceptor
  const setMessagesRef = useRef<any>(null);

  // Manage input field state locally for useChat compatibility
  const [inputValue, setInputValue] = useState('');

  // Store selectedCourseId in a Ref to prevent stale closures in DefaultChatTransport body resolver
  const selectedCourseIdRef = useRef(selectedCourseId);

  useEffect(() => {
    selectedCourseIdRef.current = selectedCourseId;
  }, [selectedCourseId]);

  // Vercel AI SDK v6 requires transport configuration for endpoint details.
  // We keep the transport reference stable and resolve selectedCourseId dynamically.
  const transport = React.useMemo(() => {
    return new DefaultChatTransport({
      api: '/api/chat',
      body: () => ({
        course_id: selectedCourseIdRef.current,
      }),
      fetch: async (input, init) => {
        const response = await fetch(input, init);
        if (response.status === 402 && setMessagesRef.current) {
          setMessagesRef.current((prev: any) => [
            ...prev,
            {
              id: 'credit-error-' + Date.now(),
              role: 'assistant',
              parts: [{ type: 'text', text: '❌ AI credits exhausted. Please purchase a credit pack on the Pricing page to continue using the Study Copilot.' }],
            },
          ]);
        }
        return response;
      }
    });
  }, []);


  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
    onError(error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: 'chat-error-' + Date.now(),
          role: 'assistant',
          parts: [{ type: 'text', text: '⚠️ An error occurred while generating a response. Please try again.' }],
        },
      ]);
    }
  });

  // Keep ref up to date
  useEffect(() => {
    setMessagesRef.current = setMessages;
  }, [setMessages]);

  const isLoading = status === 'submitted' || status === 'streaming';


  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || initialCourses.length === 0) return;
    const textToSend = inputValue.trim();
    setInputValue('');
    await sendMessage({ text: textToSend });
  };

  // Clear chat logs when course changes
  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    setMessages([]);
    setIsDropdownOpen(false);
  };

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Framer motion variants
  const panelVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 50 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 25
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      y: 50,
      transition: {
        duration: 0.2
      }
    }
  };

  const buttonVariants = {
    closed: { scale: 1 },
    open: { scale: 0.9, rotate: 90 }
  };

  const selectedIconKey = (activeCourse?.icon_name || 'BookOpen') as keyof typeof Icons;
  const ActiveCourseIcon = (Icons[selectedIconKey] as React.ElementType) || Icons.BookOpen;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-[400px] h-[580px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)] rounded-3xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl flex flex-col shadow-2xl overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-[#09090b]/80 flex flex-col gap-2 relative z-20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Icons.Sparkles size={16} />
                  </div>
                  <h4 className="font-bold text-white text-sm">AI Study Copilot</h4>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <Icons.X size={16} />
                </button>
              </div>

              {/* Course Selector Dropdown */}
              {initialCourses.length > 0 ? (
                <div className="relative mt-1">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 hover:border-indigo-500/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ActiveCourseIcon size={14} className="text-indigo-400 shrink-0" />
                      <span className="truncate font-semibold">{activeCourse?.title}</span>
                    </div>
                    <Icons.ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute left-0 right-0 mt-1 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-xl max-h-48 overflow-y-auto z-30"
                      >
                        {initialCourses.map((course) => {
                          const iconKey = course.icon_name as keyof typeof Icons;
                          const CourseIcon = (Icons[iconKey] as React.ElementType) || Icons.BookOpen;
                          const isSelected = course.id === selectedCourseId;
                          
                          return (
                            <button
                              key={course.id}
                              onClick={() => handleCourseChange(course.id)}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors cursor-pointer
                                ${isSelected 
                                  ? 'bg-indigo-600 text-white' 
                                  : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                            >
                              <CourseIcon size={14} className={isSelected ? 'text-white' : 'text-slate-400'} />
                              <span className="truncate">{course.title}</span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-xs text-rose-400 bg-rose-950/20 border border-rose-950/40 rounded-xl px-3 py-2 font-medium">
                  Create a course first to start chat.
                </div>
              )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-w-0">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400">
                    <Icons.MessageSquareQuote size={32} />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">Ask a question</h5>
                    <p className="text-xs text-slate-400 max-w-[240px] mt-1 leading-relaxed">
                      Type a query about the course syllabus or materials. AI will use RAG context to reply.
                    </p>
                  </div>
                  {activeCourse && (
                    <div className="flex flex-col gap-2 w-full pt-4">
                      <button
                        onClick={() => sendMessage({ text: `Summarize the course syllabus of "${activeCourse.title}"` })}
                        className="text-left bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-[10px] text-slate-300 hover:border-indigo-500/30 hover:bg-indigo-950/10 hover:text-white transition-all text-ellipsis overflow-hidden whitespace-nowrap cursor-pointer animate-none"
                      >
                        💡 Summarize the course syllabus
                      </button>
                      <button
                        onClick={() => sendMessage({ text: `What are the key topics in "${activeCourse.title}"?` })}
                        className="text-left bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-[10px] text-slate-300 hover:border-indigo-500/30 hover:bg-indigo-950/10 hover:text-white transition-all text-ellipsis overflow-hidden whitespace-nowrap cursor-pointer animate-none"
                      >
                        💡 What are the key topics?
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                messages.map((message) => {
                  const isAI = message.role === 'assistant';
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 max-w-[85%] ${isAI ? 'self-start' : 'self-end ml-auto flex-row-reverse'}`}
                    >
                      {/* Avatar */}
                      <div className={`w-7 h-7 rounded-xl shrink-0 flex items-center justify-center text-xs border shadow-sm
                        ${isAI 
                          ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                          : 'bg-zinc-800 border-zinc-700 text-slate-300'}`}
                      >
                        {isAI ? <Icons.Bot size={14} /> : <Icons.User size={14} />}
                      </div>

                      {/* Bubble */}
                      <div className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed border whitespace-pre-wrap break-words
                        ${isAI 
                          ? 'bg-white/5 border-white/5 text-slate-200' 
                          : 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10'}`}
                      >
                        {message.parts.map((part: any, pIdx) => {
                          if (part.type === 'text') {
                            if (isAI) {
                              return (
                                <ReactMarkdown key={pIdx} components={markdownComponents}>
                                  {part.text}
                                </ReactMarkdown>
                              );
                            }
                            return <span key={pIdx}>{part.text}</span>;
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  );
                })
              )}
              {isLoading && (
                <div className="flex gap-3 max-w-[85%] self-start">
                  <div className="w-7 h-7 rounded-xl shrink-0 flex items-center justify-center text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Icons.Bot size={14} className="animate-pulse" />
                  </div>
                  <div className="rounded-2xl px-3.5 py-2.5 text-xs bg-white/5 border border-white/5 text-slate-400 flex items-center gap-2">
                    <Icons.Loader2 size={12} className="animate-spin text-indigo-400" />
                    Analyzing course materials...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleFormSubmit} className="p-4 border-t border-white/5 bg-[#09090b]/80 flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={initialCourses.length > 0 ? "Ask study assistant..." : "Please create a course first."}
                disabled={isLoading || initialCourses.length === 0}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim() || initialCourses.length === 0}
                className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0 cursor-pointer shadow-md shadow-indigo-600/15"
              >
                <Icons.Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        variants={buttonVariants}
        animate={isOpen ? 'open' : 'closed'}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 cursor-pointer focus:outline-none relative border border-indigo-400/20"
      >
        {isOpen ? (
          <Icons.X size={24} />
        ) : (
          <>
            <Icons.MessageSquare size={24} />
            {/* Sparkles animation decoration */}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full border-2 border-slate-950 flex items-center justify-center">
              <Icons.Sparkles size={8} className="text-white animate-pulse" />
            </span>
          </>
        )}
      </motion.button>
    </div>
  );
}

