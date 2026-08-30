import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../services/apiClient';
import {
  Menu,
  Sun,
  Moon,
  LogOut,
  Search,
  Bell,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Sliders,
  PieChart,
  User,
  Settings as SettingsIcon,
  FileText
} from 'lucide-react';

const SEARCHABLE_ROUTES = [
  { name: 'Dashboard Overview', path: '/dashboard', category: 'Overview', desc: 'Real-time portfolio risk intelligence and executive summary' },
  { name: 'Financial Profile', path: '/profile', category: 'Profile', desc: 'Monthly net income, liquid savings, and emergency buffer' },
  { name: 'Expense Tracker', path: '/expenses', category: 'Budget', desc: 'Itemized essential vs discretionary monthly spending' },
  { name: 'Debt Management', path: '/debt', category: 'Liabilities', desc: 'Active loans, EMI schedules, and DTI obligations' },
  { name: 'Portfolio Holdings', path: '/investments', category: 'Assets', desc: 'Asset allocations, CSV import, and portfolio values' },
  { name: 'Quantitative VaR Engine', path: '/portfolio-risk', category: 'Analytics', desc: 'Historical & Parametric Value at Risk (VaR), Sharpe ratio' },
  { name: 'Credit Risk Scoring', path: '/credit-risk', category: 'Risk Models', desc: 'Logistic ML default prediction & underwriting score' },
  { name: 'Financial Goals', path: '/goals', category: 'Planning', desc: 'Goal milestones and monthly savings horizon targets' },
  { name: 'Risk Segmentation & Analysis', path: '/risk-analysis', category: 'Analytics', desc: '5-Factor deterministic personal risk category breakdown' },
  { name: 'What-If & Monte Carlo Simulator', path: '/simulator', category: 'Simulators', desc: 'Stress-test budget adjustments & run 1,000+ stochastic paths' },
  { name: 'Historical Risk Trends', path: '/risk-history', category: 'History', desc: 'Multi-period risk trajectory and financial snapshots' },
  { name: 'Risk Reports Generator', path: '/reports', category: 'Reports', desc: 'Export PDF risk assessments and compliance reports' },
  { name: 'Methodology & Math Framework', path: '/methodology', category: 'Documentation', desc: 'Formulas, Sharpe assumptions, and risk models' },
  { name: 'Platform Settings', path: '/settings', category: 'Settings', desc: 'Currency (INR/USD), DTI limits, and alert toggles' },
  { name: 'Admin Control Panel', path: '/admin', category: 'Admin', desc: 'User administration and system health metrics' }
];

export function Navbar({ setMobileOpen }) {
  const { user, userProfile, displayName, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);

  const searchRef = useRef(null);

  async function loadAlerts() {
    try {
      const res = await apiFetch('/alerts');
      setAlerts(res.alerts || []);
    } catch (err) {
      console.error('Failed to load navbar alerts:', err);
    }
  }

  useEffect(() => {
    loadAlerts();
    window.addEventListener('settingsUpdated', loadAlerts);
    window.addEventListener('profileUpdated', loadAlerts);
    window.addEventListener('debtUpdated', loadAlerts);
    return () => {
      window.removeEventListener('settingsUpdated', loadAlerts);
      window.removeEventListener('profileUpdated', loadAlerts);
      window.removeEventListener('debtUpdated', loadAlerts);
    };
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredRoutes = searchQuery.trim() === ''
    ? []
    : SEARCHABLE_ROUTES.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.desc.toLowerCase().includes(searchQuery.toLowerCase())
      );

  function handleSelectRoute(path) {
    navigate(path);
    setSearchQuery('');
    setIsSearchOpen(false);
  }

  const nameToDisplay = displayName || userProfile?.full_name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Neel Kore');
  const roleDisplay = userProfile?.role || 'Admin';

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#080F1A] border-b border-white/10 px-4 lg:px-8 flex items-center justify-between shadow-lg">
      {/* Left: Mobile Toggle & Functional Global Search */}
      <div className="flex items-center gap-4 flex-1 max-w-md" ref={searchRef}>
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
            placeholder="Search modules, analytics, reports (e.g. VaR, Debt, Simulator)..."
            value={searchQuery}
            onFocus={() => setIsSearchOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filteredRoutes.length > 0) {
                handleSelectRoute(filteredRoutes[0].path);
              }
            }}
            className="w-full pl-9 pr-4 py-1.5 bg-[#0D1724] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />

          {/* Search Autocomplete Results Dropdown */}
          {isSearchOpen && searchQuery.trim() !== '' && (
            <div className="opaque-dropdown w-full left-0 mt-2 max-h-80 overflow-y-auto p-2 space-y-1 z-50">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/10">
                Matching Pages ({filteredRoutes.length})
              </div>

              {filteredRoutes.length > 0 ? (
                filteredRoutes.map((route) => (
                  <button
                    key={route.path}
                    onClick={() => handleSelectRoute(route.path)}
                    className="w-full text-left p-2 rounded-lg hover:bg-[#162335] transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                          {route.name}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase font-semibold">
                          {route.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">{route.desc}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))
              ) : (
                <div className="p-3 text-center text-xs text-slate-400">
                  No matching module found for "{searchQuery}".
                </div>
              )}
            </div>
          )}
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
            title="System Notifications"
          >
            <Bell className="w-4 h-4" />
            {alerts.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5 ring-2 ring-[#080F1A] animate-pulse" />
            )}
          </button>

          {showNotifs && (
            <div className="opaque-dropdown w-80 right-0 mt-2 p-3 space-y-2.5 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs font-bold text-white">
                <span>Active Risk Alerts</span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  alerts.length > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {alerts.length > 0 ? `${alerts.length} Active` : 'All Clear'}
                </span>
              </div>

              {alerts.length > 0 ? (
                <div className="space-y-2 text-[11px] max-h-72 overflow-y-auto">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-2.5 rounded-xl border ${
                        alert.severity === 'Critical'
                          ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                          : alert.severity === 'Warning'
                          ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                          : 'bg-blue-950/40 border-blue-800/80 text-blue-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <p className="font-bold text-white text-xs">{alert.title}</p>
                      </div>
                      <p className="text-[10px] opacity-90 leading-tight">{alert.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center space-y-1.5">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                  <p className="text-xs font-bold text-white">All Parameters Stable</p>
                  <p className="text-[10px] text-slate-400">No critical threshold breaches detected.</p>
                </div>
              )}
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
