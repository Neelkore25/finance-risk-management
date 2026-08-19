import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Menu, Sun, Moon, LogOut, ShieldCheck } from 'lucide-react';

export function Navbar({ setMobileOpen }) {
  const { user, userProfile, displayName, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const nameToDisplay = displayName || userProfile?.full_name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'User');

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#F8FAFC] dark:bg-[#111827] border-b border-[#CBD5E1] dark:border-[#1F2937] px-4 lg:px-8 flex items-center justify-between opacity-100 shadow-sm transition-colors">
      {/* Left: Mobile Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl text-[#475569] dark:text-[#9CA3AF] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#EDF2F7] dark:hover:bg-[#1E293B] lg:hidden border border-[#CBD5E1] dark:border-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <span className="text-[10px] font-bold text-[#2563EB] dark:text-[#0EA5E9] uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Active Workspace
          </span>
          <p className="text-xs font-extrabold text-[#0F172A] dark:text-[#F3F4F6] font-display">
            Finance Risk Analytics Dashboard
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title="Toggle Light/Dark Theme"
          className="p-2 rounded-xl bg-[#EDF2F7] dark:bg-[#0B0F17] text-[#475569] dark:text-[#9CA3AF] hover:text-[#2563EB] dark:hover:text-[#0EA5E9] transition-colors opacity-100 border border-[#CBD5E1] dark:border-slate-800 shadow-sm"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#EDF2F7] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 transition-colors opacity-100 shadow-sm"
          >
            <div className="w-7 h-7 rounded-lg bg-[#2563EB] dark:bg-[#0EA5E9] text-white flex items-center justify-center font-extrabold text-xs">
              {nameToDisplay.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-bold text-[#0F172A] dark:text-[#F3F4F6] hidden md:inline">
              {nameToDisplay}
            </span>
          </button>

          {/* Opaque Dropdown Menu */}
          {dropdownOpen && (
            <div className="opaque-dropdown">
              <div className="p-3 border-b border-[#CBD5E1] dark:border-slate-800">
                <p className="text-xs font-bold text-[#0F172A] dark:text-[#F3F4F6]">{nameToDisplay}</p>
                <p className="text-[11px] text-[#475569] dark:text-[#9CA3AF] truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full text-left flex items-center px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg font-semibold transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
