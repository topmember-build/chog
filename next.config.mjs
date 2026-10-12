/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
