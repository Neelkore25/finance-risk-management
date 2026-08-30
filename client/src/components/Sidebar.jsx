import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  User,
  Receipt,
  CreditCard,
  TrendingUp,
  PieChart,
  ShieldAlert,
  Target,
  Sliders,
  History,
  FileText,
  Settings,
  Shield,
  Activity,
  BookOpen,
  Lock
} from 'lucide-react';

export function Sidebar({ mobileOpen, setMobileOpen }) {
  const { userProfile } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Financial Profile', path: '/profile', icon: User },
    { name: 'Expense Tracker', path: '/expenses', icon: Receipt },
    { name: 'Debt Management', path: '/debt', icon: CreditCard },
    { name: 'Portfolio Holdings', path: '/investments', icon: TrendingUp },
    { name: 'Quantitative VaR', path: '/portfolio-risk', icon: PieChart },
    { name: 'Credit Risk Module', path: '/credit-risk', icon: ShieldAlert },
    { name: 'Financial Goals', path: '/goals', icon: Target },
    { name: 'Risk Analysis', path: '/risk-analysis', icon: Activity },
    { name: 'What-If Simulator', path: '/simulator', icon: Sliders },
    { name: 'Risk History', path: '/risk-history', icon: History },
    { name: 'Reports & Exports', path: '/reports', icon: FileText },
    { name: 'Methodology', path: '/methodology', icon: BookOpen },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  if (userProfile?.role === 'admin') {
    navItems.push({ name: 'Admin Dashboard', path: '/admin', icon: Lock });
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-[#0F172A]/70 dark:bg-[#0B0F17]/90 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* MATTE LOW-GLARE SIDEBAR */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-[#F8FAFC] dark:bg-[#111827] border-r border-[#CBD5E1] dark:border-[#1F2937] z-50 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } opacity-100 flex flex-col font-sans shadow-sm dark:shadow-none`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-[#CBD5E1] dark:border-[#1F2937] bg-[#EDF2F7] dark:bg-[#0B0F17]">
          <Shield className="w-8 h-8 text-[#2563EB] dark:text-[#0EA5E9] mr-3 stroke-[2.5]" />
          <div>
            <h1 className="font-extrabold text-sm text-[#0F172A] dark:text-[#F3F4F6] tracking-wider leading-tight font-display">
              FINANCE <span className="text-[#2563EB] dark:text-[#0EA5E9]">RISK ANALYTICS</span>
            </h1>
            <p className="text-[9px] text-[#475569] dark:text-[#9CA3AF] font-semibold tracking-widest uppercase mt-0.5">
              Quantitative Analytics Suite
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 opacity-100 ${
                    isActive
                      ? 'bg-[#2563EB] text-white shadow-sm dark:bg-[#0EA5E9]/20 dark:text-[#0EA5E9] dark:border dark:border-[#0EA5E9]/40 translate-x-1'
                      : 'text-[#475569] dark:text-[#9CA3AF] hover:bg-[#EDF2F7] dark:hover:bg-[#1E293B]/50 hover:text-[#0F172A] dark:hover:text-[#F3F4F6] border border-transparent'
                  }`
                }
              >
                <Icon className="w-4 h-4 mr-3 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-[#CBD5E1] dark:border-[#1F2937] bg-[#EDF2F7] dark:bg-[#0B0F17]">
          <a
            href="https://neelkore25.github.io/finance-risk-management/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-[#2563EB] dark:text-[#0EA5E9] hover:underline block"
          >
            Live Site: neelkore25.github.io
          </a>
          <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
            v2.0.0 • Supabase RLS DB
          </p>
        </div>
      </aside>
    </>
  );
}
