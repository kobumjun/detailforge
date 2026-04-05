import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      {
        protocol: "https",
        hostname: "oaidalleapiprodscus.blob.core.windows.net",
        pathname: "/**",
      },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
  serverExternalPackages: [
    "@sparticuz/chromium",
    "puppeteer-core",
    "playwright-core",
    "playwright",
  ],
};

export default nextConfig;
