import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // This disables build-breaking ESLint errors
  },
}

export default nextConfig
