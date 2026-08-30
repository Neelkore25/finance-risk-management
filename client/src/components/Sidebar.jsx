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
  Lock,
  Users,
  Terminal,
  LogOut
} from 'lucide-react';

export function Sidebar({ mobileOpen, setMobileOpen }) {
  const { userProfile, signOut } = useAuth();

  const mainNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Risk Prediction', path: '/credit-risk', icon: ShieldAlert },
    { name: 'Risk Segmentation', path: '/risk-analysis', icon: PieChart },
    { name: 'Risk Trends', path: '/risk-history', icon: TrendingUp },
    { name: 'What-If Simulator', path: '/simulator', icon: Sliders },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const adminNavItems = [
    { name: 'Admin Panel', path: '/admin', icon: Lock },
    { name: 'Users', path: '/admin', icon: Users },
    { name: 'System Logs', path: '/admin', icon: Terminal },
  ];

  const isAdmin = userProfile?.role === 'admin';

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 dark:bg-[#080F1A]/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* FINTECH SIDEBAR (LIGHT & DARK SUPPORT) */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-[#0D1724] border-r border-slate-200 dark:border-white/10 z-50 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col font-sans shadow-xl dark:shadow-2xl`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#080F1A]">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center mr-3 shadow-lg shadow-blue-500/20 shrink-0">
            <Shield className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-extrabold text-xs text-slate-900 dark:text-white tracking-widest leading-tight font-display uppercase">
              FINANCE <span className="text-blue-600 dark:text-blue-500">RISK</span>
            </h1>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
              Analytics Platform
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 no-scrollbar">
          {/* Main Navigation Group */}
          <div className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#162335] hover:text-slate-900 dark:hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 mr-3 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Admin Navigation Group */}
          {isAdmin && (
            <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-white/10">
              <span className="px-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                Administration
              </span>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? 'bg-purple-600 text-white font-bold shadow-lg shadow-purple-600/30'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#162335] hover:text-slate-900 dark:hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 mr-3 shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </nav>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#080F1A] space-y-3">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3 shrink-0 text-current" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
