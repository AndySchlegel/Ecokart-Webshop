/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Use standard build (not static export) for AWS Amplify
  // Amplify supports Next.js SSR and dynamic routes
  // output: 'export', // Disabled - using Amplify instead of pure S3

  // Disable image optimization for AWS (Amplify handles this)
  images: {
    unoptimized: true
  },

  // Optional: Configure trailing slashes
  trailingSlash: true,
};

export default nextConfig;
