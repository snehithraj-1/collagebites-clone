import React, { useState, useEffect } from 'react';
import { X, Bike, Phone, User, Plus, Trash2, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function DeliveryPartnersModal({ isOpen, onClose, onPartnersChanged, assignedRestaurantId = null }) {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState(assignedRestaurantId || 'local-home-kitchen');
  const [pin, setPin] = useState('1234');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const url = assignedRestaurantId
        ? `/api/delivery-partners?restaurant_id=${encodeURIComponent(assignedRestaurantId)}`
        : '/api/delivery-partners';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPartners(data.partners || []);
      }
    } catch (err) {
      console.warn('Failed to fetch delivery partners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (assignedRestaurantId) {
        setSelectedRestaurant(assignedRestaurantId);
      }
      fetchPartners();
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, assignedRestaurantId]);

  if (!isOpen) return null;

  const handleCreatePartner = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter delivery partner name.');
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const targetRestaurantId = assignedRestaurantId || selectedRestaurant;
      const res = await fetch('/api/delivery-partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: cleanPhone,
          restaurant_id: targetRestaurantId,
          pin: pin.trim() || '1234'
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`✅ ${name} registered successfully as delivery partner for ${targetRestaurantId === 'clg-bites-biryani-nation' ? 'CLG Bites' : 'Local Home Kitchen'}! (PIN: ${pin.trim() || '1234'})`);
        setName('');
        setPhone('');
        fetchPartners();
        if (onPartnersChanged) onPartnersChanged();
      } else {
        setErrorMsg(data.error || 'Failed to create delivery partner.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Network error registering partner.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePartner = async (partnerId, partnerName) => {
    if (!window.confirm(`Are you sure you want to remove delivery partner "${partnerName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/delivery-partners/${partnerId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setPartners((prev) => prev.filter((p) => p.id !== partnerId));
        if (onPartnersChanged) onPartnersChanged();
      }
    } catch (err) {
      console.warn('Error deleting delivery partner:', err);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div onClick={onClose} className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" />

      <div className="relative bg-[#111827] border border-slate-700 w-full max-w-2xl rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 text-white text-xs animate-scale-in max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl border border-emerald-500/30">
              🛵
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black font-['Outfit'] text-white">
                  Campus Delivery Partners
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                  {partners.length} Registered
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Register couriers & riders to assign student food deliveries to SRM Gate 3
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchPartners}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer touch-manipulation"
              title="Refresh Partners"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-400' : ''} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer touch-manipulation"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto space-y-5 touch-pan-y pr-1">
          
          {/* Create New Partner Form */}
          <form onSubmit={handleCreatePartner} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Plus size={13} className="text-emerald-400" />
              <span>Register New Delivery Partner</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">
                  Partner Full Name
                </label>
                <div className="relative">
                  <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Enter partner name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">
                  Mobile Phone Number
                </label>
                <div className="relative">
                  <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="tel"
                    required
                    placeholder="Enter 10-digit mobile"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">
                  Associated Restaurant
                </label>
                {assignedRestaurantId ? (
                  <div className="px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                    <ShieldCheck size={14} />
                    <span>{assignedRestaurantId === 'clg-bites-biryani-nation' ? 'CLG Bites' : 'Local Home Kitchen'} (Locked)</span>
                  </div>
                ) : (
                  <select
                    value={selectedRestaurant}
                    onChange={(e) => setSelectedRestaurant(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="local-home-kitchen">Local Home Kitchen</option>
                    <option value="clg-bites-biryani-nation">CLG Bites Biryani</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">
                  Rider Login PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="Default: 1234"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                ⚠️ {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                {successMsg}
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer border-none disabled:opacity-50 touch-manipulation"
              >
                <Plus size={14} />
                <span>{isSubmitting ? 'Registering...' : 'Add Delivery Partner'}</span>
              </button>
            </div>
          </form>

          {/* Registered Delivery Partners List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Active Delivery Partners ({partners.length})</span>
              <span className="text-[10px] text-emerald-400 font-mono">Ready for dispatch</span>
            </div>

            {partners.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                No delivery partners registered yet for this kitchen. Add one above.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {partners.map((partner) => (
                  <div
                    key={partner.id}
                    className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 text-lg">
                        🛵
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-white text-xs truncate">
                            {partner.name}
                          </h4>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        </div>
                        <div className="text-[10px] text-amber-400 font-semibold truncate">
                          {partner.restaurant_id === 'clg-bites-biryani-nation' ? 'CLG Bites' : 'Local Home Kitchen'}
                        </div>
                        <a
                          href={`tel:${partner.phone}`}
                          className="text-[11px] text-emerald-400 font-mono font-bold hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Phone size={10} />
                          <span>{partner.phone}</span>
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleDeletePartner(partner.id, partner.name)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800/60 transition-colors cursor-pointer"
                        title="Remove Partner"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
