import type { NextConfig } from "next";
import { getNextBuildDirectory } from "./src/lib/build-directory";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir: getNextBuildDirectory(),
  // The old Skill Adventure and Quest map pages now live together on /adventure.
  async redirects() { return [{ source: "/journey", destination: "/adventure", permanent: false }]; },
};
export default nextConfig;
