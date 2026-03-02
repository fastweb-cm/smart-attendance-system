// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: { autoPrerender: false },
  serverRuntimeConfig: {},
  publicRuntimeConfig: {},
  experimental: {
    hostname: 'smartattendance.fastwebcm.local',
  },
};

module.exports = nextConfig;
