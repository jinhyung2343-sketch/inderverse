import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

function getHostnameFromUrl(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development", // 개발 모드에서는 SW 사용 안함
});

const gcsBucketName = process.env.GCS_BUCKET_NAME || "inderverse-images";
const cdnHostname = getHostnameFromUrl(process.env.NEXT_PUBLIC_CDN_URL) || "cdn.inderverse.com";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: [
    "127.0.0.1",
    "192.168.219.*",
  ],
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
        pathname: `/${gcsBucketName}/**`,
      },
      {
        // CDN (프로덕션 배포 후 사용)
        protocol: "https",
        hostname: cdnHostname,
      },
    ],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/.git/**',
          '**/.next/**',
          '**/node_modules/**',
          '**/public/sw.js',
        ],
      }
    }

    return config
  },
};

export default withSerwist(nextConfig);
