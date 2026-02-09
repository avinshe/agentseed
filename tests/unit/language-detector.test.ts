import { describe, it, expect } from "vitest";
import * as path from "node:path";
import { detectLanguages } from "../../src/analyzer/language-detector";

const FIXTURES = path.resolve(__dirname, "../fixtures");

describe("detectLanguages", () => {
  it("detects TypeScript in a node project", async () => {
    const langs = await detectLanguages(
      path.join(FIXTURES, "node-project"),
      ["node_modules", ".git", "dist"]
    );

    const ts = langs.find((l) => l.name === "TypeScript");
    expect(ts).toBeDefined();
    expect(ts!.fileCount).toBeGreaterThan(0);
  });

  it("detects Python in a python project", async () => {
    const langs = await detectLanguages(
      path.join(FIXTURES, "python-project"),
      ["node_modules", ".git", "__pycache__"]
    );

    const py = langs.find((l) => l.name === "Python");
    expect(py).toBeDefined();
    expect(py!.fileCount).toBeGreaterThan(0);
  });

  it("returns languages sorted by percentage", async () => {
    const langs = await detectLanguages(
      path.join(FIXTURES, "node-project"),
      ["node_modules", ".git"]
    );

    for (let i = 1; i < langs.length; i++) {
      expect(langs[i - 1].percentage).toBeGreaterThanOrEqual(langs[i].percentage);
    }
  });
});
