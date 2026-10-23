import type { NextConfig } from "next";
import { getNextBuildDirectory } from "./src/lib/build-directory";

// Browser protections sent with every page. None of them changes how the app works: it is never shown inside another
// site's frame, doesn't use the camera, microphone or location, and its files are always the type they say they are.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir: getNextBuildDirectory(),
  // The old Skill Adventure and Quest map pages now live together on /adventure.
  async redirects() { return [{ source: "/journey", destination: "/adventure", permanent: false }]; },
  async headers() { return [{ source: "/:path*", headers: securityHeaders }]; },
};
export default nextConfig;
