import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages is a static host: emit `out/` instead of a Node server build.
  output: "export",
};

export default nextConfig;
