import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bike, Phone, MapPin, Package, CheckCircle2, Navigation, LogOut, RefreshCw, Clock, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff, Lock, HelpCircle, Volume2, VolumeX, Bell, X } from 'lucide-react';
import { playAdminChime, sendAdminNotification, requestNotificationPermission } from '../lib/notificationSound';

export default function RiderPortalPage({ onSwitchToAdmin }) {
  const [rider, setRider] = useState(() => {
    try {
      const saved = localStorage.getItem('cb_active_rider');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [phoneInput, setPhoneInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showDemoHelp, setShowDemoHelp] = useState(false);

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed'

  // Audio Alerts & Live Assignment Notifications
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(soundEnabled);
  const prevRiderOrdersMapRef = useRef(new Map());
  const isFirstLoadRef = useRef(true);
  const [riderAlert, setRiderAlert] = useState(null);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Auto-dismiss rider alert banner after 7 seconds
  useEffect(() => {
    if (!riderAlert) return;
    const timer = setTimeout(() => setRiderAlert(null), 7000);
    return () => clearTimeout(timer);
  }, [riderAlert]);

  // Request browser notification permission on first rider interaction
  useEffect(() => {
    const handleFirstClick = () => {
      requestNotificationPermission();
      window.removeEventListener('click', handleFirstClick);
    };
    window.addEventListener('click', handleFirstClick);
    return () => window.removeEventListener('click', handleFirstClick);
  }, []);

  // Persist rider session
  useEffect(() => {
    try {
      if (rider) {
        localStorage.setItem('cb_active_rider', JSON.stringify(rider));
      } else {
        localStorage.removeItem('cb_active_rider');
      }
    } catch {}
  }, [rider]);

  // Load orders for logged-in rider
  const fetchRiderOrders = useCallback(async (silent = false) => {
    if (!rider?.id && !rider?.phone) return;
    if (!silent) setLoadingOrders(true);

    try {
      const query = rider.id ? `rider_id=${encodeURIComponent(rider.id)}` : `phone=${encodeURIComponent(rider.phone)}`;
      const res = await fetch(`/api/rider/orders?${query}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          setOrders(data.orders);

          // Detect newly assigned deliveries for this rider
          if (!isFirstLoadRef.current) {
            const newlyAssigned = data.orders.filter(
              (o) => !prevRiderOrdersMapRef.current.has(o.id) && o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
            );

            if (newlyAssigned.length > 0) {
              const latest = newlyAssigned[0];
              setRiderAlert({
                type: 'ASSIGNED',
                title: 'New Delivery Assigned! 📦',
                badge: 'New Task',
                order: latest,
                message: `Order #${latest.id.slice(-8)} from ${latest.restaurant_name || 'Kitchen'} ready for delivery!`
              });

              if (soundEnabledRef.current) {
                playAdminChime('new_order');
              }

              sendAdminNotification(
                `📦 New Delivery Assigned: Order #${latest.id.slice(-8)}`,
                `Order from ${latest.restaurant_name || 'Kitchen'} is ready to be delivered to Gate 3!`
              );
            }
          } else {
            isFirstLoadRef.current = false;
          }

          const map = new Map();
          data.orders.forEach(o => map.set(o.id, { status: o.status }));
          prevRiderOrdersMapRef.current = map;
        }
      }
    } catch (err) {
      console.warn('[Rider Orders Fetch Error]:', err);
    } finally {
      if (!silent) setLoadingOrders(false);
    }
  }, [rider]);

  // Polling for live assigned orders every 3 seconds
  useEffect(() => {
    if (!rider) return;
    fetchRiderOrders(false);

    const interval = setInterval(() => {
      fetchRiderOrders(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [rider, fetchRiderOrders]);

  // Handle Rider Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    const cleanPhone = phoneInput.trim().replace(/\D/g, '');
    const cleanPin = pinInput.trim();

    if (!cleanPhone || cleanPhone.length < 10) {
      setLoginError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!cleanPin || cleanPin.length < 4) {
      setLoginError('Please enter your 4-digit security PIN.');
      return;
    }

    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/rider/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, pin: cleanPin })
      });
      const data = await res.json();
      if (data.success && data.rider) {
        setRider(data.rider);
      } else {
        setLoginError(data.error || 'Invalid phone or PIN. Please check credentials or contact dispatch.');
      }
    } catch (err) {
      setLoginError(err.message || 'Network error logging in.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setRider(null);
    setOrders([]);
    setPhoneInput('');
    setPinInput('');
    localStorage.removeItem('cb_active_rider');
  };

  // Status transition: CONFIRMED -> OUT_FOR_DELIVERY -> DELIVERED
  const handleUpdateStatus = async (orderId, nextStatus) => {
    if (!rider || !orderId) return;
    setUpdatingOrderId(orderId);

    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );

    try {
      const res = await fetch('/api/rider/status-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          riderId: rider.id,
          status: nextStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        if (soundEnabledRef.current) {
          playAdminChime('delivery');
        }
        setRiderAlert({
          type: nextStatus,
          title: nextStatus === 'DELIVERED' ? 'Order Marked Delivered! ✅' : 'Out for Delivery! 🚀',
          badge: nextStatus === 'DELIVERED' ? 'Completed' : 'Dispatched',
          message: nextStatus === 'DELIVERED'
            ? `Order #${orderId.slice(-8)} successfully delivered!`
            : `Order #${orderId.slice(-8)} is out for delivery to Gate 3.`
        });
        fetchRiderOrders(true);
      } else {
        alert(data.error || 'Failed to update order status.');
        fetchRiderOrders(false);
      }
    } catch (err) {
      console.warn('Status update error:', err);
      fetchRiderOrders(false);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Helper: safe items extraction
  const extractItems = (order) => {
    const raw = order.items || order.order_items || [];
    let list = [];
    if (typeof raw === 'string') {
      try { list = JSON.parse(raw); } catch { list = []; }
    } else if (Array.isArray(raw)) {
      list = raw;
    } else if (typeof raw === 'object' && raw !== null) {
      list = Object.values(raw);
    }
    return list;
  };

  // Filter Active vs Completed
  const activeOrders = orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  const completedOrders = orders.filter((o) => o.status === 'DELIVERED' || o.status === 'CANCELLED');
  const displayedOrders = activeTab === 'active' ? activeOrders : completedOrders;

  // ----------------------------------------------------
  // 1. RIDER LOGIN SCREEN (Clean, Private, Enterprise Grade)
  // ----------------------------------------------------
  if (!rider) {
    return (
      <div className="min-h-screen bg-[#080E1A] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-white">
        
        {/* Fleet Brand Header */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="relative inline-block mb-3">
            <div className="w-18 h-18 rounded-3xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan-500/25 border border-cyan-400/40">
              <Bike size={36} className="text-slate-950 stroke-[2.2]" />
            </div>
            {/* Live fleet status pulse */}
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-[#080E1A]"></span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black font-['Outfit'] tracking-tight text-white">
            CampusBites Fleet
          </h1>
          <p className="mt-1 text-xs text-slate-400 font-medium">
            Delivery Partner Dispatch & Route Console (SRM-AP)
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-8 rounded-3xl shadow-2xl border border-slate-800 space-y-5">
            
            {/* Active shift banner */}
            <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-semibold text-[11px]">Campus Delivery Dispatch Active</span>
              </div>
              <span className="text-[10px] text-cyan-400/80 font-mono">Gate 3 Hub</span>
            </div>

            {loginError && (
              <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-semibold flex items-start gap-2.5 animate-shake">
                <AlertCircle size={16} className="shrink-0 text-rose-400 mt-0.5" />
                <span className="leading-relaxed">{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4.5">
              {/* Registered Mobile Number */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Phone size={13} className="text-cyan-400" />
                  <span>Rider Mobile Number</span>
                </label>
                <div className="flex rounded-2xl bg-slate-950 border border-slate-700/80 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all overflow-hidden">
                  <div className="px-3.5 py-3 bg-slate-800/60 border-r border-slate-700/60 text-xs font-bold text-slate-300 flex items-center gap-1.5 select-none shrink-0">
                    <span className="text-sm">🇮🇳</span>
                    <span className="font-mono text-cyan-400">+91</span>
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="Enter 10-digit mobile"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-3 bg-transparent text-sm font-mono text-white placeholder-slate-500 focus:outline-none tracking-wide"
                  />
                </div>
              </div>

              {/* 4-Digit Security PIN */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock size={13} className="text-cyan-400" />
                    <span>4-Digit Security PIN</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Assigned by Dispatch</span>
                </div>
                <div className="relative rounded-2xl bg-slate-950 border border-slate-700/80 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all overflow-hidden flex items-center">
                  <input
                    type={showPin ? "text" : "password"}
                    maxLength={4}
                    required
                    placeholder="••••"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-3 bg-transparent text-sm font-mono tracking-widest text-white placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="px-3.5 text-slate-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
                    title={showPin ? "Hide PIN" : "Show PIN"}
                  >
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-xl shadow-cyan-500/25 transition-all cursor-pointer border-none flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] mt-2"
              >
                {isLoggingIn ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                    <span>Verifying Partner Credentials...</span>
                  </div>
                ) : (
                  <>
                    <Bike size={16} className="stroke-[2.5]" />
                    <span>Sign In & Start Shift</span>
                    <ArrowRight size={14} className="stroke-[3]" />
                  </>
                )}
              </button>
            </form>

            {/* Privacy & Security Footer */}
            <div className="pt-3 border-t border-slate-800/80 text-center space-y-2">
              <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
                <ShieldCheck size={12} className="text-emerald-400" />
                <span>Protected by SRM-AP Fleet Dispatch Security</span>
              </p>

              {/* Discreet testing helper button for local dev */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowDemoHelp(!showDemoHelp)}
                  className="text-[10px] text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer border-none bg-transparent underline"
                >
                  {showDemoHelp ? 'Hide Test Rider Accounts' : 'Need Test Account Credentials?'}
                </button>

                {showDemoHelp && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-left text-[11px] space-y-1.5 animate-fade-in">
                    <div className="text-slate-400 text-[10px] font-bold uppercase">Click to fill a test rider:</div>
                    <div className="grid grid-cols-1 gap-1">
                      <button
                        type="button"
                        onClick={() => { setPhoneInput('8240756887'); setPinInput('1234'); }}
                        className="text-left hover:bg-slate-800/60 p-1.5 rounded-lg border border-slate-800/80 cursor-pointer flex justify-between items-center text-slate-300"
                      >
                        <span>🛵 Leela Lenka (CLG Bites)</span>
                        <span className="font-mono text-cyan-400 text-[10px]">8240756887</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setPhoneInput('9989955833'); setPinInput('1234'); }}
                        className="text-left hover:bg-slate-800/60 p-1.5 rounded-lg border border-slate-800/80 cursor-pointer flex justify-between items-center text-slate-300"
                      >
                        <span>🛵 Ramesh Kumar (Local Kitchen)</span>
                        <span className="font-mono text-cyan-400 text-[10px]">9989955833</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 2. RIDER DASHBOARD & ASSIGNED ORDERS VIEW
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-[#080E1A] text-slate-100 pb-24 font-sans">
      
      {/* Top Rider Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center text-xl shrink-0">
              🛵
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base text-white font-['Outfit']">
                  {rider.name}
                </h2>
                <span className="px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase border border-cyan-500/30">
                  Rider
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span>📱 {rider.phone}</span>
                <span>•</span>
                <span className="text-amber-400 font-bold capitalize">
                  {rider.restaurant_id === 'clg-bites-biryani-nation' ? 'CLG Bites' : 'Local Home Kitchen'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Audio Alert Chime Toggle for Rider */}
            <button
              onClick={() => {
                if (soundEnabled) {
                  playAdminChime('test');
                } else {
                  setSoundEnabled(true);
                  playAdminChime('test');
                }
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                soundEnabled
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
              title="Click to Test or Toggle Sound Chime"
            >
              {soundEnabled ? <Volume2 size={15} className="text-cyan-400 animate-pulse" /> : <VolumeX size={15} />}
              <span className="hidden sm:inline">{soundEnabled ? 'Sound: ON' : 'Muted'}</span>
            </button>

            <button
              onClick={() => fetchRiderOrders(false)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              title="Refresh assigned orders"
            >
              <RefreshCw size={15} className={loadingOrders ? 'animate-spin text-cyan-400' : ''} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
              title="Logout rider session"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Floating Alert Banner for Rider Notifications */}
      {riderAlert && (
        <div className="fixed top-16 right-4 sm:right-8 z-50 max-w-sm w-full animate-slide-down">
          <div className={`p-4 rounded-2xl bg-slate-900 border-2 shadow-2xl text-white flex flex-col gap-2 relative overflow-hidden ${
            riderAlert.type === 'DELIVERED'
              ? 'border-emerald-500 shadow-emerald-500/30'
              : riderAlert.type === 'OUT_FOR_DELIVERY'
              ? 'border-blue-500 shadow-blue-500/30'
              : 'border-cyan-500 shadow-cyan-500/30'
          }`}>
            <div className={`absolute top-0 left-0 right-0 h-1 animate-pulse ${
              riderAlert.type === 'DELIVERED'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                : riderAlert.type === 'OUT_FOR_DELIVERY'
                ? 'bg-gradient-to-r from-blue-400 to-indigo-500'
                : 'bg-gradient-to-r from-cyan-400 to-blue-500'
            }`} />
            
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl border ${
                  riderAlert.type === 'DELIVERED'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : riderAlert.type === 'OUT_FOR_DELIVERY'
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                    : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                }`}>
                  {riderAlert.type === 'DELIVERED' ? (
                    <CheckCircle2 size={20} className="text-emerald-400" />
                  ) : riderAlert.type === 'OUT_FOR_DELIVERY' ? (
                    <Navigation size={20} className="text-blue-400 animate-pulse" />
                  ) : (
                    <Package size={20} className="text-cyan-400 animate-bounce" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      riderAlert.type === 'DELIVERED'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : riderAlert.type === 'OUT_FOR_DELIVERY'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                    }`}>
                      {riderAlert.badge || 'Delivery Update'}
                    </span>
                    {riderAlert.order && (
                      <span className="font-mono text-xs font-bold text-amber-400">
                        #{riderAlert.order.id.slice(-8)}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-black text-white font-['Outfit'] mt-1">
                    {riderAlert.title}
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {riderAlert.message}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setRiderAlert(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Rider Content Area */}
      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        
        {/* Rider Status Metric Banner */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Deliveries</div>
              <div className="text-2xl font-black text-cyan-400 font-['Outfit'] mt-0.5">{activeOrders.length}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-lg">
              📦
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completed Orders</div>
              <div className="text-2xl font-black text-emerald-400 font-['Outfit'] mt-0.5">
                {(rider.total_deliveries || 0) + completedOrders.length}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-lg">
              ✅
            </div>
          </div>
        </div>

        {/* Tab Switcher: Active vs Completed */}
        <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer border-none text-center flex items-center justify-center gap-1.5 ${
              activeTab === 'active'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white bg-transparent'
            }`}
          >
            <span>Assigned Deliveries</span>
            {activeOrders.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-cyan-300 text-[10px]">
                {activeOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer border-none text-center flex items-center justify-center gap-1.5 ${
              activeTab === 'completed'
                ? 'bg-slate-800 text-white font-black shadow-md'
                : 'text-slate-400 hover:text-white bg-transparent'
            }`}
          >
            <span>Delivered History</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-300 text-[10px]">
              {completedOrders.length}
            </span>
          </button>
        </div>

        {/* Orders List */}
        {displayedOrders.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 text-center space-y-3 my-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-3xl mx-auto">
              {activeTab === 'active' ? '🛵' : '🎉'}
            </div>
            <h3 className="font-extrabold text-white text-base font-['Outfit']">
              {activeTab === 'active' ? 'No Assigned Deliveries Right Now' : 'No Completed Orders Yet'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {activeTab === 'active'
                ? 'When your restaurant admin assigns an order to you, it will instantly pop up here in real-time.'
                : 'Delivered food parcels will appear in this history list.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedOrders.map((order) => {
              const items = extractItems(order);
              const isUpdating = updatingOrderId === order.id;

              return (
                <div
                  key={order.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-xl hover:border-slate-700 transition-all"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-amber-400">
                          #{order.id.slice(-8).toUpperCase()}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          order.status === 'OUT_FOR_DELIVERY'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse'
                            : order.status === 'DELIVERED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {order.status === 'OUT_FOR_DELIVERY' ? 'Out For Delivery' : order.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock size={12} className="text-slate-500" />
                        <span>{new Date(order.created_at || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        <span>•</span>
                        <span className="text-cyan-400 font-bold">{order.restaurant_name || 'Campus Kitchen'}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-400">Total</div>
                      <div className="text-base font-black text-emerald-400 font-['Outfit']">
                        ₹{order.total_amount}
                      </div>
                    </div>
                  </div>

                  {/* Student Contact & Delivery Destination */}
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500">Student Recipient</div>
                        <div className="font-extrabold text-white text-xs sm:text-sm">
                          {order.student_name || 'Student'}
                        </div>
                      </div>

                      {order.student_phone && (
                        <a
                          href={`tel:${order.student_phone}`}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer no-underline"
                        >
                          <Phone size={13} />
                          <span>Call Student</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-300 pt-1 border-t border-slate-900">
                      <MapPin size={14} className="text-rose-400 shrink-0" />
                      <span>Drop Location: <strong className="text-white">SRM University AP - Gate 3</strong></span>
                    </div>
                  </div>

                  {/* Food Items Ordered */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Package size={12} className="text-amber-400" />
                      <span>Items to Deliver ({items.length})</span>
                    </div>
                    <div className="space-y-1 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                      {items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs text-slate-300">
                          <span className="truncate pr-2 font-medium">
                            <strong className="text-cyan-400 font-bold mr-1.5">{item.quantity || 1}x</strong>
                            {item.name || item.title || `Item ${idx + 1}`}
                          </span>
                          <span className="font-mono text-slate-400 shrink-0">
                            ₹{(item.price || 0) * (item.quantity || 1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rider Action Buttons */}
                  <div className="pt-2">
                    {order.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'OUT_FOR_DELIVERY')}
                        disabled={isUpdating}
                        className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all cursor-pointer border-none flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                      >
                        <Navigation size={16} />
                        <span>{isUpdating ? 'Updating...' : '🚀 START DELIVERY (OUT FOR DELIVERY)'}</span>
                      </button>
                    )}

                    {order.status === 'OUT_FOR_DELIVERY' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                        disabled={isUpdating}
                        className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/30 transition-all cursor-pointer border-none flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                      >
                        <CheckCircle2 size={18} />
                        <span>{isUpdating ? 'Confirming...' : '✅ MARK AS DELIVERED'}</span>
                      </button>
                    )}

                    {order.status === 'DELIVERED' && (
                      <div className="w-full py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-center font-bold text-xs flex items-center justify-center gap-1.5">
                        <CheckCircle2 size={16} />
                        <span>Parcel Successfully Handed Over to Student</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}
