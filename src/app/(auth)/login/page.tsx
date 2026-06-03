'use client';

import React, { useState, useActionState, startTransition } from 'react';
import { 
  loginWithEmail, 
  signupWithEmail, 
  loginWithMagicLink, 
  loginWithGoogle 
} from './actions';
import { 
  Mail, 
  Lock, 
  Sparkles, 
  BookOpen, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'signin' | 'signup' | 'magiclink';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<Tab>('signin');

  // React 19 form actions using useActionState
  const [signInState, signInAction, isSignInPending] = useActionState(
    loginWithEmail, 
    null
  );
  
  const [signUpState, signUpAction, isSignUpPending] = useActionState(
    signupWithEmail, 
    null
  );
  
  const [magicLinkState, magicLinkAction, isMagicLinkPending] = useActionState(
    loginWithMagicLink, 
    null
  );

  const [isGooglePending, setIsGooglePending] = useState(false);

  const handleGoogleLogin = () => {
    setIsGooglePending(true);
    startTransition(() => {
      loginWithGoogle();
    });
  };

  const currentFeedback = 
    activeTab === 'signin' ? signInState : 
    activeTab === 'signup' ? signUpState : 
    magicLinkState;

  const currentPending = 
    activeTab === 'signin' ? isSignInPending : 
    activeTab === 'signup' ? isSignUpPending : 
    isMagicLinkPending;

  const currentAction = 
    activeTab === 'signin' ? signInAction : 
    activeTab === 'signup' ? signUpAction : 
    magicLinkAction;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#030303] text-slate-100 font-sans p-4 relative overflow-hidden">
      {/* Dynamic ambient backgrounds */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4"
          >
            <BookOpen className="text-white" size={24} />
          </motion.div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Welcome to ACADEMIA
          </h1>
          <p className="text-slate-400 text-sm mt-2 text-center max-w-xs">
            Your centralized multi-tenant learning workspace and progress tracker.
          </p>
        </div>

        {/* Auth Box Container */}
        <div className="rounded-3xl border border-white/5 bg-[#09090b]/40 backdrop-blur-xl p-8 relative overflow-hidden shadow-2xl shadow-indigo-950/5">
          {/* Subtle top-border glow */}
          <div className="absolute -inset-px bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 pointer-events-none rounded-3xl" />

          {/* Form Tabs */}
          <div className="flex border-b border-white/5 mb-6 p-0.5 bg-white/5 rounded-xl">
            <button
              onClick={() => setActiveTab('signin')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'signin' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'signup' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => setActiveTab('magiclink')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'magiclink' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Magic Link
            </button>
          </div>

          {/* Error and Success Notifications */}
          <AnimatePresence mode="wait">
            {currentFeedback?.error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-xs flex items-center gap-2"
              >
                <AlertCircle size={14} className="shrink-0 text-red-400" />
                <span>{currentFeedback.error}</span>
              </motion.div>
            )}

            {currentFeedback?.success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs flex items-center gap-2"
              >
                <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
                <span>{currentFeedback.success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Authentication Forms */}
          <form action={currentAction} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail size={16} />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="name@university.edu"
                  className="w-full bg-[#030303]/60 border border-white/5 hover:border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 outline-none transition-all duration-200"
                />
              </div>
            </div>

            {activeTab !== 'magiclink' && (
              <div>
                <label htmlFor="password" className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Lock size={16} />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full bg-[#030303]/60 border border-white/5 hover:border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 outline-none transition-all duration-200"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={currentPending || isGooglePending}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
            >
              {currentPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>
                    {activeTab === 'signin' ? 'Sign In' : activeTab === 'signup' ? 'Create Account' : 'Send Magic Link'}
                  </span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Social Auth Separator */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/5" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-bold">
              <span className="bg-[#09090b] px-3 text-slate-500">Or continue with</span>
            </div>
          </div>

          {/* Google OAuth Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={currentPending || isGooglePending}
            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer shadow-md disabled:opacity-50"
          >
            {isGooglePending ? (
              <Loader2 size={16} className="animate-spin text-slate-400" />
            ) : (
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Sign in with Google</span>
          </button>
        </div>

        {/* Footer Info */}
        <p className="text-center text-[10px] text-slate-500 mt-6 flex items-center justify-center gap-1.5">
          <Sparkles size={10} className="text-indigo-400/60" />
          <span>Strict workspace data isolation enabled by Row Level Security</span>
        </p>
      </motion.div>
    </div>
  );
}
