import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sito statico (cartella out/) servito sotto /time-off-counter
  output: "export",
  basePath: "/time-off-counter",
  generateBuildId: () => Date.now().toString(36),
  // in sviluppo resta Turbopack; la build di produzione usa webpack (vedi script "build")
  turbopack: {},
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // nomi file solo alfanumerici: l'hosting non serviva i chunk con "_" e "-" nel nome
      config.output.filename = "static/chunks/[contenthash].js";
      config.output.chunkFilename = "static/chunks/[contenthash].js";
    }
    return config;
  },
};

export default nextConfig;
