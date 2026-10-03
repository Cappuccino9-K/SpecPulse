import type { NextConfig } from "next";

const apiProxy = process.env.API_PROXY_TARGET ?? "http://127.0.0.1:18765";
const galleryProxy = process.env.GALLERY_PROXY_TARGET ?? "http://127.0.0.1:18766";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/backend-api/:path*", destination: `${apiProxy}/api/:path*` },
      { source: "/demo/:path*", destination: `${apiProxy}/demo/:path*` },
      { source: "/gallery-api/:path*", destination: `${galleryProxy}/api/:path*` },
    ];
  },
};

export default nextConfig;
