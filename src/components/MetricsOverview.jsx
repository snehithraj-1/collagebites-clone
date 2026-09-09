import React from 'react';
import { ShoppingBag, CheckCircle2, XCircle, Store, Power } from 'lucide-react';

export default function MetricsOverview({ orders, restaurants, orderingEnabled }) {
  const totalOrders = orders.length;
  const confirmedOrders = orders.filter((o) => o.status === 'CONFIRMED' || !['CANCELLED', 'EXPIRED'].includes(o.status)).length;
  const cancelledOrders = orders.filter((o) => ['CANCELLED', 'EXPIRED'].includes(o.status)).length;
  const activeRestaurants = restaurants.filter((r) => r.is_open !== false).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
      
      {/* 1. Total Orders */}
      <div className="admin-card p-4 sm:p-5 flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-500/30">
          <ShoppingBag size={20} />
        </div>
        <div>
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Orders</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white mt-0.5">
            {totalOrders}
          </div>
        </div>
      </div>

      {/* 2. Confirmed Orders */}
      <div className="admin-card p-4 sm:p-5 flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
          <CheckCircle2 size={20} />
        </div>
        <div>
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Confirmed</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 mt-0.5">
            {confirmedOrders}
          </div>
        </div>
      </div>

      {/* 3. Cancelled Orders */}
      <div className="admin-card p-4 sm:p-5 flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0 border border-rose-500/30">
          <XCircle size={20} />
        </div>
        <div>
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Cancelled</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-rose-400 mt-0.5">
            {cancelledOrders}
          </div>
        </div>
      </div>

      {/* 4. Active Restaurants */}
      <div className="admin-card p-4 sm:p-5 flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/30">
          <Store size={20} />
        </div>
        <div>
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Vendors</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white mt-0.5">
            {activeRestaurants} <span className="text-xs text-slate-500 font-normal">/ {restaurants.length}</span>
          </div>
        </div>
      </div>

      {/* 5. System Status */}
      <div className="col-span-2 lg:col-span-1 admin-card p-4 sm:p-5 flex items-center gap-3.5 border-blue-500/40">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 border ${
          orderingEnabled 
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
            : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
        }`}>
          <Power size={20} className={orderingEnabled ? 'animate-pulse' : ''} />
        </div>
        <div>
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">System State</div>
          <div className={`text-base font-black uppercase mt-0.5 ${
            orderingEnabled ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {orderingEnabled ? '🟢 Active' : '🔴 Paused'}
          </div>
        </div>
      </div>

    </div>
  );
}
