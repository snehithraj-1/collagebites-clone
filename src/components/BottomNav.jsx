import React from 'react';
import { Home, ShoppingBag, Clock, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStudentAuth } from '../context/StudentAuthContext';

export default function BottomNav({ currentView, onNavigate }) {
  const { totalItemsCount, setIsCartOpen } = useCart();
  const { profile } = useStudentAuth();

  const isHomeActive = currentView === 'restaurants' || currentView === 'menu';
  const isOrdersActive = currentView === 'history' || currentView === 'success';
  const isProfileActive = currentView === 'profile';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E2D9D0] shadow-sm transition-all pb-safe">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around relative">
        
        {/* 1. Home Tab */}
        <button
          onClick={() => onNavigate('restaurants')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all cursor-pointer border-none bg-transparent group relative active:scale-95 ${
            isHomeActive ? 'text-[#FF5722]' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
          title="Browse Restaurants & Menus"
        >
          {isHomeActive && (
            <span className="absolute -top-2.5 w-8 h-1 rounded-full bg-[#FF5722] shadow-sm shadow-[#FF5722]/50 animate-scale-in" />
          )}
          <Home
            size={22}
            className={`transition-transform duration-300 ${
              isHomeActive ? 'scale-110 stroke-[2.5]' : 'group-hover:scale-105'
            }`}
          />
          <span className={`text-[11px] mt-1 font-bold ${isHomeActive ? 'font-black' : ''}`}>
            Home
          </span>
        </button>

        {/* 2. Cart Tab */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-1 transition-all cursor-pointer border-none bg-transparent group relative active:scale-95 text-[#64748B] hover:text-[#0F172A]"
          title="Open Food Cart"
        >
          <div className="relative">
            <ShoppingBag
              size={22}
              className="group-hover:scale-105 transition-transform"
            />
            {totalItemsCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF5722] text-white text-[10px] font-black flex items-center justify-center shadow-md shadow-[#FF5722]/40 animate-pulse">
                {totalItemsCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-1 font-bold">
            Cart
          </span>
        </button>

        {/* 3. My Orders Tab */}
        <button
          onClick={() => onNavigate('history')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all cursor-pointer border-none bg-transparent group relative active:scale-95 ${
            isOrdersActive ? 'text-[#FF5722]' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
          title="View Past & Live Orders"
        >
          {isOrdersActive && (
            <span className="absolute -top-2.5 w-8 h-1 rounded-full bg-[#FF5722] shadow-sm shadow-[#FF5722]/50 animate-scale-in" />
          )}
          <Clock
            size={22}
            className={`transition-transform duration-300 ${
              isOrdersActive ? 'scale-110 stroke-[2.5]' : 'group-hover:scale-105'
            }`}
          />
          <span className={`text-[11px] mt-1 font-bold ${isOrdersActive ? 'font-black' : ''}`}>
            My Orders
          </span>
        </button>

        {/* 4. Profile Tab (Swiggy style) */}
        <button
          onClick={() => onNavigate('profile')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all cursor-pointer border-none bg-transparent group relative active:scale-95 ${
            isProfileActive ? 'text-[#FF5722]' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
          title="Student Profile & Settings"
        >
          {isProfileActive && (
            <span className="absolute -top-2.5 w-8 h-1 rounded-full bg-[#FF5722] shadow-sm shadow-[#FF5722]/50 animate-scale-in" />
          )}
          <div className="relative">
            <User
              size={22}
              className={`transition-transform duration-300 ${
                isProfileActive ? 'scale-110 stroke-[2.5]' : 'group-hover:scale-105'
              }`}
            />
            {profile?.phone && (
              <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
            )}
          </div>
          <span className={`text-[11px] mt-1 font-bold ${isProfileActive ? 'font-black' : ''}`}>
            Profile
          </span>
        </button>

      </div>
    </nav>
  );
}
