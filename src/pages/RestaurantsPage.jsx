import React, { useState, useEffect } from 'react';
import { Store, Clock, Phone, MapPin, ArrowRight, AlertCircle, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DEFAULT_RESTAURANTS } from '../lib/campusSeedData';
import { useStudentAuth } from '../context/StudentAuthContext';

export default function RestaurantsPage({ onSelectRestaurant, orderingEnabled }) {
  const { profile } = useStudentAuth();
  const [restaurants, setRestaurants] = useState(DEFAULT_RESTAURANTS);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch restaurants from Neon PostgreSQL backend API
  const loadRestaurants = async () => {
    try {
      const res = await fetch('/api/restaurants');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.restaurants) && json.restaurants.length > 0) {
          setRestaurants(json.restaurants);
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {}

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;
        if (data && data.length > 0) {
          setRestaurants(data);
        }
      } catch (err) {
        console.warn('[Supabase Restaurants Fetch]:', err.message);
      }
    } else {
      try {
        const localSettings = JSON.parse(localStorage.getItem('cb_shared_restaurants') || 'null');
        if (localSettings && Array.isArray(localSettings)) {
          setRestaurants(localSettings);
        } else {
          setRestaurants(DEFAULT_RESTAURANTS);
        }
      } catch {
        setRestaurants(DEFAULT_RESTAURANTS);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadRestaurants();

    // High frequency 2.5s poll to sync Admin kitchen open/closed toggles
    const interval = setInterval(loadRestaurants, 2500);

    // Supabase Realtime Subscription for instant status updates if configured
    if (isSupabaseConfigured() && supabase) {
      const channel = supabase
        .channel('public:restaurants')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, (payload) => {
          loadRestaurants();
        })
        .subscribe();

      return () => {
        clearInterval(interval);
        supabase.removeChannel(channel);
      };
    }

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Student Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-orange-500 via-[#FF5722] to-amber-500 text-white shadow-xl shadow-[#FF5722]/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-white/90 text-xs font-extrabold uppercase tracking-wider mb-2">
            <Sparkles size={14} className="text-amber-200" />
            <span>Welcome back, {profile?.name || 'Student'}!</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-['Outfit']">
            Hungry on Campus?
          </h2>
          <p className="text-white/85 text-xs sm:text-sm mt-1 max-w-xl">
            Order fresh meals from Neerukonda Village kitchens delivered directly to your SRM-AP hostel doorstep with 0 delivery fee.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-black/15 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/20 self-start md:self-auto">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <div className="text-xs">
            <div className="text-white font-black">2 Campus Partners</div>
            <div className="text-white/70">Live Supabase Sync</div>
          </div>
        </div>
      </div>

      {/* Restaurant Section Title */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-[#0F172A] font-['Outfit']">
            Available Campus Kitchens
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Select a restaurant to browse menus, add items, and place an order
          </p>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-full border border-[#E2D9D0]">
          2 Authentic Kitchens
        </span>
      </div>

      {/* Two Restaurant Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          [1, 2].map((n) => (
            <div key={n} className="card-elevated overflow-hidden border border-[#F1EAE4] bg-white animate-fade-in">
              <div className="h-48 sm:h-56 w-full skeleton-shimmer" />
              <div className="p-6 space-y-4">
                <div className="w-3/4 h-5 skeleton-shimmer" />
                <div className="w-full h-10 skeleton-shimmer" />
                <div className="w-full h-12 skeleton-shimmer rounded-2xl" />
              </div>
            </div>
          ))
        ) : (
          restaurants.map((restaurant) => {
          // When overall campus ordering is closed/paused, all restaurants are strictly CLOSED!
          const isOpen = Boolean(orderingEnabled) && restaurant.is_open !== false;

          return (
            <div
              key={restaurant.id}
              className={`card-elevated overflow-hidden flex flex-col justify-between transition-all ${
                !isOpen ? 'opacity-75 grayscale-[40%]' : ''
              }`}
            >
              {/* Image Banner */}
              <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-slate-100">
                <img
                  src={restaurant.image_url || 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=1200&q=80'}
                  alt={restaurant.name}
                  className={`w-full h-full object-cover transition-transform duration-500 hover:scale-105 ${
                    !isOpen ? 'grayscale' : ''
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Status Badges */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-white/95 text-[#0F172A] shadow-md backdrop-blur-md">
                    {restaurant.cuisine || 'Fast Food & Biryani'}
                  </span>

                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md ${
                    isOpen
                      ? 'bg-emerald-500 text-white'
                      : 'bg-rose-500 text-white'
                  }`}>
                    {isOpen ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    <span>{isOpen ? 'OPEN' : 'CLOSED'}</span>
                  </span>
                </div>

                {/* Restaurant Name in Image */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h4 className="text-xl sm:text-2xl font-black font-['Outfit'] drop-shadow-md">
                    {restaurant.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-white/90 mt-0.5">
                    <MapPin size={13} className="text-[#FF5722]" />
                    <span>{restaurant.location || 'Neerukonda Village'}</span>
                  </div>
                </div>
              </div>

              {/* Card Details */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs sm:text-sm text-[#64748B] line-clamp-2">
                  {restaurant.description}
                </p>

                {/* Notice if restaurant closed or overall ordering paused */}
                {!isOpen && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    <span>Currently Unavailable</span>
                  </div>
                )}

                {/* Action button */}
                <div className="pt-2">
                  <button
                    onClick={() => isOpen && onSelectRestaurant(restaurant)}
                    disabled={!isOpen}
                    className={`w-full py-3.5 px-5 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all border-none shadow-md ${
                      isOpen
                        ? 'btn-primary cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    }`}
                  >
                    <span>{isOpen ? 'Browse Food Menu' : 'Currently Unavailable'}</span>
                    {isOpen && <ArrowRight size={16} />}
                  </button>
                </div>
              </div>
            </div>
          );
        }))}
      </div>

    </div>
  );
}
