/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    qualities: [90],
    formats: ['image/webp'],
    minimumCacheTTL: 604800,
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
