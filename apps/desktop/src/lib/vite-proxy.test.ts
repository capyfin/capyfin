import assert from "node:assert/strict";
import test from "node:test";

// ---------------------------------------------------------------------------
// Vite proxy configuration — ensure all sidecar routes are forwarded
// ---------------------------------------------------------------------------

void test("vite proxy config includes all sidecar API routes", async () => {
  // We can't easily import vite.config.ts directly (it uses defineConfig),
  // so we read the file as text and verify the proxy entries.
  const fs = await import("node:fs/promises");
  const path = await import("node:path");

  const configPath = path.resolve(
    import.meta.dirname,
    "../../vite.config.ts",
  );
  const content = await fs.readFile(configPath, "utf-8");

  // All sidecar routes that must be proxied in dev mode
  const requiredRoutes = [
    "/agents",
    "/chat",
    "/auth",
    "/global",
    "/providers",
    "/skills",
  ];

  for (const route of requiredRoutes) {
    assert.ok(
      content.includes(`"${route}"`),
      `Vite proxy config must include "${route}" route`,
    );
  }
});
