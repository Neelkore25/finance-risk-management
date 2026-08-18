import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { ShieldAlert, Users, Database, PieChart, Activity, Lock } from 'lucide-react';

export function AdminDashboard() {
  const { userProfile, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminMetrics() {
      if (!isSupabaseConfigured()) {
        setError('Supabase is unconfigured. Cannot execute admin RPC functions.');
        setLoading(false);
        return;
      }

      if (userProfile?.role !== 'admin') {
        setLoading(false);
        return;
      }

      try {
        const { data, error: rpcErr } = await supabase.rpc('get_admin_metrics');
        if (rpcErr) {
          setError(rpcErr.message || 'Failed to retrieve admin aggregate metrics.');
        } else {
          setMetrics(data);
        }
      } catch (err) {
        setError(err.message || 'Error executing admin function.');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadAdminMetrics();
    }
  }, [userProfile, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm font-semibold text-slate-400 animate-pulse flex items-center gap-2">
          <Activity className="w-5 h-5 animate-spin text-sky-500" />
          Verifying Database Admin Privileges...
        </div>
      </div>
    );
  }

  // Access Denied Banner for Non-Admin Users
  if (userProfile?.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-slate-900 border border-rose-800 rounded-3xl text-center space-y-4 opacity-100">
        <div className="w-16 h-16 rounded-full bg-rose-950/80 text-rose-400 border border-rose-800 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white">Access Denied</h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          The Admin Management module requires a database-verified administrative role (`role = 'admin'`). Your account (`{userProfile?.email || 'authenticated user'}`) is currently authorized with `role = '{userProfile?.role || 'user'}'`.
        </p>
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-400">
          Database Security Policy Enforcement: `SECURITY DEFINER get_admin_metrics()` checks `auth.uid()` against `public.profiles`. Unauthorized RPC calls are rejected at the PostgreSQL database level.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="opaque-card bg-slate-900 border-slate-800 text-white flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-sky-400" />
            <h1 className="text-2xl font-extrabold">Admin Operational Dashboard</h1>
          </div>
          <p className="text-xs text-slate-400">
            Privacy-Preserving Aggregate Platform Metrics (SECURITY DEFINER Database Guard)
          </p>
        </div>
        <span className="px-3 py-1 bg-emerald-950 text-emerald-300 text-xs font-bold rounded-full border border-emerald-800">
          Role: Admin Verified
        </span>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950 border border-rose-800 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Aggregate Metric Grid (NO INDIVIDUAL USER SALARIES OR DEBTS EXPOSED) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="opaque-card space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Registered Users</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <span className="text-2xl font-black text-white">{metrics?.total_users || 0}</span>
          <span className="text-[10px] text-slate-500 block">Profiles in PostgreSQL DB</span>
        </div>

        <div className="opaque-card space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Financial Profiles</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-black text-white">{metrics?.total_financial_profiles || 0}</span>
          <span className="text-[10px] text-slate-500 block">1:1 User Financial Profiles</span>
        </div>

        <div className="opaque-card space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Platform Average DTI</span>
            <PieChart className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-black text-white">{metrics?.avg_dti_ratio || 0}%</span>
          <span className="text-[10px] text-slate-500 block">Anonymized DTI Benchmark</span>
        </div>

        <div className="opaque-card space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Platform Avg Savings Rate</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-2xl font-black text-white">{metrics?.avg_savings_rate || 0}%</span>
          <span className="text-[10px] text-slate-500 block">Anonymized Savings Metric</span>
        </div>
      </div>

      <div className="opaque-card space-y-3">
        <h3 className="text-sm font-bold text-white">System Security & Privacy Compliance</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          This administrative view strictly obeys the **Privacy-Preserving Aggregate Principle**. It executes the PostgreSQL function `get_admin_metrics()`, which performs internal database aggregations (`COUNT`, `AVG`) and returns structured JSON metrics. No raw user financial rows, individual salary numbers, debt obligations, or personal addresses are exposed to the frontend bundle.
        </p>
      </div>
    </div>
  );
}
