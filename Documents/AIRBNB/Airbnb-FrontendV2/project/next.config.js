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
};

module.exports = nextConfig;
