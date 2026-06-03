import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import * as Icons from 'lucide-react';

export const revalidate = 0;

export default async function SettingsPage() {
  const supabase = await createClient();

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // 2. Fetch user profile
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const email = user.email || 'Student';
  const tier = profile?.subscription_tier || 'free';
  const credits = profile?.ai_credits_remaining ?? 0;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Account Settings
        </h2>
        <p className="text-slate-400 mt-2 text-sm md:text-base">
          Manage your account credentials, subscription plan, and usage credits.
        </p>
      </div>

      {/* Settings Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-2 rounded-3xl border border-white/5 bg-[#09090b]/40 p-6 md:p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Icons.User size={18} className="text-indigo-400" />
            Profile Details
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 border-b border-white/5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</span>
              <span className="text-sm text-slate-200 sm:col-span-2 font-medium">{email}</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 border-b border-white/5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">User ID</span>
              <span className="text-xs text-slate-400 sm:col-span-2 font-mono break-all">{user.id}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</span>
              <span className="text-sm text-slate-200 sm:col-span-2 font-medium capitalize">Student Workspace Member</span>
            </div>
          </div>
        </div>

        {/* Subscription / Billing Info Card */}
        <div className="rounded-3xl border border-white/5 bg-[#09090b]/40 p-6 md:p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Icons.Zap size={18} className="text-purple-400" />
              SaaS Credits
            </h3>
            
            <div className="space-y-1">
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Active Plan</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-white capitalize">{tier} Tier</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Copilot AI Credits</span>
              <p className="text-3xl font-black text-white">{credits} <span className="text-xs text-slate-400 font-normal">remaining</span></p>
            </div>
          </div>

          <div className="pt-6">
            <a 
              href="/pricing"
              className="w-full py-2.5 bg-white/5 border border-white/5 hover:border-indigo-500/30 text-white hover:text-indigo-300 rounded-xl font-bold text-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Icons.CreditCard size={12} />
              Upgrade Plan
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
