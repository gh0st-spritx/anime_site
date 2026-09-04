import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // better-sqlite3 is a native module; it must not be bundled.
  serverExternalPackages: ['better-sqlite3'],
  images: { formats: ['image/avif', 'image/webp'] },
  output: 'standalone',
};

export default nextConfig;
