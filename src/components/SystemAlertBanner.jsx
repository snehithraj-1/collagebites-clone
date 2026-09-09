import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function SystemAlertBanner({ orderingEnabled }) {
  if (orderingEnabled) return null;

  return (
    <div className="bg-rose-500/10 border-b border-rose-500/20 text-rose-800 py-2.5 px-4 text-center text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-xs animate-fade-in">
      <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
      <span>Currently Unavailable</span>
    </div>
  );
}
