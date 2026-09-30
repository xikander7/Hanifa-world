export function getNextBuildDirectory(nodeEnv = process.env.NODE_ENV): string {
  return nodeEnv === "production" ? ".next-production" : ".next";
}
