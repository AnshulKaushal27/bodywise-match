/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@bodywise/shared"],
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
