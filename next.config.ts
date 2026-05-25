import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development", // 개발 모드에서는 SW 사용 안함
});

function parseUrl(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value);
  } catch {
    return null;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublicUrl = parseUrl(supabaseUrl);
const supabaseHostname = supabasePublicUrl?.hostname ?? "127.0.0.1";
const supabaseStorageHostname = supabasePublicUrl
  ? `${supabaseHostname.split(".")[0]}.storage.supabase.co`
  : "127.0.0.1";

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
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
        // Supabase Storage public assets
        protocol: (supabasePublicUrl?.protocol.replace(":", "") || "http") as "http" | "https",
        hostname: supabaseHostname,
        port: supabasePublicUrl?.port,
        pathname: "/storage/v1/object/public/**",
      },
      {
        // Supabase direct storage host for larger uploads/downloads
        protocol: "https",
        hostname: supabaseStorageHostname,
        pathname: "/storage/v1/object/public/**",
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
