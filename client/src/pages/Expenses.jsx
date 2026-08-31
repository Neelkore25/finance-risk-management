import React, { useState, useEffect } from 'react';
import { apiFetch, formatCurrency } from '../services/apiClient';
import { OpaqueModal } from '../components/OpaqueModal';
import { Receipt, Plus, Trash2, Edit2, Filter, DollarSign, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const CATEGORIES = ['Housing', 'Food', 'Transportation', 'Utilities', 'Education', 'Healthcare', 'Entertainment', 'Shopping', 'Other'];
const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b', '#06b6d4', '#84cc16'];

export function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [filterCategory, setFilterCategory] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: 'Housing',
    is_essential: true,
    date: new Date().toISOString().split('T')[0]
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpenses();
    window.addEventListener('expensesUpdated', loadExpenses);
    window.addEventListener('settingsUpdated', loadExpenses);
    return () => {
      window.removeEventListener('expensesUpdated', loadExpenses);
      window.removeEventListener('settingsUpdated', loadExpenses);
    };
  }, []);

  async function loadExpenses() {
    try {
      const res = await apiFetch('/expenses');
      setExpenses(res.expenses || []);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (expense = null) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        name: expense.name,
        amount: expense.amount,
        category: expense.category,
        is_essential: Boolean(expense.is_essential),
        date: expense.date
      });
    } else {
      setEditingExpense(null);
      setFormData({
        name: '',
        amount: '',
        category: 'Housing',
        is_essential: true,
        date: new Date().toISOString().split('T')[0]
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        await apiFetch(`/expenses/${editingExpense.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await apiFetch('/expenses', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setModalOpen(false);
      loadExpenses();
    } catch (err) {
      alert(err.message || 'Failed to save expense');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await apiFetch(`/expenses/${id}`, { method: 'DELETE' });
      loadExpenses();
    } catch (err) {
      alert('Failed to delete expense');
    }
  };

  // Filtered expenses
  const filteredExpenses = filterCategory === 'All'
    ? expenses
    : expenses.filter(e => e.category === filterCategory);

  // Metrics
  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const essentialAmount = expenses.filter(e => e.is_essential).reduce((sum, e) => sum + Number(e.amount), 0);
  const discretionaryAmount = totalAmount - essentialAmount;

  // Category Pie Data
  const categoryTotals = {};
  expenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount);
  });
  const pieData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-sky-500" />
            Expense Tracker & Categorization
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage granular itemized spending and track essential vs discretionary cash outflows.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add New Expense
        </button>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="opaque-card p-6 space-y-1">
          <span className="text-xs font-bold text-[#475569] dark:text-[#9CA3AF] block uppercase tracking-wider">Total Expenses</span>
          <span className="text-3xl font-extrabold text-[#0F172A] dark:text-white font-mono tabular-nums">{formatCurrency(totalAmount)}</span>
        </div>
        <div className="opaque-card p-6 space-y-1">
          <span className="text-xs font-bold text-[#475569] dark:text-[#9CA3AF] block uppercase tracking-wider">Essential Spending</span>
          <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">{formatCurrency(essentialAmount)}</span>
        </div>
        <div className="opaque-card p-6 space-y-1">
          <span className="text-xs font-bold text-[#475569] dark:text-[#9CA3AF] block uppercase tracking-wider">Discretionary Spending</span>
          <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono tabular-nums">{formatCurrency(discretionaryAmount)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expenses Table */}
        <div className="lg:col-span-2 opaque-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Itemized Expenses</h2>
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Expense Item</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors">
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">{exp.name}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[10px]">
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${exp.is_essential ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>
                          {exp.is_essential ? 'Essential' : 'Discretionary'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{exp.date}</td>
                      <td className="p-3 text-right font-bold text-slate-900 dark:text-white font-mono tabular-nums">{formatCurrency(exp.amount)}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleOpenModal(exp)} className="p-1 text-slate-400 hover:text-sky-500">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(exp.id)} className="p-1 text-slate-400 hover:text-rose-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-slate-400">
                      No expenses found for this selection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="opaque-card space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Category Distribution</h2>
          <div className="h-64">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                No expense data recorded.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 100% OPAQUE Add/Edit Expense Modal */}
      <OpaqueModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingExpense ? 'Edit Expense Item' : 'Add New Expense Item'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Expense Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Apartment Rent, Grocery"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.amount}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value.replace(/^0+(?=\d)/, '') })}
                placeholder="0.00"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_essential}
                  onChange={(e) => setFormData({ ...formData, is_essential: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded border-slate-300"
                />
                <span>Essential Expense</span>
              </label>
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
              {editingExpense ? 'Save Changes' : 'Create Expense'}
            </button>
          </div>
        </form>
      </OpaqueModal>
    </div>
  );
}
