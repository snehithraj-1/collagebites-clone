import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, ShoppingBag, ArrowLeft, CheckCircle2, XCircle, AlertCircle, MapPin, Phone } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useStudentAuth } from '../context/StudentAuthContext';

export default function OrderHistoryPage({ onBackToRestaurants, onTrackOrder }) {
  const { profile } = useStudentAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrders = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      // 1. Try to fetch from Shared Central API
      const res = await fetch(`/api/orders/student/${encodeURIComponent(profile?.email || profile?.id || '')}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.orders) && json.orders.length > 0) {
          setOrders(json.orders);
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }
      }
    } catch (apiErr) {
      // Continue to Supabase / local
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (*)
          `)
          .eq('user_id', profile?.id)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setOrders(data);
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }
      } catch (err) {
        console.warn('[Supabase Orders History]:', err.message);
      }
    }

    // Fallback local persistence
    try {
      const stored = JSON.parse(localStorage.getItem('cb_shared_orders') || '[]');
      const filtered = stored.filter(
        (o) => !o.user_id || o.user_id === profile?.id || o.student_email === profile?.email
      );
      setOrders(filtered);
    } catch {
      setOrders([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (profile?.id || profile?.email) {
      fetchOrders();

      // Poll shared backend every 2.5s for live status updates from Admin
      const interval = setInterval(() => {
        fetchOrders(true);
      }, 2500);

      // Realtime updates for live status changes on student's orders via Supabase
      if (isSupabaseConfigured() && supabase) {
        const channel = supabase
          .channel(`student-orders-${profile.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'orders',
              filter: `user_id=eq.${profile.id}`
            },
            () => {
              fetchOrders(true);
            }
          )
          .subscribe();

        return () => {
          clearInterval(interval);
          supabase.removeChannel(channel);
        };
      }

      return () => clearInterval(interval);
    }
  }, [profile?.id, profile?.email]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return { label: 'Confirmed 🍲', bg: 'bg-amber-50 text-amber-700 border-amber-200 font-bold' };
      case 'OUT_FOR_DELIVERY':
        return { label: 'Out for Delivery 🛵', bg: 'bg-blue-50 text-blue-700 border-blue-200 font-bold' };
      case 'DELIVERED':
        return { label: 'Delivered ✅', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' };
      case 'CANCELLED':
        return { label: 'Cancelled ❌', bg: 'bg-rose-50 text-rose-700 border-rose-200 font-bold' };
      default:
        return { label: status || 'Confirmed', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F1EAE4] pb-4">
        <div>
          <button
            onClick={onBackToRestaurants}
            className="flex items-center gap-1.5 text-xs font-bold text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer border-none bg-transparent p-0 mb-2"
          >
            <ArrowLeft size={16} />
            <span>Back to Restaurants</span>
          </button>
          <h2 className="text-2xl font-black text-[#0F172A] font-['Outfit']">
            My Order History
          </h2>
          <p className="text-xs text-[#64748B]">
            Only showing orders placed by your student account ({profile?.email})
          </p>
        </div>

        <button
          onClick={() => fetchOrders(true)}
          disabled={isRefreshing}
          className="p-2.5 rounded-xl bg-white border border-[#E2D9D0] text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
          title="Refresh Orders"
        >
          <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-[#FF5722]' : ''} />
        </button>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-3 border-[#FF5722] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-[#64748B] font-bold">Loading your orders from Supabase...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="card-elevated p-12 text-center space-y-3">
          <div className="text-5xl">📦</div>
          <h3 className="text-lg font-bold text-[#0F172A] font-['Outfit']">No past orders yet</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            You haven't placed any food orders yet. Pick dishes from our campus kitchens and enjoy doorstep delivery!
          </p>
          <button
            onClick={onBackToRestaurants}
            className="btn-primary py-2.5 px-6 rounded-xl text-xs font-bold mt-2 cursor-pointer border-none"
          >
            Browse Food Menu
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const badge = getStatusBadge(order.status);
            let dateFormatted = 'Just now';
            try {
              const d = new Date(order.created_at);
              if (!isNaN(d.getTime())) {
                dateFormatted = d.toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
              }
            } catch {}

            let orderItems = [];
            const rawItems = order.order_items || order.items || [];
            if (typeof rawItems === 'string') {
              try { orderItems = JSON.parse(rawItems); } catch { orderItems = []; }
            } else if (Array.isArray(rawItems)) {
              orderItems = rawItems;
            }

            return (
              <div key={order.id} className="card-elevated p-5 sm:p-6 space-y-3">
                {/* Order Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F1EAE4] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-[#0F172A]">
                        #{order.id}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="font-extrabold text-xs text-[#0F172A]">
                        {order.restaurant_name || 'Campus Kitchen'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#64748B] mt-0.5">
                      Placed on {dateFormatted}
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${badge.bg}`}>
                    {badge.label}
                  </span>
                </div>

                {/* Items and Location */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="sm:col-span-2 space-y-1">
                    <div className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                      Ordered Items:
                    </div>
                    <div className="text-[#0F172A] font-medium leading-relaxed">
                      {orderItems.length > 0
                        ? orderItems.map((item, idx) => (
                            <span key={idx}>
                              {item.name || item.item_name || 'Food Item'} <strong className="font-mono text-[#FF5722]">x{item.quantity || item.qty || 1}</strong>
                              {idx < orderItems.length - 1 ? ', ' : ''}
                            </span>
                          ))
                        : 'Food order'}
                    </div>
                  </div>

                  <div className="sm:text-right space-y-1">
                    <div className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                      Total Bill:
                    </div>
                    <div className="text-base font-black font-mono text-[#FF5722]">
                      ₹{order.total_amount}
                    </div>
                  </div>
                </div>

                {/* Assigned Delivery Partner Banner with 1-Tap Call */}
                {order.delivery_partner_name && (
                  <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-base">
                        🛵
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Delivery Partner</span>
                        <span className="font-extrabold text-[#0F172A]">{order.delivery_partner_name}</span>
                      </div>
                    </div>

                    {order.delivery_partner_phone && (
                      <a
                        href={`tel:${order.delivery_partner_phone}`}
                        className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <Phone size={12} />
                        <span>Call Partner</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Drop Destination & Track Button */}
                <div className="pt-2.5 border-t border-[#F1EAE4] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#64748B]">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-[#FF5722]" />
                    <span>Drop: {order.delivery_location}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onTrackOrder && onTrackOrder(order)}
                      className="px-3 py-1.5 rounded-xl bg-[#FFF0EB] hover:bg-[#FF5722] text-[#FF5722] hover:text-white text-xs font-bold transition-all cursor-pointer border border-[#FFD3C4] flex items-center gap-1 shadow-xs"
                    >
                      <span>View Bill & Track</span>
                      <span>➔</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
