'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

/**
 * Admin Global Error Boundary
 *
 * Fängt kritische Errors im Root Layout des Admin Dashboards ab.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log critical admin error
    logger.error('CRITICAL: Admin global error', {
      digest: error.digest,
      timestamp: new Date().toISOString(),
      level: 'fatal',
      component: 'AdminGlobalErrorBoundary'
    }, error);

    // TODO: Send urgent alert to development team
    // Sentry.captureException(error, { level: 'fatal', tags: { area: 'admin', critical: true } });
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
            {/* Critical Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
                <svg
                  className="w-12 h-12 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Error Title */}
            <h2 className="text-2xl font-bold text-red-600 text-center mb-4">
              Kritischer Fehler
            </h2>

            {/* Error Description */}
            <p className="text-gray-700 text-center mb-6 font-medium">
              Das Admin Dashboard konnte nicht geladen werden.
            </p>

            {/* Critical Warning */}
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 font-semibold mb-2">
                ⚠️ Systemfehler
              </p>
              <p className="text-xs text-red-700">
                Ein schwerwiegender Fehler verhindert das Laden des Dashboards.
                Das Development Team wurde automatisch benachrichtigt.
              </p>
            </div>

            {/* Error Details (always visible for admins) */}
            <div className="mb-6 p-4 bg-gray-50 border border-gray-300 rounded-md">
              <p className="text-xs font-semibold text-gray-700 mb-2">
                Technical Details:
              </p>
              <p className="text-sm font-mono text-red-600 break-words">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-gray-600 mt-2">
                  Error ID: <span className="font-mono font-bold">{error.digest}</span>
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mb-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Seite neu laden
              </button>
              <button
                onClick={reset}
                className="w-full bg-gray-300 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-400 transition-colors"
              >
                Erneut versuchen
              </button>
              <a
                href="/"
                className="w-full text-center text-gray-600 px-6 py-2 hover:text-gray-900 transition-colors text-sm"
              >
                Zur Login-Seite
              </a>
            </div>

            {/* Support Info */}
            <div className="border-t pt-4">
              <p className="text-xs text-gray-500 text-center">
                Benötigst du sofortige Hilfe?
              </p>
              <p className="text-xs text-gray-700 font-semibold text-center mt-1">
                Kontaktiere das Dev-Team mit Error-ID: {error.digest || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Inline critical styles */}
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f3f4f6;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}</style>
      </body>
    </html>
  );
}
