import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle Firebase Admin into the server output. This avoids Vercel trying
  // to resolve it as an unavailable external runtime module.
  transpilePackages: ["firebase-admin"],
};

export default nextConfig;
