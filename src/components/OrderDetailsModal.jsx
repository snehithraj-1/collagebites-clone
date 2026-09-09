import React, { useState } from 'react';
import { 
  X, User, MapPin, Phone, Mail, Clock, ShieldCheck, Ban, Trash2, 
  CheckCircle2, Bike, ChevronDown, Check, Printer, Building, FileText
} from 'lucide-react';

// Safe date/time formatter that never throws Invalid Option or Invalid Date
function formatDateTime(rawDate) {
  if (!rawDate) return 'Just now';
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return 'Just now';
    return d.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return 'Just now';
  }
}

// Safely normalize items from any schema (Neon DB, Supabase, local cache)
function extractItems(order) {
  if (!order) return [];
  const raw = order.order_items || order.items || [];
  let list = [];
  if (typeof raw === 'string') {
    try {
      list = JSON.parse(raw);
    } catch {
      list = [];
    }
  } else if (Array.isArray(raw)) {
    list = raw;
  } else if (typeof raw === 'object' && raw !== null) {
    list = Object.values(raw);
  }

  return list.map((item, idx) => {
    const name = item.name || item.item_name || item.title || `Item ${idx + 1}`;
    const price = Number(item.price ?? item.unit_price ?? 0);
    const quantity = Number(item.quantity ?? item.qty ?? 1);
    const total = Number(item.total_price ?? (price * quantity));
    return {
      id: item.id || idx,
      name,
      price,
      quantity,
      total
    };
  });
}

