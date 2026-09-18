/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    qualities: [82],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1280, 1440, 1920],
    imageSizes: [96, 128, 256, 384, 512],
    minimumCacheTTL: 2592000,
  },
  async redirects() {
    return [
      {
        source: '/blog/skilky-koshtuye-burinnya-sverdlovyny-lviv',
        destination: '/blog/yak-pidhotuvaty-dilianku-do-burinnya-sverdlovyny',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
