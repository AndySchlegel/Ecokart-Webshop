'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../lib/config';
import { fetchAuthSession } from 'aws-amplify/auth';
import { logger } from '@/lib/logger';

// ============================================================================
// 🔧 HELPER FUNCTIONS
// ============================================================================

/**
 * Holt Cognito Authentication Token aus der aktuellen Session
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || null;
  } catch (error) {
    logger.error('Failed to get auth token', { component: 'CartContext' }, error as Error);
    return null;
  }
}

/**
 * 🇩🇪 Übersetzt Backend-Errors in user-friendly deutsche Messages
 *
 * Backend sendet englische Error-Messages → Frontend zeigt deutsche an
 */
function getGermanErrorMessage(errorMessage: string): string {
  // Check für spezifische Error-Patterns

  // Out of Stock Error
  if (errorMessage.includes('out of stock')) {
    return 'Dieses Produkt ist leider ausverkauft';
  }

  // Limited Stock Error (z.B. "Only 5 units available")
  const stockMatch = errorMessage.match(/Only (\d+) units? available/i);
  if (stockMatch) {
    const available = stockMatch[1];
    return `Nur noch ${available} ${parseInt(available) === 1 ? 'Stück' : 'Stück'} verfügbar`;
  }

  // Authorization Errors
  if (errorMessage.toLowerCase().includes('unauthorized')) {
    return 'Bitte melde dich an um Produkte in den Warenkorb zu legen';
  }

  // Product Not Found
  if (errorMessage.includes('Product not found')) {
    return 'Produkt nicht gefunden';
  }

  // Cart Not Found
  if (errorMessage.includes('Cart not found')) {
    return 'Warenkorb nicht gefunden';
  }

  // Session Expired (Token expired)
  if (errorMessage.toLowerCase().includes('expired') || errorMessage.toLowerCase().includes('token')) {
    return 'Deine Session ist abgelaufen - bitte melde dich erneut an';
  }

  // Generic Fallbacks
  if (errorMessage.includes('Failed to add')) {
    return 'Produkt konnte nicht hinzugefügt werden';
  }

  if (errorMessage.includes('Failed to update')) {
    return 'Menge konnte nicht aktualisiert werden';
  }

  if (errorMessage.includes('Failed to remove')) {
    return 'Produkt konnte nicht entfernt werden';
  }

  // Default: Zeige originale Message (falls neue Error-Types vom Backend)
  return errorMessage;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

interface CartContextType {
  cart: Cart | null;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  isLoading: boolean;
  cartTotal: number;
  cartItemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Calculate cart totals
  const cartTotal = cart?.items.reduce((total, item) => total + (item.price * item.quantity), 0) || 0;
  const cartItemCount = cart?.items.reduce((count, item) => count + item.quantity, 0) || 0;

  // Fetch cart when user logs in
  useEffect(() => {
    if (user) {
      refreshCart();
    } else {
      setCart(null);
    }
  }, [user]);

  const refreshCart = async () => {
    const token = await getAuthToken();
    if (!token) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data);
      }
    } catch (error) {
      logger.error('Failed to fetch cart', { component: 'CartContext' }, error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity: number) => {
    const token = await getAuthToken();
    if (!token) {
      throw new Error(getGermanErrorMessage('unauthorized'));
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/cart/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId, quantity })
      });

      if (!response.ok) {
        const error = await response.json();
        const germanMessage = getGermanErrorMessage(error.error || 'Failed to add to cart');
        throw new Error(germanMessage);
      }

      const data = await response.json();
      setCart(data);
    } catch (error: any) {
      logger.error('Failed to add to cart', {
        productId,
        quantity,
        component: 'CartContext'
      }, error);
      // Wenn error.message bereits übersetzt ist → direkt weitergeben
      // Wenn nicht → nochmal durch Translator
      const finalMessage = error.message || getGermanErrorMessage('Failed to add to cart');
      throw new Error(finalMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    const token = await getAuthToken();
    if (!token) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/cart/items`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId, quantity })
      });

      if (!response.ok) {
        const error = await response.json();
        const germanMessage = getGermanErrorMessage(error.error || 'Failed to update cart');
        throw new Error(germanMessage);
      }

      const data = await response.json();
      setCart(data);
    } catch (error: any) {
      logger.error('Failed to update cart', {
        productId,
        quantity,
        component: 'CartContext'
      }, error);
      const finalMessage = error.message || getGermanErrorMessage('Failed to update cart');
      throw new Error(finalMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (productId: string) => {
    const token = await getAuthToken();
    if (!token) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/cart/items/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        const germanMessage = getGermanErrorMessage(error.error || 'Failed to remove from cart');
        throw new Error(germanMessage);
      }

      const data = await response.json();
      setCart(data);
    } catch (error: any) {
      logger.error('Failed to remove from cart', {
        productId,
        component: 'CartContext'
      }, error);
      const finalMessage = error.message || getGermanErrorMessage('Failed to remove from cart');
      throw new Error(finalMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    const token = await getAuthToken();
    if (!token) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/cart`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to clear cart');
      }

      const data = await response.json();
      setCart(data);
    } catch (error) {
      logger.error('Failed to clear cart', { component: 'CartContext' }, error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      refreshCart,
      isLoading,
      cartTotal,
      cartItemCount
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
