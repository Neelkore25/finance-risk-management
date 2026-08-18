import React from 'react';

export function RiskBadge({ level, score }) {
  let styleClass = 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800';

  if (level === 'Moderate Risk' || level === 'Moderate' || (score >= 30 && score < 60)) {
    styleClass = 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800';
  } else if (level === 'High Risk' || level === 'High' || (score >= 60 && score < 80)) {
    styleClass = 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800';
  } else if (level === 'Critical Risk' || level === 'Critical' || score >= 80) {
    styleClass = 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border opacity-100 ${styleClass}`}>
      {score !== undefined && <span className="mr-1">{score}/100 •</span>}
      {level || 'Unknown Risk'}
    </span>
  );
}
