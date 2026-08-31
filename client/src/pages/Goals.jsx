import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/apiClient';
import { OpaqueModal } from '../components/OpaqueModal';
import { Target, Plus, Trash2, Edit2, CheckCircle2, AlertTriangle } from 'lucide-react';

export function Goals() {
  const [goals, setGoals] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    current_amount: '',
    target_date: '',
    monthly_contribution: ''
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoals();
    window.addEventListener('goalsUpdated', loadGoals);
    return () => window.removeEventListener('goalsUpdated', loadGoals);
  }, []);

  async function loadGoals() {
    try {
      const res = await apiFetch('/goals');
      setGoals(res.goals || []);
    } catch (err) {
      console.error('Failed to load goals:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (goal = null) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        name: goal.name,
        target_amount: goal.target_amount,
        current_amount: goal.current_amount,
        target_date: goal.target_date,
        monthly_contribution: goal.monthly_contribution
      });
    } else {
      setEditingGoal(null);
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 3);
      setFormData({
        name: '',
        target_amount: '50000',
        current_amount: '10000',
        target_date: nextYear.toISOString().split('T')[0],
        monthly_contribution: '500'
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingGoal) {
        await apiFetch(`/goals/${editingGoal.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await apiFetch('/goals', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setModalOpen(false);
      await loadGoals();
      window.dispatchEvent(new CustomEvent('goalsUpdated'));
    } catch (err) {
      alert(err.message || 'Failed to save goal');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    try {
      await apiFetch(`/goals/${id}`, { method: 'DELETE' });
      await loadGoals();
      window.dispatchEvent(new CustomEvent('goalsUpdated'));
    } catch (err) {
      alert('Failed to delete goal');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-sky-500" />
            Financial Goals & Achievability
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track progress toward long-term savings goals and evaluate monthly funding gap risk.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create New Goal
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.length > 0 ? (
          goals.map((g) => {
            const target = Number(g.target_amount);
            const current = Number(g.current_amount);
            const remaining = Math.max(0, target - current);
            const pct = Math.min(100, Math.round((current / (target || 1)) * 100));

            const targetDate = new Date(g.target_date);
            const monthsLeft = Math.max(1, Math.round((targetDate - new Date()) / (1000 * 60 * 60 * 24 * 30.4375)));
            const requiredMonthly = remaining / monthsLeft;
            const actualMonthly = Number(g.monthly_contribution || 0);

            const gapRatio = requiredMonthly > 0 ? (actualMonthly / requiredMonthly) * 100 : 100;
            const isAchievable = gapRatio >= 80;

            return (
              <div key={g.id} className="opaque-card space-y-4 relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{g.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isAchievable ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                      {isAchievable ? 'On Track' : 'Funding Gap'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500">Progress</span>
                      <span className="text-slate-900 dark:text-white font-extrabold">{pct}% (${current.toLocaleString()} / ${target.toLocaleString()})</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Target Completion:</span>
                      <span className="font-bold">{g.target_date} ({monthsLeft} mos left)</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Current Monthly Saving:</span>
                      <span className="font-bold text-sky-500">${actualMonthly}/mo</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Required Monthly Saving:</span>
                      <span className="font-bold text-amber-500">${Math.round(requiredMonthly)}/mo</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                  <button onClick={() => handleOpenModal(g)} className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-sky-500">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(g.id)} className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full opaque-card text-center p-8 text-slate-400 text-xs">
            No active financial goals defined yet. Click "Create New Goal" above to start tracking.
          </div>
        )}
      </div>

      {/* 100% OPAQUE Add/Edit Goal Modal */}
      <OpaqueModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingGoal ? 'Edit Financial Goal' : 'Create Financial Goal'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Goal Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. House Down Payment, Retirement Fund"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target Amount ($)</label>
              <input
                type="number"
                min="0"
                required
                value={formData.target_amount}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value.replace(/^0+(?=\d)/, '') })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Current Saved ($)</label>
              <input
                type="number"
                min="0"
                value={formData.current_amount}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setFormData({ ...formData, current_amount: e.target.value.replace(/^0+(?=\d)/, '') })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target Date</label>
              <input
                type="date"
                required
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Monthly Contribution ($)</label>
              <input
                type="number"
                min="0"
                value={formData.monthly_contribution}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setFormData({ ...formData, monthly_contribution: e.target.value.replace(/^0+(?=\d)/, '') })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow"
            >
              {editingGoal ? 'Save Changes' : 'Create Goal'}
            </button>
          </div>
        </form>
      </OpaqueModal>
    </div>
  );
}
