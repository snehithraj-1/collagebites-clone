import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus, MapPin, Phone, MessageSquare, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStudentAuth } from '../context/StudentAuthContext';


export default function CartDrawer({ onProceedToConfirmation, orderingEnabled, isRestaurantOpen }) {
  const { profile, updateProfile } = useStudentAuth();
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    deliveryDetails,
    setDeliveryDetails,
    subtotal,
    platformFee,
    deliveryFee,
    totalAmount,
    totalItemsCount
  } = useCart();

  const [validationError, setValidationError] = useState('');

  // Keep phone number synchronized with authenticated student profile
  useEffect(() => {
    if (profile?.phone && deliveryDetails.phone !== profile.phone) {
      setDeliveryDetails((prev) => ({
        ...prev,
        phone: profile.phone
      }));
    }
  }, [profile?.phone, isCartOpen]);

  if (!isCartOpen) return null;

  const handleStartCheckout = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!orderingEnabled) {
      setValidationError('Campus ordering is currently paused by administration.');
      return;
    }

    if (!isRestaurantOpen) {
      setValidationError('This restaurant is currently closed.');
      return;
    }

    if (items.length === 0) {
      setValidationError('Your cart is empty.');
      return;
    }

    if (!deliveryDetails.phone || !deliveryDetails.phone.trim()) {
      setValidationError('Please enter your mobile phone number for delivery contact.');
      return;
    }

    // Proceed to the 30-Second Confirmation modal
    setIsCartOpen(false);
    onProceedToConfirmation();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div 
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Drawer with Spring Slide Animation */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-drawer-right">
          
          {/* Header */}
          <div className="p-5 border-b border-[#F1EAE4] flex items-center justify-between bg-[#FAF8F5]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FFF0EB] text-[#FF5722] flex items-center justify-center font-bold">
                <ShoppingBag size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#0F172A] font-['Outfit']">
                  Your Food Cart
                </h3>
                <p className="text-xs text-[#64748B]">
                  {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} selected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer border-none bg-transparent"
                  title="Clear Cart"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-9 h-9 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-white flex items-center justify-center transition-colors cursor-pointer border border-[#E2D9D0]"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Cart Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* Empty State */}
            {items.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="text-5xl">🍲</div>
                <h4 className="font-extrabold text-base text-[#0F172A]">Your cart is hungry!</h4>
                <p className="text-xs text-[#64748B] max-w-xs mx-auto">
                  Browse delicious meals from our campus kitchens and add dishes to start your order.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="btn-primary py-2.5 px-6 rounded-xl text-xs font-bold mt-2 cursor-pointer border-none"
                >
                  Browse Campus Menu
                </button>
              </div>
            ) : (
              <>
                {/* Items List */}
                <div className="space-y-3 divide-y divide-[#F1EAE4]">
                  {items.map((item) => (
                    <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${item.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <h5 className="font-bold text-xs sm:text-sm text-[#0F172A] truncate">
                            {item.name}
                          </h5>
                        </div>
                        <div className="text-xs font-mono text-[#FF5722] font-extrabold mt-0.5">
                          ₹{item.price * item.quantity}
                          <span className="text-[10px] text-slate-400 font-normal ml-1">
                            (₹{item.price} each)
                          </span>
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E2D9D0] rounded-xl p-1">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white text-[#0F172A] hover:bg-slate-100 flex items-center justify-center font-bold text-xs cursor-pointer border-none shadow-xs"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="font-mono text-xs font-bold w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-6 h-6 rounded-lg bg-[#FF5722] text-white hover:bg-[#F4511E] flex items-center justify-center font-bold text-xs cursor-pointer border-none shadow-xs"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer border-none bg-transparent"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Delivery Drop Address Form */}
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#F1EAE4] space-y-3 text-xs">
                  <div className="font-extrabold text-[#0F172A] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <MapPin size={13} className="text-[#FF5722]" />
                      <span>Campus Delivery Destination</span>
                    </div>
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                      Default & Fixed
                    </span>
                  </div>

                  {/* Fixed SRM University - Gate 3 Destination Card */}
                  <div className="p-3 bg-white border border-[#E2D9D0] rounded-xl flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#FFF0EB] text-[#FF5722] flex items-center justify-center shrink-0 mt-0.5 border border-[#FF5722]/20">
                      <MapPin size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-xs text-[#0F172A]">SRM University — Gate 3</div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">
                        Built exclusively for SRM University. All food parcels arrive directly at <strong>Gate 3</strong> for quick campus collection.
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center justify-between">
                      <span>Student Phone Number *</span>
                      {profile?.phone && (
                        <span className="text-[10px] text-emerald-600 font-bold">Synced from Profile</span>
                      )}
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Enter 10digit  mobile number"
                      value={deliveryDetails.phone ?? profile?.phone ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDeliveryDetails((prev) => ({ ...prev, phone: val }));
                        if (profile && updateProfile) {
                          updateProfile({ phone: val });
                        }
                      }}
                      className="w-full px-2.5 py-2 rounded-xl bg-white border border-[#E2D9D0] text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#FF5722]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Cooking Notes / Special Instructions
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Less spicy, extra onions"
                      value={deliveryDetails.instructions}
                      onChange={(e) => setDeliveryDetails({ ...deliveryDetails, instructions: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-xl bg-white border border-[#E2D9D0] text-xs text-[#0F172A] focus:outline-none focus:border-[#FF5722]"
                    />
                  </div>
                </div>

                {/* Pricing Summary */}
                <div className="p-4 rounded-2xl bg-white border border-[#F1EAE4] space-y-2 text-xs">
                  <div className="flex justify-between text-[#64748B]">
                    <span>Items Subtotal</span>
                    <span className="font-mono text-[#0F172A]">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-[#64748B]">
                    <span>Campus Platform Fee</span>
                    <span className="font-mono text-[#0F172A]">₹{platformFee}</span>
                  </div>
                  <div className="flex justify-between text-[#64748B]">
                    <span>Hostel Doorstep Delivery</span>
                    <span className="font-bold text-emerald-600">FREE</span>
                  </div>
                  <div className="pt-2 border-t border-[#F1EAE4] flex justify-between items-center text-sm font-black text-[#0F172A]">
                    <span>To Pay</span>
                    <span className="text-[#FF5722] font-mono text-base">₹{totalAmount}</span>
                  </div>
                </div>
              </>
            )}

            {validationError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                ⚠️ {validationError}
              </div>
            )}
          </div>

          {/* Checkout Footer */}
          {items.length > 0 && (
            <div className="p-5 border-t border-[#F1EAE4] bg-white space-y-2">
              <button
                onClick={handleStartCheckout}
                disabled={!orderingEnabled || !isRestaurantOpen}
                className="btn-primary w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Proceed to Confirmation</span>
                <ArrowRight size={16} />
              </button>
              <p className="text-[11px] text-center text-[#64748B]">
                Next: 30-Second review window to confirm or cancel
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
