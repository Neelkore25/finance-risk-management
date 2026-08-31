import React, { useState, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { AIRiskAssistant } from './components/AIRiskAssistant';
import { Activity } from 'lucide-react';

// Lazy Loaded Pages for performance and code-splitting
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Expenses = lazy(() => import('./pages/Expenses').then(m => ({ default: m.Expenses })));
const Debt = lazy(() => import('./pages/Debt').then(m => ({ default: m.Debt })));
const Investments = lazy(() => import('./pages/Investments').then(m => ({ default: m.Investments })));
const PortfolioRisk = lazy(() => import('./pages/PortfolioRisk').then(m => ({ default: m.PortfolioRisk })));
const CreditRisk = lazy(() => import('./pages/CreditRisk').then(m => ({ default: m.CreditRisk })));
const Goals = lazy(() => import('./pages/Goals').then(m => ({ default: m.Goals })));
const RiskAnalysis = lazy(() => import('./pages/RiskAnalysis').then(m => ({ default: m.RiskAnalysis })));
const Simulator = lazy(() => import('./pages/Simulator').then(m => ({ default: m.Simulator })));
const RiskHistory = lazy(() => import('./pages/RiskHistory').then(m => ({ default: m.RiskHistory })));
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Methodology = lazy(() => import('./pages/Methodology').then(m => ({ default: m.Methodology })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-xs font-semibold text-slate-400 animate-pulse flex items-center gap-2">
        <Activity className="w-5 h-5 animate-spin text-blue-500" />
        Loading Risk Module...
      </div>
    </div>
  );
}

function MainLayout() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090D] text-slate-900 dark:text-slate-100 flex opacity-100 transition-colors duration-150 relative">
      {/* Background Dashboard & App Shell Layout (Mounted even before auth) */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Navbar setMobileOpen={setMobileOpen} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-32 max-w-7xl w-full mx-auto">
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/debt" element={<Debt />} />
              <Route path="/investments" element={<Investments />} />
              <Route path="/portfolio-risk" element={<PortfolioRisk />} />
              <Route path="/credit-risk" element={<CreditRisk />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/risk-analysis" element={<RiskAnalysis />} />
              <Route path="/simulator" element={<Simulator />} />
              <Route path="/risk-history" element={<RiskHistory />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/methodology" element={<Methodology />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>

      {/* Floating AI Risk Assistant Widget */}
      {user && <AIRiskAssistant />}

      {/* Modal-Over-Dashboard Authentication Overlay (Google OAuth Only) */}
      <AuthModal isOpen={!user} />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/*" element={<MainLayout />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
