import React, { useState, useEffect } from 'react';
import { apiFetch, formatINR } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';

export function Reports() {
  const { user } = useAuth();
  const [personalRisk, setPersonalRisk] = useState(null);
  const [portfolioRisk, setPortfolioRisk] = useState(null);
  const [creditRisk, setCreditRisk] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [pRes, portRes, credRes] = await Promise.all([
          apiFetch('/risk/personal'),
          apiFetch('/risk/portfolio'),
          apiFetch('/risk/credit')
        ]);
        setPersonalRisk(pRes.assessment);
        setPortfolioRisk(portRes.portfolioRisk);
        setCreditRisk(credRes.creditRisk);
      } catch (err) {
        console.error('Failed to load report data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDownloadCSV = () => {
    if (!personalRisk) return;
    const m = personalRisk.metrics;
    const csvRows = [
      ['Metric', 'Value (INR ₹)'],
      ['Monthly Net Income', m.monthlyIncome],
      ['Essential Expenses', m.essentialExp],
      ['Discretionary Expenses', m.discretionaryExp],
      ['Total Monthly Expenses', m.totalMonthlyExpenses],
      ['Monthly Debt Payment (EMI)', m.totalDebtPayment],
      ['Net Monthly Cash Flow', m.netCashFlow],
      ['Liquid Savings', m.existingSavings],
      ['Emergency Fund Reserve', m.emergencyFund],
      ['Savings Rate (%)', `${m.savingsRate}%`],
      ['Debt-to-Income DTI (%)', `${m.dtiRatio}%`],
      ['Emergency Reserve Coverage (Months)', m.emergencyCoverageMonths],
      ['Overall Risk Score (0-100)', personalRisk.overallScore],
      ['Risk Level', personalRisk.overallLevel]
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Finance_Risk_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    if (!personalRisk) return;

    const doc = new jsPDF();
    const margin = 15;
    let y = 20;

    // Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FINANCE RISK ANALYTICS REPORT (INR ₹)', margin, y);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`User: ${user?.email || 'Authenticated User'} | Generated: ${new Date().toLocaleString()}`, margin, y + 8);

    y = 45;

    // Overall Score
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Overall Risk Score: ${personalRisk.overallScore} / 100 (${personalRisk.overallLevel})`, margin, y);
    y += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(personalRisk.overallSummary, 180), margin, y);
    y += 15;

    // Financial Metrics
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Metrics Summary', margin, y);
    y += 6;

    const m = personalRisk.metrics;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Monthly Income: ${formatINR(m.monthlyIncome)}`, margin, y);
    doc.text(`Monthly Expenses: ${formatINR(m.totalMonthlyExpenses)}`, margin + 80, y);
    y += 6;
    doc.text(`Monthly EMI Debt Payment: ${formatINR(m.totalDebtPayment)}`, margin, y);
    doc.text(`Net Monthly Cash Flow: ${formatINR(m.netCashFlow)}`, margin + 80, y);
    y += 6;
    doc.text(`Debt-to-Income (DTI): ${m.dtiRatio}%`, margin, y);
    doc.text(`Emergency Coverage: ${m.emergencyCoverageMonths} Months`, margin + 80, y);

    y += 15;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Developed for educational and analytical purposes. Model estimates — not professional financial or credit advice.', margin, y);

    doc.save(`Finance_Risk_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading Report Exporter...</div>;
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 font-display">
            <FileText className="w-7 h-7 text-[#2563EB] dark:text-[#0EA5E9]" />
            Executive Reports & Data Exports
          </h1>
          <p className="text-xs text-[#475569] dark:text-[#9CA3AF] mt-1 font-medium">
            Download comprehensive PDF risk audit reports or raw CSV financial metric exports in Indian Rupees (₹).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Download Card */}
        <div className="opaque-card space-y-4 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-xl bg-blue-100 text-[#2563EB] dark:bg-sky-950 dark:text-[#0EA5E9]">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Executive PDF Risk Summary</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Formatted PDF document in ₹</p>
            </div>
          </div>

          <p className="text-xs text-[#475569] dark:text-slate-300 leading-relaxed font-medium">
            Generates an executive PDF report containing your financial scorecards, category decomposition, portfolio VaR, and credit metrics.
          </p>

          <button
            onClick={handleDownloadPDF}
            className="w-full py-3 bg-[#2563EB] dark:bg-[#0EA5E9] hover:bg-blue-700 dark:hover:bg-sky-400 text-white font-extrabold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download PDF Report
          </button>
        </div>

        {/* CSV Download Card */}
        <div className="opaque-card space-y-4 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Raw Financial Metrics CSV</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Comma-Separated Values format</p>
            </div>
          </div>

          <p className="text-xs text-[#475569] dark:text-slate-300 leading-relaxed font-medium">
            Exports raw structured CSV data containing your financial metrics, income/expense totals, DTI, cash flow, and emergency reserves for Excel analysis.
          </p>

          <button
            onClick={handleDownloadCSV}
            className="w-full py-3 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download CSV Export
          </button>
        </div>
      </div>
    </div>
  );
}
