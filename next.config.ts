import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development", // 개발 모드에서는 SW 사용 안함
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // 개발/목업용 이미지
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // GCS 원본 버킷
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/indetune-images/**",
      },
      {
        // CDN (프로덕션 배포 후 사용)
        protocol: "https",
        hostname: "cdn.indetune.com",
      },
    ],
  },
};

export default withSerwist(nextConfig);
