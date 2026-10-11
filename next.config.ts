import type { NextConfig } from "next";
import withBundleAnalyzer from '@next/bundle-analyzer'

const supabaseHostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co').hostname

const nextConfig: NextConfig = {
  // Views were renamed to Scenes; keep old links working
  async redirects() {
    return [
      { source: '/:org/views', destination: '/:org/scenes', permanent: true },
      { source: '/:org/views/:path*', destination: '/:org/scenes/:path*', permanent: true },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHostname,
        pathname: '/storage/v1/object/public/**',
      },
      // Openly licensed species reference photos from iNaturalist
      {
        protocol: 'https',
        hostname: 'inaturalist-open-data.s3.amazonaws.com',
        pathname: '/photos/**',
      },
    ],
  },
};

export default withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })(nextConfig);
