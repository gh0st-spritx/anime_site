import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // better-sqlite3 is a native module; it must not be bundled.
  serverExternalPackages: ['better-sqlite3'],
  images: { formats: ['image/avif', 'image/webp'] },
  output: 'standalone',
  // Set when exporting for a GitHub project page, which serves from a
  // subdirectory. Empty for normal hosting, where the site is at the root.
  basePath: process.env.PAGES_BASE_PATH || undefined,
};

export default nextConfig;