export default function OrderDetailsModal({
  order,
  deliveryPartners = [],
  onAssignPartner,
  onUnassignPartner,
  onOpenDeliveryPartners,
  onClose,
  onUpdateStatus,
  onCancelOrder,
  onDeleteOrder
}) {
  const [showPartnerDropdown, setShowPartnerDropdown] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  if (!order) return null;

  const items = extractItems(order);
  const formattedDate = formatDateTime(order.created_at);

  const isCancelled = order.status === 'CANCELLED';
  const isDelivered = order.status === 'DELIVERED';
  const isOutForDelivery = order.status === 'OUT_FOR_DELIVERY';

  const handlePartnerSelect = async (partner) => {
    if (!onAssignPartner) return;
    setIsAssigning(true);
    try {
      await onAssignPartner(order.id, partner);
      setShowPartnerDropdown(false);
    } finally {
      setIsAssigning(false);
    }
  };

  const handlePartnerUnassign = async () => {
    if (!onUnassignPartner) return;
    setIsAssigning(true);
    try {
      await onUnassignPartner(order.id);
      setShowPartnerDropdown(false);
    } finally {
      setIsAssigning(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fade-in print:bg-white print:p-0">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:border-none print:bg-white print:text-black print:max-h-full print:shadow-none">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 print:border-b-2 print:border-black print:bg-white">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono font-black text-base sm:text-lg text-[#FF5722] print:text-black">
                #{order.id}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${
                isCancelled
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : isDelivered
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : isOutForDelivery
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              } print:border-black print:text-black`}>
                {order.status || 'CONFIRMED'}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 print:text-slate-600">
              <Clock size={13} className="shrink-0" />
              <span>{formattedDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border-none"
              title="Print Order Receipt"
            >
              <Printer size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border-none"
              title="Close Modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Restaurant & Delivery Location Banner */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 print:border-slate-300 print:bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building size={15} className="text-[#FF5722]" />
                <span className="font-bold text-sm text-white print:text-black">
                  {order.restaurant_name || 'Campus Kitchen'}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                SRM Campus
              </span>
            </div>

            <div className="flex items-start gap-2 text-slate-300 pt-1.5 border-t border-slate-800/80 print:border-slate-200 print:text-slate-800">
              <MapPin size={15} className="text-[#FF5722] shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">{order.delivery_location || 'SRM University - Gate 3'}</span>
                {(order.hostel_block || order.room_number) && (
                  <span className="text-slate-400 ml-1">
                    ({[order.hostel_block, order.room_number].filter(Boolean).join(' - ')})
                  </span>
                )}
              </div>
            </div>

            {order.instructions && (
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-start gap-1.5">
                <FileText size={13} className="shrink-0 mt-0.5" />
                <span>Special Instructions: <strong>"{order.instructions}"</strong></span>
              </div>
            )}
          </div>

          {/* Student Contact Details */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5 print:border-slate-300 print:bg-slate-50">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider print:text-slate-600">
              Student Details
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                  <User size={14} />
                </div>
                <div>
                  <div className="font-bold text-white text-xs sm:text-sm print:text-black truncate">
                    {order.student_name || 'Student'}
                  </div>
                  {order.student_id && (
                    <div className="text-[10px] font-mono text-slate-400">
                      ID: {order.student_id}
                    </div>
                  )}
                </div>
              </div>

              {order.student_phone && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#FF5722]/20 text-[#FF5722] flex items-center justify-center shrink-0">
                    <Phone size={14} />
                  </div>
                  <div>
                    <a
                      href={`tel:${order.student_phone}`}
                      className="font-mono font-bold text-white hover:text-[#FF5722] hover:underline text-xs sm:text-sm print:text-black"
                    >
                      {order.student_phone}
                    </a>
                    <div className="text-[10px] text-slate-400">Click to call student</div>
                  </div>
                </div>
              )}
            </div>

            {order.student_email && (
              <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px] pt-1.5 border-t border-slate-800/80 truncate print:border-slate-200">
                <Mail size={13} className="shrink-0" />
                <a href={`mailto:${order.student_email}`} className="hover:underline truncate text-slate-300 print:text-black">
                  {order.student_email}
                </a>
              </div>
            )}
          </div>

          {/* Delivery Partner Section (with 1-Click Assignment) */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5 print:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <Bike size={13} className="text-[#FF5722]" />
                <span>Delivery Partner</span>
              </div>
              {onOpenDeliveryPartners && (
                <button
                  onClick={onOpenDeliveryPartners}
                  className="text-[10px] font-bold text-[#FF5722] hover:underline cursor-pointer border-none bg-transparent"
                >
                  Manage Partners ➔
                </button>
              )}
            </div>

            {order.delivery_partner_name ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-700">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                    <Bike size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs sm:text-sm">
                      {order.delivery_partner_name}
                    </div>
                    {order.delivery_partner_phone && (
                      <a
                        href={`tel:${order.delivery_partner_phone}`}
                        className="text-[11px] font-mono text-cyan-300 hover:underline flex items-center gap-1"
                      >
                        <Phone size={10} />
                        <span>{order.delivery_partner_phone}</span>
                      </a>
                    )}
                  </div>
                </div>

                <button
                  onClick={handlePartnerUnassign}
                  disabled={isAssigning}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 text-[11px] font-bold transition-colors cursor-pointer border border-slate-700"
                >
                  Unassign
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs italic">No delivery partner assigned yet</span>
                  <button
                    onClick={() => setShowPartnerDropdown(!showPartnerDropdown)}
                    className="px-3 py-1.5 rounded-xl bg-[#FF5722]/20 hover:bg-[#FF5722]/30 text-[#FF5722] border border-[#FF5722]/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>Assign Partner</span>
                    <ChevronDown size={14} />
                  </button>
                </div>

                {showPartnerDropdown && (
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-700 space-y-1.5 animate-scale-in">
                    <div className="text-[10px] text-slate-400 font-semibold px-1">
                      Select delivery partner to assign:
                    </div>
                    {deliveryPartners.length === 0 ? (
                      <div className="p-3 text-center text-slate-500 text-xs">
                        No delivery partners created yet. Add one via "Manage Partners".
                      </div>
                    ) : (
                      deliveryPartners.map((partner) => (
                        <button
                          key={partner.id}
                          onClick={() => handlePartnerSelect(partner)}
                          disabled={isAssigning}
                          className="w-full p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-left flex items-center justify-between cursor-pointer border border-slate-700/60 transition-colors"
                        >
                          <div>
                            <div className="font-bold text-white text-xs">{partner.name}</div>
                            <div className="text-[10px] font-mono text-slate-400">{partner.phone}</div>
                          </div>
                          <span className="text-[11px] font-bold text-cyan-400">Assign ➔</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ordered Dishes Itemized List */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between print:text-slate-600">
              <span>Ordered Items ({items.length})</span>
              <span>Subtotal</span>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800 text-xs print:border-slate-300 print:divide-slate-200">
              {items.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs">
                  No item breakdown available.
                </div>
              ) : (
                items.map((item, idx) => (
                  <div key={item.id || idx} className="p-2.5 sm:p-3 flex items-center justify-between bg-slate-950/50 print:bg-white">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-slate-500 text-[11px] print:text-slate-400">
                        {idx + 1}.
                      </span>
                      <div>
                        <div className="font-bold text-white text-xs sm:text-sm print:text-black">
                          {item.name}
                        </div>
                        <div className="text-slate-400 text-[11px] font-mono print:text-slate-600">
                          ₹{item.price} × {item.quantity}
                        </div>
                      </div>
                    </div>
                    <div className="font-mono font-black text-white text-xs sm:text-sm print:text-black">
                      ₹{item.total || (item.price * item.quantity)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Total Amount & Payment Summary */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center print:border-black print:bg-slate-50">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold print:text-slate-600">
                Total Bill Amount
              </div>
              <div className="text-xs text-slate-400 print:text-slate-700">
                Payment Mode: <strong className="text-white print:text-black">{order.payment_method ? order.payment_method.toUpperCase() : 'CASH ON DELIVERY (COD)'}</strong>
              </div>
            </div>
            <div className="font-mono font-black text-xl sm:text-2xl text-emerald-400 print:text-black">
              ₹{order.total_amount}
            </div>
          </div>

          {/* Quick Status Override Buttons */}
          {onUpdateStatus && (
            <div className="space-y-1.5 pt-1 print:hidden">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Update Order Status
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onUpdateStatus(order.id, 'CONFIRMED')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    order.status === 'CONFIRMED'
                      ? 'bg-amber-500/30 text-amber-300 border-amber-500 shadow-xs'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 border-slate-700'
                  }`}
                >
                  CONFIRMED
                </button>
                <button
                  onClick={() => onUpdateStatus(order.id, 'OUT_FOR_DELIVERY')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    order.status === 'OUT_FOR_DELIVERY'
                      ? 'bg-blue-500/30 text-blue-300 border-blue-500 shadow-xs'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 border-slate-700'
                  }`}
                >
                  OUT FOR DELIVERY
                </button>
                <button
                  onClick={() => onUpdateStatus(order.id, 'DELIVERED')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    order.status === 'DELIVERED'
                      ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500 shadow-xs'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 border-slate-700'
                  }`}
                >
                  DELIVERED
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-2">
            {!isCancelled && onCancelOrder && (
              <button
                onClick={() => {
                  onCancelOrder(order.id);
                  onClose();
                }}
                className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Ban size={14} />
                <span>Cancel Order</span>
              </button>
            )}

            {onDeleteOrder && (
              <button
                onClick={() => {
                  onDeleteOrder(order);
                  onClose();
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 cursor-pointer transition-colors"
                title="Permanently Delete Order"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer border-none transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
