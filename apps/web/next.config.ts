import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@parcel-society/shared", "@parcel-society/db", "@parcel-society/engine"],
};

export default nextConfig;
