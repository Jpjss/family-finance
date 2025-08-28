/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Bypass-Tunnel-Reminder',
            value: 'true',
          },
        ],
      },
    ]
  },
  // Configure para aceitar todas as origens em desenvolvimento
  async rewrites() {
    return []
  },
}

module.exports = nextConfig