import type { NextConfig } from "next";

const isPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: isPages ? "/hub-gestao" : undefined,
  assetPrefix: isPages ? "/hub-gestao/" : undefined,
};

export default nextConfig;
