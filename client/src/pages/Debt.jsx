import React, { useState, useEffect } from 'react';
import { apiFetch, getSavedSettings, formatCurrency } from '../services/apiClient';
import { OpaqueModal } from '../components/OpaqueModal';
import { CreditCard, Plus, Trash2, Edit2, AlertTriangle, ShieldCheck } from 'lucide-react';

const DEBT_TYPES = ['Credit Card', 'Mortgage', 'Auto Loan', 'Student Loan', 'Personal Loan', 'Business Loan', 'Medical Debt', 'Other'];

export function Debt() {
  const [debts, setDebts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [settings, setSettings] = useState(getSavedSettings);

  const [formData, setFormData] = useState({
    name: '',
    debt_type: 'Credit Card',
    outstanding_amount: '',
    interest_rate: '',
    monthly_payment: '',
    due_date: ''
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const handleSettingsUpdated = () => setSettings(getSavedSettings());
    window.addEventListener('debtUpdated', loadData);
    window.addEventListener('settingsUpdated', handleSettingsUpdated);
    return () => {
      window.removeEventListener('debtUpdated', loadData);
      window.removeEventListener('settingsUpdated', handleSettingsUpdated);
    };
  }, []);

  async function loadData() {
    try {
      const [debtsRes, profRes] = await Promise.all([
        apiFetch('/debts'),
        apiFetch('/profile')
      ]);
      setDebts(debtsRes.debts || []);
      setProfile(profRes.profile || {});
    } catch (err) {
      console.error('Failed to load debt data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (debt = null) => {
    if (debt) {
      setEditingDebt(debt);
      setFormData({
        name: debt.name,
        debt_type: debt.debt_type,
        outstanding_amount: debt.outstanding_amount,
        interest_rate: debt.interest_rate,
        monthly_payment: debt.monthly_payment,
        due_date: debt.due_date || ''
      });
    } else {
      setEditingDebt(null);
      setFormData({
        name: '',
        debt_type: 'Credit Card',
        outstanding_amount: '',
        interest_rate: '',
        monthly_payment: '',
        due_date: ''
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDebt) {
        await apiFetch(`/debts/${editingDebt.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await apiFetch('/debts', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setModalOpen(false);
      await loadData();
      window.dispatchEvent(new CustomEvent('debtUpdated'));
    } catch (err) {
      alert(err.message || 'Failed to save debt item');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this debt record?')) return;
    try {
      await apiFetch(`/debts/${id}`, { method: 'DELETE' });
      await loadData();
      window.dispatchEvent(new CustomEvent('debtUpdated'));
    } catch (err) {
      alert('Failed to delete debt item');
    }
  };

  const totalOutstanding = debts.reduce((sum, d) => sum + Number(d.outstanding_amount), 0);
  const totalMonthlyPayment = debts.reduce((sum, d) => sum + Number(d.monthly_payment), 0);
  const income = Number(profile?.monthly_income || 0);
  const dti = income > 0 ? (totalMonthlyPayment / income) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-rose-500" />
            Debt Management & DTI Tracker
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor outstanding liabilities, interest rates, and monthly debt service obligations.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Debt Liability
        </button>
      </div>

      {/* Metrics & High Burden Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="opaque-card p-6 space-y-1">
          <span className="text-xs font-bold text-[#475569] dark:text-[#9CA3AF] block uppercase tracking-wider">Total Outstanding Debt</span>
          <span className="text-3xl font-extrabold text-[#0F172A] dark:text-white font-mono tabular-nums">{formatCurrency(totalOutstanding)}</span>
          <span className="text-[11px] text-slate-400 block pt-1 border-t border-slate-200 dark:border-slate-800">Total liability balance</span>
        </div>
        <div className="opaque-card p-6 space-y-1">
          <span className="text-xs font-bold text-[#475569] dark:text-[#9CA3AF] block uppercase tracking-wider">Total Monthly EMI Payment</span>
          <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-mono tabular-nums">{formatCurrency(totalMonthlyPayment)}<span className="text-xs font-normal text-slate-400">/mo</span></span>
          <span className="text-[11px] text-slate-400 block pt-1 border-t border-slate-200 dark:border-slate-800">Total monthly debt service</span>
        </div>
        <div className="opaque-card p-6 space-y-1 border-l-4 border-l-[#2563EB] dark:border-l-[#0EA5E9]">
          <span className="text-xs font-bold text-[#475569] dark:text-[#9CA3AF] block uppercase tracking-wider">Debt-to-Income (DTI)</span>
          <span className="text-5xl sm:text-6xl font-extrabold text-[#0F172A] dark:text-white font-mono tabular-nums">{dti.toFixed(1)}%</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 block pt-1 border-t border-slate-200 dark:border-slate-800 font-medium">
            💡 <strong>Percentage of income going to debt payments</strong> (Target: &le;{settings.dtiLimit || 36}%).
          </span>
        </div>
      </div>

      {dti > (settings.dtiLimit || 36) && (
        <div className="p-4 rounded-xl bg-rose-950 border border-rose-800 text-rose-200 text-xs flex items-center gap-3 opacity-100">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
          <div>
            <span className="font-extrabold block text-sm">HIGH DEBT BURDEN WARNING</span>
            <span>Your calculated DTI ratio is {dti.toFixed(1)}%, exceeding your configured target limit of {settings.dtiLimit || 36}%. Consider aggressive debt payoff.</span>
          </div>
        </div>
      )}

      {/* Debts Table */}
      <div className="opaque-card space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Active Debt Liabilities</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3">Liability Name</th>
                <th className="p-3">Type</th>
                <th className="p-3 text-right">Outstanding Amount</th>
                <th className="p-3 text-right">Interest Rate</th>
                <th className="p-3 text-right">Monthly Payment</th>
                <th className="p-3 text-center">Due Date</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {debts.length > 0 ? (
                debts.map((debt) => (
                  <tr key={debt.id} className="hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{debt.name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[10px]">
                        {debt.debt_type}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900 dark:text-white">${Number(debt.outstanding_amount).toLocaleString()}</td>
                    <td className="p-3 text-right font-semibold text-amber-500">{debt.interest_rate}%</td>
                    <td className="p-3 text-right font-bold text-rose-500">${Number(debt.monthly_payment).toLocaleString()}</td>
                    <td className="p-3 text-center text-slate-500">{debt.due_date || 'N/A'}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleOpenModal(debt)} className="p-1 text-slate-400 hover:text-sky-500">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(debt.id)} className="p-1 text-slate-400 hover:text-rose-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-slate-400">
                    No active debt liabilities recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 100% OPAQUE Add/Edit Debt Modal */}
      <OpaqueModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDebt ? 'Edit Debt Liability' : 'Add Debt Liability'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Debt Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Chase Sapphire, Home Mortgage"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Debt Type</label>
              <select
                value={formData.debt_type}
                onChange={(e) => setFormData({ ...formData, debt_type: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              >
                {DEBT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Outstanding Balance ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.outstanding_amount}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setFormData({ ...formData, outstanding_amount: e.target.value.replace(/^0+(?=\d)/, '') })}
                placeholder="0.00"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Interest Rate (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.interest_rate}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value.replace(/^0+(?=\d)/, '') })}
                placeholder="18.5"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Monthly Payment ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.monthly_payment}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setFormData({ ...formData, monthly_payment: e.target.value.replace(/^0+(?=\d)/, '') })}
                placeholder="150"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
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
              {editingDebt ? 'Save Changes' : 'Add Liability'}
            </button>
          </div>
        </form>
      </OpaqueModal>
    </div>
  );
}
