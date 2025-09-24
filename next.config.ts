import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'cdn.sanity.io',
      'source.unsplash.com',
      'images.unsplash.com',
      'picsum.photos',
      'image.tmdb.org'
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 修复Admin后台刷新404问题
  async rewrites() {
    return [
      {
        source: '/admin/:path*',
        destination: '/admin',
      },
    ]
  },
};

export default nextConfig;
