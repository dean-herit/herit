/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Optimize images
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
  },

  // Enable compression
  compress: true,

  // Optimize bundle
  experimental: {
    optimizePackageImports: ["@heroui/react", "@iconify/react"],
  },

  // Skip ESLint during builds (we run it separately in CI)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // TypeScript validation during builds
  typescript: {
    ignoreBuildErrors: false,
  },

  // SWC minification is enabled by default in Next.js 13+
  
  // Reduce build output verbosity
  productionBrowserSourceMaps: false,

  // Bundle analyzer (only when ANALYZE=true)
  ...(process.env.ANALYZE === "true" && {
    webpack: async (config) => {
      const { BundleAnalyzerPlugin } = await import("webpack-bundle-analyzer");
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: "static",
          openAnalyzer: false,
        }),
      );
      return config;
    },
  }),
};

export default nextConfig;
