'use client';

import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import { ToastProvider } from '../contexts/ToastContext';

// Import Amplify configuration - this initializes Amplify Auth
import '../lib/amplify';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
