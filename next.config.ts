import type { NextConfig } from "next";
const config: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  serverExternalPackages: ["node:sqlite"],
  poweredByHeader: false,
};
export default config;
