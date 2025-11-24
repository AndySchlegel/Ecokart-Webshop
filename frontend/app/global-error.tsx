'use client';

import { useEffect } from 'react';

/**
 * Global Error Boundary
 *
 * Fängt Errors im Root Layout ab (z.B. in app/layout.tsx).
 * Muss <html> und <body> tags enthalten, da der Root Layout Error ist.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling#handling-errors-in-root-layouts
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log critical error
    console.error('CRITICAL: Global error boundary caught:', error);

    // TODO: Send to error tracking service with HIGH priority
    // Example: Sentry.captureException(error, { level: 'fatal' });
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-red-600"
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
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
              Kritischer Fehler
            </h2>

            {/* Error Description */}
            <p className="text-gray-600 text-center mb-6">
              Die Anwendung konnte nicht geladen werden.
              Bitte lade die Seite neu oder versuche es später erneut.
            </p>

            {/* Error Details (development only) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-6 p-4 bg-gray-100 rounded-md">
                <p className="text-sm font-mono text-gray-700 break-words">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-gray-500 mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
                {error.stack && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-600 cursor-pointer">
                      Stack Trace
                    </summary>
                    <pre className="text-xs text-gray-600 mt-2 overflow-auto">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Seite neu laden
              </button>
              <button
                onClick={reset}
                className="w-full bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Erneut versuchen
              </button>
            </div>

            {/* Support Info */}
            <p className="text-xs text-gray-500 text-center mt-6">
              Fehler-ID: {error.digest || 'Unbekannt'}
            </p>
          </div>
        </div>

        {/* Inline styles as fallback (in case Tailwind fails to load) */}
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }
        `}</style>
      </body>
    </html>
  );
}
