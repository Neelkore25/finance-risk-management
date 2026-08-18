import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { Expenses } from './pages/Expenses';
import { Debt } from './pages/Debt';
import { Investments } from './pages/Investments';
import { PortfolioRisk } from './pages/PortfolioRisk';
import { CreditRisk } from './pages/CreditRisk';
import { Goals } from './pages/Goals';
import { RiskAnalysis } from './pages/RiskAnalysis';
import { Simulator } from './pages/Simulator';
import { RiskHistory } from './pages/RiskHistory';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs font-semibold">
        Initializing RiskGuard Session...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex opacity-100">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Navbar setMobileOpen={setMobileOpen} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
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
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/*"
              element={
                <RequireAuth>
                  <MainLayout />
                </RequireAuth>
              }
            />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
