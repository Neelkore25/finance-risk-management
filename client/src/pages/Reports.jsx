import React, { useState, useEffect } from 'react';
import { apiFetch, getAuthToken } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { FileText, Download, ShieldCheck, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';

export function Reports() {
  const { user } = useAuth();
  const [personalRisk, setPersonalRisk] = useState(null);
  const [portfolioRisk, setPortfolioRisk] = useState(null);
  const [creditRisk, setCreditRisk] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [pRes, portRes, credRes, recRes] = await Promise.all([
          apiFetch('/risk/personal'),
          apiFetch('/risk/portfolio'),
          apiFetch('/risk/credit'),
          apiFetch('/recommendations')
        ]);
        setPersonalRisk(pRes.assessment);
        setPortfolioRisk(portRes.portfolioRisk);
        setCreditRisk(credRes.creditRisk);
        setRecommendations(recRes.recommendations || []);
      } catch (err) {
        console.error('Failed to load report data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDownloadCSV = () => {
    const token = getAuthToken();
    window.open(`/api/reports/csv?token=${token}`, '_blank');
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
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('RISKGUARD FINANCIAL RISK REPORT', margin, y);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`User: ${user?.fullName || 'User'} (${user?.email}) | Generated: ${new Date().toLocaleString()}`, margin, y + 8);

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

    // Category Scores
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Risk Category Decomposition', margin, y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Category', margin, y);
    doc.text('Score', margin + 65, y);
    doc.text('Risk Level', margin + 95, y);
    doc.text('Metric', margin + 140, y);
    y += 4;
    doc.line(margin, y, 195, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    Object.entries(personalRisk.categories).forEach(([key, cat]) => {
      doc.text(key.replace(/([A-Z])/g, ' $1'), margin, y);
      doc.text(`${cat.score}/100`, margin + 65, y);
      doc.text(cat.level, margin + 95, y);
      doc.text(cat.metric, margin + 140, y);
      y += 6;
    });

    y += 8;

    // Quantitative Metrics
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Quantitative Portfolio Risk (VaR)', margin, y);
    y += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Portfolio Value: $${portfolioRisk?.totalValue?.toLocaleString() || 0}`, margin, y);
    doc.text(`1-Day Historical VaR (95%): $${portfolioRisk?.metrics?.historicalVaR1DayAmount?.toLocaleString() || 0} (${portfolioRisk?.metrics?.historicalVaR1DayPct}%)`, margin + 80, y);
    y += 6;
    doc.text(`Sharpe Ratio: ${portfolioRisk?.metrics?.sharpeRatio || 0}`, margin, y);
    doc.text(`Portfolio Beta: ${portfolioRisk?.metrics?.beta || 1}`, margin + 80, y);
    y += 6;
    doc.text(`Max Drawdown: ${portfolioRisk?.metrics?.maxDrawdownPct || 0}%`, margin, y);
    doc.text(`Credit Score: ${creditRisk?.creditScore || 720} (${creditRisk?.tier || 'Good'})`, margin + 80, y);

    y += 15;

    // Recommendations
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Tailored Recommendations', margin, y);
    y += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    recommendations.forEach((rec, i) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${i + 1}. ${rec.recommendation} [${rec.severity}]`, margin, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.text(doc.splitTextToSize(`Action: ${rec.suggestedAction}`, 180), margin + 4, y);
      y += 10;
    });

    // Disclaimer
    y = 280;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('RiskGuard is an educational financial risk-analysis tool and does not provide professional financial advice.', margin, y);

    doc.save(`RiskGuard_Report_${user?.fullName?.replace(/\s+/g, '_') || 'Export'}.pdf`);
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading Report Exporter...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-sky-500" />
            Executive Reports & Data Exports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Download comprehensive PDF risk audit reports or raw CSV financial metric exports.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Download Card */}
        <div className="opaque-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Executive PDF Risk Summary</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Formatted multi-page PDF document</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Generates an enterprise-formatted PDF encompassing scorecards, 6-category risk breakdown, quantitative portfolio VaR, Credit risk score, top 3 risks, and recommendations.
          </p>

          <button
            onClick={handleDownloadPDF}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download PDF Report
          </button>
        </div>

        {/* CSV Download Card */}
        <div className="opaque-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Raw Financial Metrics CSV</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Comma-Separated Values format</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Exports raw structured CSV data containing your financial metrics, income/expense totals, quantitative VaR, Sharpe ratio, and credit metrics for Excel analysis.
          </p>

          <button
            onClick={handleDownloadCSV}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download CSV Export
          </button>
        </div>
      </div>
    </div>
  );
}
