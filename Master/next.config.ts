import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Configure Turbopack - empty config silences the webpack warning
  // The workspace root warning can be resolved by ensuring only one package-lock.json exists
  turbopack: {},
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
  },
  
  // Production optimizations
  compress: true,
  
  // Ensure proper MIME types
  poweredByHeader: false,
  
  // Static file handling
  generateEtags: true,
  
  // Ensure proper asset prefix handling
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : undefined,
};

export default nextConfig;
