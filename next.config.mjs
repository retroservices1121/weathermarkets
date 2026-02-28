/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'polymarket-upload.s3.us-east-2.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/gamma/:path*',
        destination: 'https://gamma-api.polymarket.com/:path*',
      },
      {
        source: '/api/clob/:path*',
        destination: 'https://clob.polymarket.com/:path*',
      },
    ];
  },
};

export default nextConfig;
