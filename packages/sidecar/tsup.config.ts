import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  entry: ["src/cli.ts", "src/internal-gateway/host.ts"],
  external: ["@capyfin/contracts"],
  format: ["esm"],
  platform: "node",
  target: "node22",
});
