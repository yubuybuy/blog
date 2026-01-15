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
  // 移除了 typescript.ignoreBuildErrors 和 eslint.ignoreDuringBuilds
  // 以确保类型安全和代码质量

  // 修复Admin后台刷新404问题
  async rewrites() {
    return [
      {
        source: '/admin/:path*',
        destination: '/admin',
      },
      {
        source: '/structure/:path*',
        destination: '/admin',
      },
      {
        source: '/desk/:path*',
        destination: '/admin',
      },
    ]
  },
};

export default nextConfig;
