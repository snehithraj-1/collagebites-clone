import React, { useState } from 'react';
import { Power, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function SystemToggle({ orderingEnabled, onToggleSuccess }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async () => {
    const nextState = !orderingEnabled;
    setIsUpdating(true);

    try {
      // 1. Update Neon PostgreSQL shared backend
      await fetch('/api/settings/ordering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordering_enabled: nextState })
      });

      // 2. Also sync to Supabase if configured
      if (isSupabaseConfigured() && supabase) {
        try {
          await supabase
            .from('system_settings')
            .upsert({
              id: 'global',
              ordering_enabled: nextState,
              updated_at: new Date().toISOString()
            });
        } catch (supaErr) {
          console.warn('[Supabase Sync Warning]:', supaErr.message);
        }
      }

      // 3. Fallback localStorage
      localStorage.setItem('cb_shared_ordering_enabled', String(nextState));
      onToggleSuccess(nextState);
    } catch (err) {
      console.error('[System Toggle Error]:', err);
      // Still update locally
      onToggleSuccess(nextState);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="admin-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-slate-700/80">
      <div className="flex items-start gap-3.5">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl shadow-lg ${
          orderingEnabled
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
        }`}>
          {orderingEnabled ? '🟢' : '🔴'}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-white font-['Outfit']">
              Overall Campus Ordering System
            </h3>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              orderingEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}>
              {orderingEnabled ? 'SYSTEM ACTIVE' : 'PAUSED'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            {orderingEnabled
              ? 'Students can browse dishes, build carts, and place new orders normally across all open restaurants.'
              : 'Master ordering is paused. Students can view restaurants and menus, but cannot place new orders.'}
          </p>
        </div>
      </div>

      <button
        onClick={handleToggle}
        disabled={isUpdating}
        className={`px-6 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer border flex items-center justify-center gap-2 shadow-lg self-start sm:self-auto disabled:opacity-50 ${
          orderingEnabled
            ? 'bg-rose-950/70 hover:bg-rose-900 text-rose-200 border-rose-700 hover:border-rose-600 shadow-rose-950/40'
            : 'bg-emerald-950/70 hover:bg-emerald-900 text-emerald-200 border-emerald-700 hover:border-emerald-600 shadow-emerald-950/40'
        }`}
      >
        <Power size={16} />
        <span>{isUpdating ? 'Updating...' : orderingEnabled ? '[ TURN OFF ORDERING ]' : '[ TURN ON ORDERING ]'}</span>
      </button>
    </div>
  );
}
