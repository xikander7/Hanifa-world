import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";

describe("security headers", () => {
  it("sends the browser protections on every page", async () => {
    const rules = await nextConfig.headers!();
    expect(rules).toHaveLength(1);
    expect(rules[0].source).toBe("/:path*");
    const headers = Object.fromEntries(rules[0].headers.map(h => [h.key, h.value]));
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Content-Security-Policy"]).toBe("frame-ancestors 'none'");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  });

  it("doesn't switch off anything the app uses (it needs no camera, microphone or location)", async () => {
    const rules = await nextConfig.headers!();
    const policy = rules[0].headers.find(h => h.key === "Permissions-Policy")!.value;
    expect(policy).toContain("camera=()");
    expect(policy).not.toMatch(/autoplay|fullscreen|clipboard|storage-access/); // music, copy-link and saving keep working
  });
});
