import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["cjs"],
  target: "es2022",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  dts: false,
  splitting: false,
  shims: true,
  external: ["@anthropic-ai/sdk", "openai"],
});
