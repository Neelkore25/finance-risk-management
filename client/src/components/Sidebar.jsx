import React from 'react';
import { NavLink } from 'react-router-dom';
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
  Activity
} from 'lucide-react';

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
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function Sidebar({ mobileOpen, setMobileOpen }) {
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950 opacity-90 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* 100% OPAQUE Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } opacity-100 flex flex-col`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <Shield className="w-8 h-8 text-sky-500 mr-3 stroke-[2.5]" />
          <div>
            <h1 className="font-extrabold text-lg text-slate-900 dark:text-white tracking-wider flex items-center gap-1">
              RISK<span className="text-sky-500">GUARD</span>
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-widest uppercase">
              Fintech Risk Platform
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors opacity-100 ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
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
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            Educational Risk Analysis Model
          </p>
          <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
            v1.0.0 • SQLite Engine
          </p>
        </div>
      </aside>
    </>
  );
}
