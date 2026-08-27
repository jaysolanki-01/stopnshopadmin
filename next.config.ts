import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "thestopnshop.in",
        pathname: "/**",
      },
      {
        // Allow secure.gravatar.com and other common WP image CDNs
        protocol: "https",
        hostname: "**.gravatar.com",
      },
    ],
  },
};

export default nextConfig;
