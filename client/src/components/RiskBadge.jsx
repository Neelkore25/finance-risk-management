import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

export function RiskBadge({ level, score }) {
  let effectiveLevel = level;
  if (!effectiveLevel && score !== undefined) {
    if (score >= 60) effectiveLevel = 'High Risk';
    else if (score >= 35) effectiveLevel = 'Moderate Risk';
    else effectiveLevel = 'Low Risk';
  }
  if (!effectiveLevel) effectiveLevel = 'Low Risk';

  let styleClass = 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800';
  let Icon = ShieldCheck;

  if (effectiveLevel.includes('Moderate') || (score >= 35 && score < 60)) {
    styleClass = 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800';
    Icon = AlertTriangle;
  } else if (effectiveLevel.includes('High') || (score >= 60 && score < 80)) {
    styleClass = 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800';
    Icon = ShieldAlert;
  } else if (effectiveLevel.includes('Critical') || score >= 80) {
    styleClass = 'bg-rose-200 text-rose-950 border-rose-400 dark:bg-rose-900 dark:text-rose-200 dark:border-rose-700';
    Icon = ShieldAlert;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${styleClass}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {score !== undefined && <span className="mr-0.5 font-mono tabular-nums">{score}/100 •</span>}
      {effectiveLevel}
    </span>
  );
}
