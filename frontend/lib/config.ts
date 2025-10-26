/**
 * Application Configuration
 * Centralized config for environment variables
 */

export const config = {
  // API Configuration
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000',

  // Feature Flags (for future use)
  features: {
    enableReviews: false,
    enableWishlist: false,
  }
} as const;

// Export commonly used values
export const API_BASE_URL = config.apiBaseUrl;
