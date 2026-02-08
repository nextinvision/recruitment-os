import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Configure Turbopack - empty config silences the webpack warning
  // The workspace root warning can be resolved by ensuring only one package-lock.json exists
  turbopack: {},
};

export default nextConfig;
