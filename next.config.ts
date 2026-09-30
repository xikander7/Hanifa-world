import type { NextConfig } from "next";
import { getNextBuildDirectory } from "./src/lib/build-directory";

const nextConfig: NextConfig = { reactStrictMode: true, distDir: getNextBuildDirectory() };
export default nextConfig;
