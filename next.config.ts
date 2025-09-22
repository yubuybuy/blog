import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'cdn.sanity.io',
      'source.unsplash.com',
      'images.unsplash.com',
      'picsum.photos'
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
