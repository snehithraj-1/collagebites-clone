import React, { createContext, useContext, useState, useEffect } from 'react';
import { useStudentAuth } from './StudentAuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { profile } = useStudentAuth();

  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('cb_student_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeRestaurantId, setActiveRestaurantId] = useState(() => {
    try {
      return localStorage.getItem('cb_cart_restaurant_id') || null;
    } catch {
      return null;
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Delivery drop details (Locked default for SRM University - Gate 3)
  const [deliveryDetails, setDeliveryDetails] = useState(() => {
    const defaultData = {
      deliveryLocation: 'SRM University - Gate 3',
      phone: '',
      instructions: ''
    };
    try {
      let initialPhone = '';
      const savedProfile = localStorage.getItem('cb_student_profile');
      if (savedProfile) {
        try {
          initialPhone = JSON.parse(savedProfile)?.phone || '';
        } catch {}
      }

      const saved = localStorage.getItem('cb_delivery_details');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultData,
          phone: initialPhone || parsed.phone || '',
          instructions: parsed.instructions || '',
          deliveryLocation: 'SRM University - Gate 3'
        };
      }
      return { ...defaultData, phone: initialPhone };
    } catch {
      return defaultData;
    }
  });

  // Always keep deliveryDetails.phone synchronized with logged-in student's phone
  useEffect(() => {
    if (profile?.phone) {
      setDeliveryDetails((prev) => {
        if (prev.phone !== profile.phone) {
          return { ...prev, phone: profile.phone };
        }
        return prev;
      });
    }
  }, [profile?.phone]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cb_student_cart', JSON.stringify(items));
      if (activeRestaurantId) {
        localStorage.setItem('cb_cart_restaurant_id', activeRestaurantId);
      } else {
        localStorage.removeItem('cb_cart_restaurant_id');
      }
    } catch (e) {
      console.error(e);
    }
  }, [items, activeRestaurantId]);

  useEffect(() => {
    try {
      localStorage.setItem('cb_delivery_details', JSON.stringify(deliveryDetails));
    } catch (e) {
      console.error(e);
    }
  }, [deliveryDetails]);

  // Add Item to Cart
  const addToCart = (item, restaurantId) => {
    // If cart has items from a different restaurant, reset or confirm
    if (activeRestaurantId && activeRestaurantId !== restaurantId && items.length > 0) {
      const confirmReset = window.confirm(
        'Your cart already contains items from another kitchen. Would you like to clear your cart and start fresh from this kitchen?'
      );
      if (!confirmReset) return false;
      setItems([{ ...item, quantity: 1, restaurant_id: restaurantId }]);
      setActiveRestaurantId(restaurantId);
      return true;
    }

    setActiveRestaurantId(restaurantId);
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1, restaurant_id: restaurantId }];
    });
    return true;
  };

  // Update Quantity
  const updateQuantity = (itemId, delta) => {
    setItems((prev) => {
      return prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  // Remove Item
  const removeFromCart = (itemId) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  // Clear Cart
  const clearCart = () => {
    setItems([]);
    setActiveRestaurantId(null);
  };

  // Price calculations
  const subtotal = items.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
  const platformFee = items.length > 0 ? 5 : 0;
  const deliveryFee = 0; // FREE campus delivery
  const totalAmount = subtotal + platformFee + deliveryFee;
  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        activeRestaurantId,
        isCartOpen,
        setIsCartOpen,
        addToCart,
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
