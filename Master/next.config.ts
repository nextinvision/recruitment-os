import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Mark AWS SDK as external for server-side (it's dynamically imported at runtime)
  // This works with both Turbopack and Webpack
  serverExternalPackages: ['@aws-sdk/client-ses'],
  // Configure Turbopack - empty config silences the webpack warning
  // The workspace root warning can be resolved by ensuring only one package-lock.json exists
  turbopack: {},
};

export default nextConfig;
