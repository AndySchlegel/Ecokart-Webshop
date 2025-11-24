'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

/**
 * Admin Error Boundary
 *
 * Fängt Errors im Admin Dashboard ab und bietet Admin-spezifische Recovery-Optionen.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log admin error with additional context
    logger.error('Admin dashboard error', {
      digest: error.digest,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      component: 'AdminErrorBoundary'
    }, error);

    // TODO: Alert admin team about dashboard errors
    // Sentry.captureException(error, { tags: { area: 'admin' } });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
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
          Dashboard Error
        </h2>

        {/* Error Description */}
        <p className="text-gray-600 text-center mb-6">
          Im Admin Dashboard ist ein Fehler aufgetreten.
          Deine Änderungen wurden möglicherweise nicht gespeichert.
        </p>

        {/* Admin Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Hinweis:</strong> Wenn du gerade Daten bearbeitet hast,
            prüfe bitte ob die Änderungen gespeichert wurden.
          </p>
        </div>

        {/* Error Details (always shown for admins) */}
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Error Details:
          </p>
          <p className="text-sm font-mono text-red-600 break-words mb-2">
            {error.message}
          </p>
          {error.digest && (
            <p className="text-xs text-gray-600">
              Error ID: <span className="font-mono">{error.digest}</span>
            </p>
          )}
          {error.stack && process.env.NODE_ENV === 'development' && (
            <details className="mt-2">
              <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                Stack Trace (Dev Only)
              </summary>
              <pre className="text-xs text-gray-600 mt-2 overflow-auto max-h-40">
                {error.stack}
              </pre>
            </details>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Erneut versuchen
          </button>
          <a
            href="/dashboard"
            className="w-full bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors text-center"
          >
            Zurück zum Dashboard
          </a>
          <button
            onClick={() => window.location.reload()}
            className="w-full text-gray-600 px-6 py-2 text-center hover:text-gray-900 transition-colors text-sm"
          >
            Seite neu laden
          </button>
        </div>

        {/* Tech Support Info */}
        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-gray-500 text-center">
            Bei anhaltenden Problemen kontaktiere das Development Team.
          </p>
        </div>
      </div>
    </div>
  );
}
