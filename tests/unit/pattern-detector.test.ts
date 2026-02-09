import { describe, it, expect } from "vitest";
import * as path from "node:path";
import { detectPatterns } from "../../src/analyzer/pattern-detector";

const FIXTURES = path.resolve(__dirname, "../fixtures");

describe("detectPatterns", () => {
  it("detects config files in node project", async () => {
    const patterns = await detectPatterns(
      path.join(FIXTURES, "node-project"),
      ["node_modules", ".git"]
    );

    expect(patterns.configFiles).toContain("tsconfig.json");
  });

  it("detects monorepo structure", async () => {
    const patterns = await detectPatterns(
      path.join(FIXTURES, "monorepo"),
      ["node_modules", ".git"]
    );

    expect(patterns.hasMonorepo).toBe(true);
  });

  it("returns a naming convention", async () => {
    const patterns = await detectPatterns(
      path.join(FIXTURES, "node-project"),
      ["node_modules", ".git"]
    );

    expect(["camelCase", "snake_case", "kebab-case", "PascalCase", "mixed"]).toContain(
      patterns.namingConvention
    );
  });
});
