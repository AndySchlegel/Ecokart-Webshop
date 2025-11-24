'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

/**
 * Checkout Error Boundary
 *
 * Spezialisierte Error Boundary für den Checkout-Prozess.
 * Bietet checkout-spezifische Wiederherstellungsoptionen.
 */
export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log checkout error with structured logging
    logger.error('Checkout error occurred', {
      digest: error.digest,
      timestamp: new Date().toISOString(),
      component: 'CheckoutErrorBoundary'
    }, error);

    // TODO: Track checkout abandonment due to errors
    // analytics.track('checkout_error', { error: error.message });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-lg w-full bg-white shadow-lg rounded-lg p-8">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-orange-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
        </div>

        {/* Error Title */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
          Problem beim Checkout
        </h2>

        {/* Error Description */}
        <p className="text-gray-600 text-center mb-6">
          Beim Abschluss deiner Bestellung ist ein Fehler aufgetreten.
          Deine Artikel im Warenkorb sind sicher gespeichert.
        </p>

        {/* Reassurance */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Keine Sorge:</strong> Es wurde keine Zahlung durchgeführt
            und dein Warenkorb ist intakt.
          </p>
        </div>

        {/* Error Details (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-gray-100 rounded-md">
            <p className="text-xs font-semibold text-gray-700 mb-1">
              Debug Info:
            </p>
            <p className="text-sm font-mono text-gray-700 break-words">
              {error.message}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mb-4">
          <button
            onClick={reset}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Checkout erneut versuchen
          </button>
          <a
            href="/cart"
            className="w-full bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors text-center"
          >
            Zurück zum Warenkorb
          </a>
          <a
            href="/"
            className="w-full text-gray-600 px-6 py-2 text-center hover:text-gray-900 transition-colors text-sm"
          >
            Weiter einkaufen
          </a>
        </div>

        {/* Support Info */}
        <div className="border-t pt-4">
          <p className="text-xs text-gray-500 text-center">
            Brauchst du Hilfe? Kontaktiere unseren Support mit der Fehler-ID:
          </p>
          <p className="text-xs font-mono text-gray-700 text-center mt-1">
            {error.digest || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}
