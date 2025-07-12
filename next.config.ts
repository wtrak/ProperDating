import { i18n } from './next-i18next.config'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  i18n, // 👈 Add this line to enable i18n
}

export default nextConfig
