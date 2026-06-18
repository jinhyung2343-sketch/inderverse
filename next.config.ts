import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const isPreviewOrStaging =
  process.env.VERCEL_ENV === "preview" || process.env.APP_ENV === "staging";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development" || isPreviewOrStaging,
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

function parseCsv(value: string | undefined) {
  return value
    ?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean) ?? [];
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublicUrl = parseUrl(supabaseUrl);
const supabaseHostname = supabasePublicUrl?.hostname ?? "127.0.0.1";
const supabaseStorageHostname = supabasePublicUrl
  ? `${supabaseHostname.split(".")[0]}.storage.supabase.co`
  : "127.0.0.1";

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
  allowedDevOrigins: [
    "127.0.0.1",
    ...parseCsv(process.env.NEXT_ALLOWED_DEV_ORIGINS),
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
      {
        // Local Supabase Storage public assets
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // Local Supabase Storage public assets
        protocol: "http",
        hostname: "localhost",
        port: "54321",
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
