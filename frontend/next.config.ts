import type { NextConfig } from "next";

const apiProxy = process.env.API_PROXY_TARGET ?? "http://127.0.0.1:8765";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/backend-api/:path*", destination: `${apiProxy}/api/:path*` },
      { source: "/demo/:path*", destination: `${apiProxy}/demo/:path*` },
    ];
  },
};

export default nextConfig;
