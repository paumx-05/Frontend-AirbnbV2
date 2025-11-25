const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Comentado: no compatible con páginas dinámicas y API routes
  // El código compilado se genera en la carpeta .next
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Asegurar que los alias de paths funcionen correctamente
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '.'),
    };
    return config;
  },
};

module.exports = nextConfig;
