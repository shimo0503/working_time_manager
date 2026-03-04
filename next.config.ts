import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverActions: {
    // リバースプロキシ経由のServer Actionsを許可するドメイン
    // 環境変数 ALLOWED_ORIGINS にカンマ区切りで指定する
    // 例: ALLOWED_ORIGINS=example.com,www.example.com
    allowedOrigins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : [],
  },
};

export default nextConfig;
