'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookOpen, BarChart3, Settings, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/courses', label: 'Courses', icon: BookOpen },
  { href: '/pricing', label: 'Pricing', icon: CreditCard },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="z-20 border-white/5 bg-[#09090b]/80 backdrop-blur-md flex border-t justify-around py-3 px-4 w-full md:flex-col md:w-20 md:h-full md:border-r md:border-t-0 md:justify-start md:py-8 md:px-0 lg:w-64 lg:px-4">
      {/* Brand logo (Desktop/Tablet only) */}
      <div className="hidden md:flex items-center justify-center lg:justify-start lg:px-4 mb-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <BookOpen className="text-white" size={20} />
        </div>
        <span className="hidden lg:block ml-3 font-bold text-lg text-white tracking-wider">
          ACADEMIA
        </span>
      </div>

      {/* Nav Links */}
      <div className="flex flex-row md:flex-col gap-2 w-full md:items-center lg:items-stretch">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 group relative w-full justify-center lg:justify-start
                ${isActive 
                  ? 'text-white' 
                  : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <Icon size={20} className={isActive ? 'text-indigo-400 z-10' : 'text-slate-400 group-hover:text-slate-200 transition-colors z-10'} />
              <span className="hidden lg:block text-sm font-medium z-10">{item.label}</span>
              
              {/* Highlight bar for active state */}
              {isActive && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-indigo-500 rounded-r-md hidden lg:block z-10" />
              )}

              {/* Active Item Backdrop Slider */}
              {isActive && (
                <motion.div
                  layoutId="activeNavBackground"
                  className="absolute inset-0 bg-white/5 border border-white/10 rounded-xl shadow-inner"
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
