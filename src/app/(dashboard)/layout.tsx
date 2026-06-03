import { Navigation } from "@/components/Navigation";
import { User, LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { logout } from "../(auth)/login/actions";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const email = user?.email || 'Student';

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col-reverse md:flex-row bg-[#030303] text-slate-100 font-sans">
      {/* Navigation Sidebar/Bottom Bar */}
      <Navigation />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#09090b]/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              System Online
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400 hidden sm:inline">
                Welcome back, {email.split('@')[0]}
              </span>
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-md" title={email}>
                <User size={16} className="text-indigo-400" />
              </div>
            </div>

            {/* Logout button */}
            <form action={logout}>
              <button
                type="submit"
                className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </form>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-grow p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
