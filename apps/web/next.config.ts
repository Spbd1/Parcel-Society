import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@parcel-society/shared"],
};

export default nextConfig;
