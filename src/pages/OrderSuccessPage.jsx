import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, MapPin, ArrowRight, Home, Receipt, Phone, ShieldCheck, Printer, Clock, Bike, Volume2, CheckCheck, Sparkles, AlertCircle } from 'lucide-react';
import { playStudentChime, sendStudentNotification, unlockStudentAudio } from '../lib/notificationSound';

export default function OrderSuccessPage({ order, onGoHome, onViewHistory }) {
  if (!order) return null;

  const [liveOrder, setLiveOrder] = useState(order);
  const [stageAlert, setStageAlert] = useState(null);
  const prevStatusRef = useRef(order.status || 'CONFIRMED');

  useEffect(() => {
    setLiveOrder(order);
    if (order.status) prevStatusRef.current = order.status;
  }, [order]);

  // Unlock audio on interaction
  useEffect(() => {
    const unlock = () => unlockStudentAudio();
    window.addEventListener('click', unlock, { passive: true, once: true });
    window.addEventListener('touchstart', unlock, { passive: true, once: true });
  }, []);

  // Poll order status live every 2 seconds
  useEffect(() => {
    if (!order?.id) return;

    let isMounted = true;

    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.order && isMounted) {
            const newStatus = data.order.status;
            const prevStatus = prevStatusRef.current;

            setLiveOrder(data.order);

            // Detect real-time status transitions from Rider Portal
            if (prevStatus && prevStatus !== newStatus) {
              prevStatusRef.current = newStatus;

              if (newStatus === 'OUT_FOR_DELIVERY') {
                playStudentChime('OUT_FOR_DELIVERY');
                const riderName = data.order.delivery_partner_name || 'Assigned Rider';
                const msg = `Your food has been picked up by ${riderName} and is on its way to SRM Gate 3!`;
                setStageAlert({
                  type: 'OUT_FOR_DELIVERY',
                  title: 'Order Out For Delivery! 🚀',
                  message: msg
                });
                sendStudentNotification('🚀 Food is Out for Delivery!', `Order #${order.id}: ${msg}`);
              } else if (newStatus === 'DELIVERED') {
                playStudentChime('DELIVERED');
                const msg = `Your meal from ${data.order.restaurant_name || 'Kitchen'} has arrived at SRM Gate 3! Please collect your parcel.`;
                setStageAlert({
                  type: 'DELIVERED',
                  title: 'Food Arrived at Gate 3! 🎉',
                  message: msg
                });
                sendStudentNotification('🎉 Food Delivered!', `Order #${order.id}: ${msg}`);
              }
            } else {
              prevStatusRef.current = newStatus;
            }
          }
        }
      } catch (e) {}
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [order?.id]);

  const currentStatus = liveOrder.status || order.status || 'CONFIRMED';

  const orderDate = liveOrder.created_at || order.created_at
    ? new Date(liveOrder.created_at || order.created_at).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  const orderItems = liveOrder.items || order.items || liveOrder.order_items || order.order_items || [];
  const subtotal = Math.max(0, (Number(liveOrder.total_amount || order.total_amount) || 0) - 5);

  const handlePrint = () => {
    window.print();
  };

  const handleTestSound = () => {
    unlockStudentAudio();
    playStudentChime(currentStatus === 'DELIVERED' ? 'DELIVERED' : 'OUT_FOR_DELIVERY');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6 animate-fade-in pb-28 md:pb-16">
      
      {/* Live Flash Alert Banner when Rider updates status */}
      {stageAlert && (
        <div className={`p-4 rounded-2xl border shadow-xl flex items-start gap-3 animate-slide-down ${
          stageAlert.type === 'DELIVERED'
            ? 'bg-emerald-500 text-white border-emerald-400'
            : 'bg-blue-600 text-white border-blue-400'
        }`}>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 text-xl">
            {stageAlert.type === 'DELIVERED' ? <CheckCheck size={22} /> : <Bike size={22} className="animate-bounce" />}
          </div>
          <div className="flex-1">
            <h3 className="font-black text-base font-['Outfit']">{stageAlert.title}</h3>
            <p className="text-xs text-white/90 font-medium mt-0.5">{stageAlert.message}</p>
          </div>
          <button
            onClick={() => setStageAlert(null)}
            className="p-1 text-white/70 hover:text-white bg-transparent border-none cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Verified Order Confirmation Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 text-center border border-[#E2D9D0] shadow-sm space-y-4">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-md border ${
          currentStatus === 'DELIVERED'
            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
            : currentStatus === 'OUT_FOR_DELIVERY'
            ? 'bg-blue-50 text-blue-600 border-blue-200'
            : 'bg-emerald-50 text-emerald-600 border-emerald-200'
        }`}>
          {currentStatus === 'OUT_FOR_DELIVERY' ? (
            <Bike size={36} className="text-blue-600 animate-bounce" />
          ) : currentStatus === 'DELIVERED' ? (
            <CheckCheck size={36} className="text-emerald-600" />
          ) : (
            <CheckCircle2 size={36} className="text-emerald-600" />
          )}
        </div>
        
        <div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
            currentStatus === 'DELIVERED'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : currentStatus === 'OUT_FOR_DELIVERY'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {currentStatus === 'OUT_FOR_DELIVERY' ? '🚀 Out For Delivery' : currentStatus === 'DELIVERED' ? '✅ Food Delivered' : '👨‍🍳 Order Confirmed'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] font-['Outfit'] mt-2 tracking-tight">
            {currentStatus === 'OUT_FOR_DELIVERY' ? 'Your Food is on the Way!' : currentStatus === 'DELIVERED' ? 'Enjoy Your Meal!' : 'Thank You for Your Order!'}
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            {currentStatus === 'OUT_FOR_DELIVERY'
              ? `Rider ${liveOrder.delivery_partner_name || 'Partner'} has picked up your food and is heading to SRM Gate 3.`
              : currentStatus === 'DELIVERED'
              ? 'Your order has been handed over at SRM University Gate 3.'
              : `Your order has been confirmed and is being cooked by ${order.restaurant_name}.`}
          </p>
        </div>

        {/* Live Delivery Progress Pipeline */}
        <div className="pt-3 border-t border-[#F1EAE4] grid grid-cols-3 gap-2 text-center text-xs">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px]">✓</div>
            <span className="font-bold text-slate-800 mt-1 text-[11px]">Confirmed</span>
          </div>
          <div className="flex flex-col items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
              currentStatus === 'OUT_FOR_DELIVERY' || currentStatus === 'DELIVERED'
                ? 'bg-blue-600 text-white animate-pulse'
                : 'bg-slate-200 text-slate-500'
            }`}>
              {currentStatus === 'DELIVERED' ? '✓' : '🛵'}
            </div>
            <span className={`font-bold mt-1 text-[11px] ${
              currentStatus === 'OUT_FOR_DELIVERY' || currentStatus === 'DELIVERED' ? 'text-blue-600' : 'text-slate-400'
            }`}>Out for Delivery</span>
          </div>
          <div className="flex flex-col items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
              currentStatus === 'DELIVERED'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-200 text-slate-500'
            }`}>
              {currentStatus === 'DELIVERED' ? '✓' : '3'}
            </div>
            <span className={`font-bold mt-1 text-[11px] ${
              currentStatus === 'DELIVERED' ? 'text-emerald-600' : 'text-slate-400'
            }`}>Delivered</span>
          </div>
        </div>

        {/* Audio notification sound test button */}
        <div className="pt-2 flex items-center justify-center">
          <button
            onClick={handleTestSound}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-200"
          >
            <Volume2 size={13} className="text-[#FF5722]" />
            <span>Sound Alert: Active (Test Chime)</span>
          </button>
        </div>
      </div>

      {/* 2. Itemized Bill & Receipt Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[#E2D9D0] shadow-sm space-y-5">
        
        {/* Receipt Meta */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#F1EAE4] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-[#0F172A] font-['Outfit']">CampusBites</span>
              <span className="px-2 py-0.5 rounded bg-[#FFF0EB] text-[#FF5722] text-[10px] font-black uppercase">
                Invoice
              </span>
            </div>
            <div className="text-xs text-[#0F172A] font-bold mt-1">
              {order.restaurant_name}
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5 flex items-center gap-1">
              <Clock size={12} />
              <span>{orderDate}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
              Order ID
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-[#FF5722]">
              #{order.id}
            </div>
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border mt-1 ${
              currentStatus === 'DELIVERED'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : currentStatus === 'OUT_FOR_DELIVERY'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <ShieldCheck size={11} />
              <span>Status: {currentStatus.replace(/_/g, ' ')}</span>
            </div>
          </div>
        </div>

        {/* Assigned Delivery Partner Banner (if assigned) */}
        {liveOrder.delivery_partner_name && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between gap-3 text-xs animate-fade-in shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg shadow-sm">
                🛵
              </div>
              <div>
                <div className="text-[10px] font-black text-blue-800 uppercase tracking-wider flex items-center gap-1">
                  <span>{currentStatus === 'OUT_FOR_DELIVERY' ? '🚀 Out on Road with Rider' : 'Assigned Campus Rider'}</span>
                  {currentStatus === 'OUT_FOR_DELIVERY' && <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />}
                </div>
                <div className="font-extrabold text-[#0F172A] text-sm">
                  {liveOrder.delivery_partner_name}
                </div>
                {liveOrder.delivery_partner_phone && (
                  <div className="text-[11px] text-slate-500 font-mono">
                    Phone: {liveOrder.delivery_partner_phone}
                  </div>
                )}
              </div>
            </div>

            {liveOrder.delivery_partner_phone && (
              <a
                href={`tel:${liveOrder.delivery_partner_phone}`}
                className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all no-underline shrink-0"
              >
                <Phone size={13} />
                <span>Call Rider</span>
              </a>
            )}
          </div>
        )}

        {/* Student and Delivery Destination */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E2D9D0] text-xs">
          <div>
            <div className="font-bold text-[#64748B] uppercase text-[10px] tracking-wider mb-1">
              Student Details
            </div>
            <div className="font-bold text-[#0F172A] text-sm">{order.student_name}</div>
            {order.student_email && (
              <div className="text-[#64748B] text-[11px] font-mono mt-0.5">{order.student_email}</div>
            )}
            {order.student_phone && (
              <div className="text-[#64748B] flex items-center gap-1 mt-1 font-mono">
                <Phone size={11} className="text-[#FF5722]" />
                <span>{order.student_phone}</span>
              </div>
            )}
          </div>

          <div>
            <div className="font-bold text-[#64748B] uppercase text-[10px] tracking-wider mb-1">
              Delivery Drop Location
            </div>
            <div className="flex items-start gap-1.5 text-[#0F172A] font-bold">
              <MapPin size={14} className="text-[#FF5722] shrink-0 mt-0.5" />
              <span>{order.delivery_location || 'SRM University - Gate 3'}</span>
            </div>
            {order.instructions && (
              <div className="text-[#64748B] italic mt-1.5 text-[11px] bg-white p-2 rounded-lg border border-[#E2D9D0]">
                "{order.instructions}"
              </div>
            )}
          </div>
        </div>

        {/* Itemized Dishes List */}
        <div className="space-y-2">
          <div className="font-bold text-[#64748B] uppercase text-[10px] tracking-wider">
            Ordered Items
          </div>

          <div className="border border-[#E2D9D0] rounded-xl overflow-hidden divide-y divide-[#F1EAE4]">
            {orderItems.map((item, idx) => (
              <div key={idx} className="p-3 flex items-center justify-between text-xs bg-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded bg-[#FAF8F5] text-[#64748B] font-black text-[11px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-[#0F172A]">{item.name}</div>
                    <div className="text-[#64748B] text-[11px]">
                      ₹{item.price} × {item.quantity}
                    </div>
                  </div>
                </div>

                <div className="font-mono font-black text-xs sm:text-sm text-[#0F172A]">
                  ₹{item.price * item.quantity}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Breakdown */}
        <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E2D9D0] space-y-1.5 text-xs">
          <div className="flex justify-between text-[#64748B]">
            <span>Items Subtotal</span>
            <span className="font-mono font-bold text-[#0F172A]">₹{subtotal}</span>
          </div>
          <div className="flex justify-between text-[#64748B]">
            <span>Campus Platform Fee</span>
            <span className="font-mono font-bold text-[#0F172A]">₹5</span>
          </div>
          <div className="flex justify-between text-[#64748B]">
            <span>Campus Delivery</span>
            <span className="font-bold text-emerald-700 uppercase text-[11px]">Free Campus Delivery</span>
          </div>

          <div className="pt-2 border-t border-[#E2D9D0] flex justify-between items-center text-base font-black text-[#0F172A]">
            <span>Total Amount</span>
            <span className="text-[#FF5722] font-mono font-black text-xl">
              ₹{order.total_amount}
            </span>
          </div>
        </div>

        {/* Print / Save Receipt Action */}
        <div className="pt-1 flex justify-end">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#E2D9D0] bg-white text-[#0F172A] text-xs font-bold hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          >
            <Printer size={13} />
            <span>Print Receipt</span>
          </button>
        </div>

      </div>

      {/* 3. Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          onClick={onGoHome}
          className="py-3 px-4 rounded-xl border border-[#E2D9D0] bg-white hover:bg-[#FAF8F5] text-[#0F172A] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <Home size={15} />
          <span>Back to Home</span>
        </button>

        <button
          onClick={onViewHistory}
          className="py-3 px-4 rounded-xl bg-[#FF5722] hover:bg-[#F4511E] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer border-none shadow-sm transition-colors"
        >
          <span>View My Orders</span>
          <ArrowRight size={15} />
        </button>
      </div>

    </div>
  );
}
