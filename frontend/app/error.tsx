'use client';

import { useEffect } from 'react';

/**
 * Error Boundary für die App
 *
 * Fängt React Errors ab und zeigt eine benutzerfreundliche Fehlerseite.
 * Next.js erstellt automatisch eine Error Boundary aus diesem File.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development
    console.error('Error boundary caught:', error);

    // TODO: In production, send to error tracking service (e.g., Sentry)
    // Example: Sentry.captureException(error);
  }, [error]);

  return (
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
          Oops! Etwas ist schiefgelaufen
        </h2>

        {/* Error Description */}
        <p className="text-gray-600 text-center mb-6">
          Es ist ein unerwarteter Fehler aufgetreten. Das tut uns leid!
          Bitte versuche es erneut oder kehre zur Startseite zurück.
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
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={reset}
            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Erneut versuchen
          </button>
          <a
            href="/"
            className="flex-1 bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors text-center"
          >
            Zur Startseite
          </a>
        </div>

        {/* Support Info */}
        <p className="text-xs text-gray-500 text-center mt-6">
          Problem besteht weiterhin? Kontaktiere unseren Support.
        </p>
      </div>
    </div>
  );
}
