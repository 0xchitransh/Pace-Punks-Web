import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config) => {
    config.externals.push(
      "pino-pretty", 
      "lokijs", 
      "encoding",
      /^@x402\//,
      /^@solana\//
    );
    return config;
  }
};

export default withPWA(nextConfig);
