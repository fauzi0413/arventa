import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/tenant-&-contract",
        destination: "/tenants",
        permanent: true,
      },
      {
        source: "/platform/subscription-&-billing",
        destination: "/platform/subscriptions",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
