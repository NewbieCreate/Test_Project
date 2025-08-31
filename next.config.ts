import type { NextConfig } from "next";
import type { Configuration } from "webpack";

const nextConfig: NextConfig = {
  webpack: (config: Configuration) => {
    // Konva.js를 외부 모듈로 처리
    if (Array.isArray(config.externals)) {
      config.externals = [...config.externals, { canvas: "canvas" }];
    } else if (config.externals) {
      config.externals = [config.externals, { canvas: "canvas" }];
    } else {
      config.externals = [{ canvas: "canvas" }];
    }

    // 서버 사이드에서 Konva 관련 모듈 무시
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve?.fallback,
        canvas: false,
      },
    };

    return config;
  },

  transpilePackages: ["konva"],
  reactStrictMode: true,
};

export default nextConfig;
