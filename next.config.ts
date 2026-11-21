import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [{ source: "/redefinir-senha", headers: [
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
      { key: "Cache-Control", value: "no-store" },
    ] }];
  },
};

export default nextConfig;
