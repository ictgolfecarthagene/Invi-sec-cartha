/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // This allows the production build to successfully complete even if
    // your project has ESLint errors (like French apostrophes).
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;