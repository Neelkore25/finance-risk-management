import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/apiClient';
import { OpaqueModal } from '../components/OpaqueModal';
import { TrendingUp, Plus, Trash2, Edit2, PieChart, Layers } from 'lucide-react';
import { ResponsiveContainer, PieChart as RePie, Pie, Cell, Tooltip } from 'recharts';

const ASSET_TYPES = ['Stocks', 'Bonds', 'Crypto', 'Mutual Funds', 'Fixed Deposits', 'Gold', 'Real Estate', 'Cash', 'Other'];
const SECTORS = ['Technology', 'Financials', 'Healthcare', 'Consumer Discretionary', 'Energy', 'Real Estate', 'Utilities', 'Government/Sovereign', 'General/Diversified'];
const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b', '#06b6d4', '#84cc16'];

export function Investments() {
  const [investments, setInvestments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInv, setEditingInv] = useState(null);

  const [formData, setFormData] = useState({
    asset_name: '',
    asset_type: 'Stocks',
    sector: 'Technology',
    quantity: '1',
    current_price: '100',
    amount_value: '100'
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvestments();
  }, []);

  async function loadInvestments() {
    try {
      const res = await apiFetch('/investments');
      setInvestments(res.investments || []);
    } catch (err) {
      console.error('Failed to load holdings:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (inv = null) => {
    if (inv) {
      setEditingInv(inv);
      setFormData({
        asset_name: inv.asset_name,
        asset_type: inv.asset_type,
        sector: inv.sector,
        quantity: inv.quantity,
        current_price: inv.current_price,
        amount_value: inv.amount_value
      });
    } else {
      setEditingInv(null);
      setFormData({
        asset_name: '',
        asset_type: 'Stocks',
        sector: 'Technology',
        quantity: '10',
        current_price: '150',
        amount_value: '1500'
      });
    }
    setModalOpen(true);
  };

  const handlePriceChange = (q, p) => {
    const val = Number(q || 0) * Number(p || 0);
    setFormData(prev => ({ ...prev, quantity: q, current_price: p, amount_value: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingInv) {
        await apiFetch(`/investments/${editingInv.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await apiFetch('/investments', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setModalOpen(false);
      loadInvestments();
    } catch (err) {
      alert(err.message || 'Failed to save holding');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this holding?')) return;
    try {
      await apiFetch(`/investments/${id}`, { method: 'DELETE' });
      loadInvestments();
    } catch (err) {
      alert('Failed to delete holding');
    }
  };

  const totalValue = investments.reduce((sum, inv) => sum + Number(inv.amount_value), 0);
  
  // Asset Type distribution
  const typeMap = {};
  investments.forEach(inv => {
    typeMap[inv.asset_type] = (typeMap[inv.asset_type] || 0) + Number(inv.amount_value);
  });
  const assetPieData = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

  // Largest holding
  const sorted = [...investments].sort((a, b) => Number(b.amount_value) - Number(a.amount_value));
  const largestHolding = sorted[0];
  const largestPct = totalValue > 0 && largestHolding ? (Number(largestHolding.amount_value) / totalValue) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-sky-500" />
            Investment Portfolio Holdings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track asset allocation, sector exposure, and portfolio concentration.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Portfolio Asset
        </button>
      </div>

      {/* Metrics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="opaque-card">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Total Portfolio Value</span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white">${totalValue.toLocaleString()}</span>
        </div>
        <div className="opaque-card">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Total Asset Count</span>
          <span className="text-xl font-extrabold text-sky-500">{investments.length} Asset Holdings</span>
        </div>
        <div className="opaque-card">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Largest Holding Concentration</span>
          <span className={`text-xl font-extrabold ${largestPct > 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
            {largestHolding ? `${largestHolding.asset_name} (${largestPct.toFixed(1)}%)` : 'None'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Holdings Table */}
        <div className="lg:col-span-2 opaque-card space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Portfolio Holdings</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Asset Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Sector</th>
                  <th className="p-3 text-right">Quantity</th>
                  <th className="p-3 text-right">Price ($)</th>
                  <th className="p-3 text-right">Market Value ($)</th>
                  <th className="p-3 text-right">Weight</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {investments.length > 0 ? (
                  investments.map((inv) => {
                    const weight = totalValue > 0 ? (Number(inv.amount_value) / totalValue) * 100 : 0;
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors">
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">{inv.asset_name}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[10px]">
                            {inv.asset_type}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{inv.sector}</td>
                        <td className="p-3 text-right">{inv.quantity}</td>
                        <td className="p-3 text-right">${Number(inv.current_price).toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-slate-900 dark:text-white">${Number(inv.amount_value).toLocaleString()}</td>
                        <td className="p-3 text-right font-semibold text-sky-500">{weight.toFixed(1)}%</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleOpenModal(inv)} className="p-1 text-slate-400 hover:text-sky-500">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(inv.id)} className="p-1 text-slate-400 hover:text-rose-500">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="p-6 text-center text-slate-400">
                      No portfolio holdings recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Asset Class Distribution Pie Chart */}
        <div className="opaque-card space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Asset Class Distribution</h2>
          <div className="h-64">
            {assetPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RePie>
                  <Pie data={assetPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {assetPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                </RePie>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                No investment data recorded.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 100% OPAQUE Add/Edit Holding Modal */}
      <OpaqueModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingInv ? 'Edit Portfolio Asset' : 'Add New Portfolio Asset'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Asset Name</label>
            <input
              type="text"
              required
              value={formData.asset_name}
              onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
              placeholder="e.g. Apple Inc (AAPL), S&P 500 ETF, US Treasury Bond"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Asset Class</label>
              <select
                value={formData.asset_type}
                onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              >
                {ASSET_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Sector</label>
              <select
                value={formData.sector}
                onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              >
                {SECTORS.map(sec => <option key={sec} value={sec}>{sec}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Quantity</label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={formData.quantity}
                onChange={(e) => handlePriceChange(e.target.value, formData.current_price)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Price per Unit ($)</label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={formData.current_price}
                onChange={(e) => handlePriceChange(formData.quantity, e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Total Value ($)</label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={formData.amount_value}
                onChange={(e) => setFormData({ ...formData, amount_value: e.target.value })}
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
              {editingInv ? 'Save Changes' : 'Add Asset'}
            </button>
          </div>
        </form>
      </OpaqueModal>
    </div>
  );
}
