import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navigation } from "@/components/Navigation";
import { User } from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Student Dashboard",
  description: "Secure, dark themed bento-grid student dashboard built with Next.js and Supabase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full dark antialiased`}
    >
      <body className="h-screen w-screen overflow-hidden flex flex-col-reverse md:flex-row bg-[#030303] text-slate-100 font-sans">
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
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400 hidden sm:inline">
                Welcome back, Alex
              </span>
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-md">
                <User size={16} className="text-indigo-400" />
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-grow p-6 md:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
