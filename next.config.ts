import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  // Standalone deployment: assets are served directly by this application.
  async rewrites() {
    // The shell forwards this path to the Pessoas API. Keep direct access
    // to the standalone Pessoas domain working with the same link.
    return [{ source: "/pessoas/api/holerites/pdf", destination: "/api/holerites/pdf" }];
  },
  async redirects() {
    return [
      {
        source: "/recrutamento/vagas",
        destination: "/pessoas/recrutamento",
        permanent: true,
      },
      {
        source: "/recrutamento/vagas/:path*",
        destination: "/pessoas/recrutamento/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
