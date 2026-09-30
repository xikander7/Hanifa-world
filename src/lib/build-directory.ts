export function getNextBuildDirectory(nodeEnv = process.env.NODE_ENV, onVercel = Boolean(process.env.VERCEL)): string {
  // Vercel only looks for ".next", so the separate production folder is for local builds.
  return nodeEnv === "production" && !onVercel ? ".next-production" : ".next";
}
