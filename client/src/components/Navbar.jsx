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
    <header className="sticky top-0 z-30 h-16 bg-[#07080D] border-b border-[#00F5FF]/20 px-4 lg:px-8 flex items-center justify-between opacity-100 shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-md">
      {/* Left: Mobile Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl text-[#A0AEC0] hover:text-white hover:bg-[#1E293B] lg:hidden border border-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <span className="text-[10px] font-bold text-[#00F5FF] uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Active Workspace
          </span>
          <p className="text-xs font-extrabold text-white font-display">
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
          className="p-2 rounded-xl bg-[#0D111A] text-[#A0AEC0] hover:text-[#00F5FF] hover:border-[#00F5FF]/40 transition-colors opacity-100 border border-[#00F5FF]/20 shadow-sm"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#00F5FF]" />}
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0D111A] border border-[#00F5FF]/30 hover:border-[#00F5FF]/60 transition-colors opacity-100 shadow-sm"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#00F5FF] to-[#9D4EDD] text-white flex items-center justify-center font-extrabold text-xs shadow-[0_0_10px_rgba(0,245,255,0.4)]">
              {nameToDisplay.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-bold text-white hidden md:inline">
              {nameToDisplay}
            </span>
          </button>

          {/* Opaque Dropdown Menu */}
          {dropdownOpen && (
            <div className="opaque-dropdown">
              <div className="p-3 border-b border-slate-800">
                <p className="text-xs font-bold text-white">{nameToDisplay}</p>
                <p className="text-[11px] text-[#A0AEC0] truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full text-left flex items-center px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/40 rounded-lg font-semibold transition-colors"
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
