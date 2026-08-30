import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Menu, Sun, Moon, LogOut, Search, Bell, ShieldCheck, User as UserIcon } from 'lucide-react';

export function Navbar({ setMobileOpen }) {
  const { user, userProfile, displayName, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const nameToDisplay = displayName || userProfile?.full_name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Neel Kore');
  const roleDisplay = userProfile?.role || 'Admin';

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#080F1A] border-b border-white/10 px-4 lg:px-8 flex items-center justify-between shadow-lg">
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#162335] lg:hidden border border-white/10"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div className="relative w-full hidden sm:block">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customers, reports, models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-[#0D1724] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Right Actions: Theme Toggle, Notifications, User Profile */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title="Toggle Light/Dark Theme"
          className="p-2 rounded-xl bg-[#0D1724] text-slate-400 hover:text-white border border-white/10 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-2 rounded-xl bg-[#0D1724] text-slate-400 hover:text-white border border-white/10 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5 ring-2 ring-[#080F1A]" />
          </button>

          {showNotifs && (
            <div className="opaque-dropdown w-72 right-0 mt-2 p-3 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs font-bold text-white">
                <span>System Alerts & Notifications</span>
                <span className="text-[10px] text-blue-400">3 New</span>
              </div>
              <div className="space-y-2 text-[11px] text-slate-300">
                <div className="p-2 rounded-lg bg-[#162335]">
                  <p className="font-semibold text-white">High DTI Breach Alert</p>
                  <p className="text-[10px] text-slate-400">Target limit exceeded (42% vs 36%)</p>
                </div>
                <div className="p-2 rounded-lg bg-[#162335]">
                  <p className="font-semibold text-white">Quantitative VaR Calculated</p>
                  <p className="text-[10px] text-slate-400">95% confidence level model updated</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#0D1724] border border-white/10 hover:border-slate-600 transition-colors shadow-sm"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-500/20">
              {nameToDisplay.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden md:block">
              <span className="text-xs font-bold text-white block leading-tight">
                {nameToDisplay}
              </span>
              <span className="text-[10px] font-semibold text-blue-400 block uppercase leading-none">
                {roleDisplay}
              </span>
            </div>
          </button>

          {/* Profile Dropdown */}
          {dropdownOpen && (
            <div className="opaque-dropdown">
              <div className="p-3 border-b border-white/10">
                <p className="text-xs font-bold text-white">{nameToDisplay}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email || 'admin@analytics.com'}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase">
                  Role: {roleDisplay}
                </span>
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
