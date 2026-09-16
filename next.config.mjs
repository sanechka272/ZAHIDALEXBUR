/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    qualities: [90],
    formats: ['image/webp'],
    minimumCacheTTL: 604800,
  },
};

export default nextConfig;
