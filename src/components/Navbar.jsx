import React from 'react';
import { ShoppingBag, Clock, User, LogOut, Sparkles, MapPin, Volume2 } from 'lucide-react';
import { useStudentAuth } from '../context/StudentAuthContext';
import { useCart } from '../context/CartContext';
import { playStudentChime, unlockStudentAudio } from '../lib/notificationSound';

export default function Navbar({ currentView, onNavigate }) {
  const { profile, logout } = useStudentAuth();
  const { totalItemsCount, totalAmount, setIsCartOpen } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#F1EAE4] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        
        {/* Brand & Campus Identity */}
        <div 
          onClick={() => onNavigate('restaurants')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-[#FF5722] to-[#FF8A65] flex items-center justify-center text-white text-xl shadow-md shadow-[#FF5722]/20 group-hover:scale-105 transition-transform">
            🍔
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg sm:text-xl font-black text-[#0F172A] tracking-tight font-['Outfit']">
                CampusBites
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#FFF0EB] text-[#FF5722] text-[10px] font-extrabold uppercase tracking-wider">
                Student
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#64748B]">
              <MapPin size={11} className="text-[#FF5722]" />
              <span>SRM-AP Campus Hostel Delivery</span>
            </div>
          </div>
        </div>

        {/* Center Desktop Navigation Links (Visible on Desktop, Hidden on Mobile where BottomNav is used) */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
          {/* Home */}
          <button
            onClick={() => onNavigate('restaurants')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border-none ${
              currentView === 'restaurants' || currentView === 'menu'
                ? 'bg-[#FFF0EB] text-[#FF5722] shadow-xs'
                : 'bg-transparent text-[#64748B] hover:text-[#0F172A] hover:bg-[#FAF8F5]'
            }`}
          >
            <span>🏠 Kitchens</span>
          </button>

          {/* My Orders */}
          <button
            onClick={() => onNavigate('history')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border-none ${
              currentView === 'history' || currentView === 'success'
                ? 'bg-[#FFF0EB] text-[#FF5722] shadow-xs'
                : 'bg-transparent text-[#64748B] hover:text-[#0F172A] hover:bg-[#FAF8F5]'
            }`}
          >
            <Clock size={14} />
            <span>My Orders</span>
          </button>

          {/* Food Cart */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border-none bg-transparent text-[#64748B] hover:text-[#0F172A] hover:bg-[#FAF8F5] relative"
          >
            <ShoppingBag size={14} />
            <span>Cart</span>
            {totalItemsCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF5722] text-white text-[10px] font-black flex items-center justify-center shadow-sm shadow-[#FF5722]/40 animate-pulse">
                {totalItemsCount}
              </span>
            )}
          </button>

          {/* Profile */}
          <button
            onClick={() => onNavigate('profile')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border-none ${
              currentView === 'profile'
                ? 'bg-[#FFF0EB] text-[#FF5722] shadow-xs'
                : 'bg-transparent text-[#64748B] hover:text-[#0F172A] hover:bg-[#FAF8F5]'
            }`}
          >
            <User size={14} />
            <span>Profile</span>
          </button>
        </nav>

        {/* Right Actions: Sound Test & Student Profile & Sign Out */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Sound Chime Test / Unmute Button for Student */}
          <button
            onClick={() => {
              unlockStudentAudio();
              playStudentChime('test');
            }}
            className="px-2.5 py-1.5 rounded-xl border border-[#E2D9D0] bg-[#FAF8F5] hover:bg-[#FFF0EB] text-[#FF5722] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Click to Test Student Order Alert Chime"
          >
            <Volume2 size={14} className="text-[#FF5722] animate-pulse" />
            <span className="hidden sm:inline">Sound: ON (Test)</span>
          </button>

          {/* Student Profile & Sign Out */}
          {profile && (
            <div className="flex items-center gap-2 pl-2 border-l border-[#F1EAE4]">
              <button
                onClick={() => onNavigate('profile')}
                className="flex items-center gap-2 text-right bg-transparent border-none p-0 cursor-pointer group"
                title="View & Edit Profile"
              >
                <div className="hidden lg:block text-right">
                  <div className="text-xs font-extrabold text-[#0F172A] group-hover:text-[#FF5722] transition-colors leading-tight">
                    {profile.name}
                  </div>
                  <div className="text-[10px] text-[#64748B] font-mono">
                    {profile.phone ? `+91 ${profile.phone}` : profile.email}
                  </div>
                </div>

                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FFF0EB] to-[#FFE5DC] text-[#FF5722] font-black text-xs flex items-center justify-center border border-[#FFD3C4] shadow-xs group-hover:scale-105 transition-transform">
                  {profile.name ? profile.name.slice(0, 2).toUpperCase() : 'ST'}
                </div>
              </button>

              <button
                onClick={logout}
                title="Sign Out"
                className="w-9 h-9 rounded-xl bg-[#FAF8F5] hover:bg-rose-50 text-[#64748B] hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer border border-[#E2D9D0]"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}
