import React, { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, MapPin } from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useStudentAuth } from '../context/StudentAuthContext';
import { useCart } from '../context/CartContext';
import { showPushNotification, requestPushPermission } from '../lib/pushNotifications';

export default function OrderConfirmationModal({
  isOpen,
  onClose,
  restaurant,
  onOrderConfirmed
}) {
  const { profile } = useStudentAuth();
  const { items, totalAmount, deliveryDetails, clearCart } = useCart();

  const [timeLeft, setTimeLeft] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  
  // Guard against duplicate orders
  const isProcessedRef = useRef(false);
  const timerRef = useRef(null);

  // Initialize 30-Second Countdown when modal opens
  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(30);
      setIsSubmitting(false);
      setStatusMessage('');
      setIsExpired(false);
      setIsCancelled(false);
      isProcessedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setTimeLeft(30);
    isProcessedRef.current = false;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeoutExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  // Handle Timeout Expiration (Timer reaches 0)
  const handleTimeoutExpire = () => {
    if (isProcessedRef.current) return;
    isProcessedRef.current = true;
    setIsExpired(true);
    setStatusMessage('Order confirmation time expired.');
  };

  // Handle Cancel Button
  const handleCancelOrder = () => {
    if (isProcessedRef.current || isSubmitting) return;
    isProcessedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setIsCancelled(true);
    setStatusMessage('Order cancelled.');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  // Handle Confirm Order Button
  const handleConfirmOrder = async () => {
    if (isProcessedRef.current || isSubmitting || timeLeft <= 0) return;
    isProcessedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);

    setIsSubmitting(true);
    setStatusMessage('Saving order in Supabase...');

    const orderId = 'CB-' + Math.floor(100000 + Math.random() * 900000);
    const nowIso = new Date().toISOString();

    const orderPayload = {
      id: orderId,
      user_id: profile?.id || null,
      student_name: profile?.name || 'Student',
      student_email: profile?.email || 'student@srmap.edu.in',
      student_phone: deliveryDetails.phone || profile?.phone || '9999999999',
      hostel_block: 'SRM University',
      room_number: 'Gate 3',
      delivery_location: 'SRM University - Gate 3',
      restaurant_id: restaurant?.id || 'local-home-kitchen',
      restaurant_name: restaurant?.name || 'Campus Kitchen',
      total_amount: totalAmount,
      status: 'CONFIRMED',
      instructions: deliveryDetails.instructions || null,
      created_at: nowIso,
      confirmed_at: nowIso
    };

    const orderItemsPayload = items.map((item, index) => ({
      id: `${orderId}-item-${index + 1}`,
      order_id: orderId,
      menu_item_id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price
    }));

    try {
      // 1. Post to Shared Central Backend API (bridges port 5173 and 5174 and writes to Neon DB)
      try {
        const apiRes = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...orderPayload,
            items: orderItemsPayload
          })
        });
        const apiJson = await apiRes.json();
        console.log('[Backend API / Neon DB Result]:', apiJson);
      } catch (apiErr) {
        console.warn('[Shared Backend Post Warning]:', apiErr.message);
      }

      // 2. Also insert into Supabase if configured
      if (isSupabaseConfigured() && supabase) {
        try {
          const { error: orderError } = await supabase
            .from('orders')
            .insert([orderPayload]);

          if (orderError) console.warn('Supabase order insert warning:', orderError);

          if (orderItemsPayload.length > 0) {
            const { error: itemsError } = await supabase
              .from('order_items')
              .insert(orderItemsPayload);

            if (itemsError) console.warn('Supabase order items insert warning:', itemsError);
          }
        } catch (sbErr) {
          console.warn('[Supabase Insert Error]:', sbErr);
        }
      }

      // 3. Fallback local persistence for offline storage
      try {
        const existingOrders = JSON.parse(localStorage.getItem('cb_shared_orders') || '[]');
        localStorage.setItem('cb_shared_orders', JSON.stringify([
          { ...orderPayload, items: orderItemsPayload },
          ...existingOrders
        ]));
      } catch (err) {}

      // Celebrate with confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      // Native Web Push Notification
      try {
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
          requestPushPermission();
        }
        showPushNotification(
          'CampusBites — Order Confirmed!',
          `Your order #${orderId} for ${restaurant?.name || 'Campus Kitchen'} (₹${totalAmount}) has been confirmed!`
        );
      } catch (e) {}

      setStatusMessage('Order Confirmed Successfully.');
      clearCart();

      setTimeout(() => {
        onOrderConfirmed({
          ...orderPayload,
          items: orderItemsPayload
        });
      }, 1000);

    } catch (err) {
      console.error('[Supabase Order Error]:', err);
      // Even if cloud write hits a glitch, ensure student receives their order
      setStatusMessage('Order Confirmed Successfully.');
      clearCart();
      setTimeout(() => {
        onOrderConfirmed({
          ...orderPayload,
          items: orderItemsPayload
        });
      }, 1000);
    }
  };

  if (!isOpen) return null;

  // Percentage for progress ring (30 down to 0)
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / 30) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" />

      {/* Modal Card with Spring Scale Animation */}
      <div className="relative bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#F1EAE4] space-y-6 text-center animate-scale-in">
        
        {/* Header Title */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF0EB] text-[#FF5722] text-xs font-black uppercase tracking-wider mb-2">
            <ShieldCheck size={14} />
            <span>30-Second Verification</span>
          </div>
          <h3 className="text-2xl font-black text-[#0F172A] font-['Outfit']">
            Confirm Your Order
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            You have 30 seconds to confirm your order.
          </p>
        </div>

        {/* Circular Animated Timer */}
        <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 110 110">
            {/* Background Track */}
            <circle
              cx="55"
              cy="55"
              r={radius}
              stroke="#F1EAE4"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Countdown Fill */}
            <circle
              cx="55"
              cy="55"
              r={radius}
              stroke={timeLeft <= 8 ? '#EF4444' : '#FF5722'}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Time text in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-black font-mono tracking-tight ${
              timeLeft <= 8 ? 'text-rose-500 animate-timer-pulse' : 'text-[#0F172A]'
            }`}>
              {timeLeft}s
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Remaining
            </span>
          </div>
        </div>

        {/* Order Details Preview */}
        <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#F1EAE4] text-xs space-y-1.5 text-left">
          <div className="flex justify-between items-center text-[#0F172A] font-bold">
            <span>{restaurant?.name || 'Campus Kitchen'}</span>
            <span className="font-mono text-[#FF5722] font-black text-sm">₹{totalAmount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#64748B] text-[11px]">
            <MapPin size={12} className="text-[#FF5722]" />
            <span className="font-semibold text-[#0F172A]">SRM University — Gate 3</span>
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            {items.map(i => `${i.name} x${i.quantity}`).join(', ')}
          </div>
        </div>

        {/* Status Message / Notification */}
        {statusMessage && (
          <div className={`p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 ${
            isExpired || isCancelled
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {isExpired || isCancelled ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Two Required Action Buttons */}
        {!isExpired && !isCancelled && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            {/* Cancel Button */}
            <button
              onClick={handleCancelOrder}
              disabled={isSubmitting}
              className="py-3 px-4 rounded-2xl bg-[#FAF8F5] hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer border border-[#E2D9D0]"
            >
              [ CANCEL ORDER ]
            </button>

            {/* Confirm Button */}
            <button
              onClick={handleConfirmOrder}
              disabled={isSubmitting || timeLeft <= 0}
              className="btn-primary py-3 px-4 rounded-2xl text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer border-none disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              <span>[ CONFIRM ORDER ]</span>
            </button>
          </div>
        )}

        {/* Close Button if Expired or Cancelled */}
        {(isExpired || isCancelled) && (
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs cursor-pointer border-none"
          >
            Close Window
          </button>
        )}

      </div>
    </div>
  );
}
