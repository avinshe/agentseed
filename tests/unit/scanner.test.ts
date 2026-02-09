import { describe, it, expect } from "vitest";
import * as path from "node:path";
import { detectSubfolders } from "../../src/scanner";

const FIXTURES = path.resolve(__dirname, "../fixtures");

describe("detectSubfolders", () => {
  it("detects packages in monorepo", async () => {
    const subfolders = await detectSubfolders(
      path.join(FIXTURES, "monorepo")
    );

    const paths = subfolders.map((s) => s.relativePath);
    expect(paths).toContain("packages/ui");
    expect(paths).toContain("packages/api");
  });

  it("returns reason for each subfolder", async () => {
    const subfolders = await detectSubfolders(
      path.join(FIXTURES, "monorepo")
    );

    for (const sf of subfolders) {
      expect(sf.reason).toBeTruthy();
    }
  });

  it("returns empty array for flat project", async () => {
    const subfolders = await detectSubfolders(
      path.join(FIXTURES, "python-project")
    );

    expect(subfolders.length).toBe(0);
  });
});
