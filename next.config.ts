import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages is a static host: emit `out/` instead of a Node server build.
  output: "export",

  // `output: "export"` ships no server, so there is no /_next/image optimizer
  // endpoint to answer next/image's requests. Serve the files from /public
  // as-is instead, or every <Image> 404s once deployed.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
