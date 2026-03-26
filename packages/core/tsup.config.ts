import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["src/index.ts", "src/agents/index.ts", "src/config-paths.ts"],
  format: ["esm"],
  platform: "node",
  target: "node22",
  tsconfig: "tsconfig.build.json",
});
