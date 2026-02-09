import { describe, it, expect } from "vitest";
import * as path from "node:path";
import { detectFrameworks } from "../../src/analyzer/framework-detector";

const FIXTURES = path.resolve(__dirname, "../fixtures");

describe("detectFrameworks", () => {
  it("detects React and Next.js in node project", async () => {
    const frameworks = await detectFrameworks(
      path.join(FIXTURES, "node-project")
    );

    const names = frameworks.map((f) => f.name);
    expect(names).toContain("React");
    expect(names).toContain("Next.js");
  });

  it("detects Vitest in node project", async () => {
    const frameworks = await detectFrameworks(
      path.join(FIXTURES, "node-project")
    );

    const vitest = frameworks.find((f) => f.name === "Vitest");
    expect(vitest).toBeDefined();
    expect(vitest!.category).toBe("testing");
  });

  it("detects Flask in python project", async () => {
    const frameworks = await detectFrameworks(
      path.join(FIXTURES, "python-project")
    );

    const flask = frameworks.find((f) => f.name === "Flask");
    expect(flask).toBeDefined();
    expect(flask!.category).toBe("api");
  });

  it("detects Express in monorepo api package", async () => {
    const frameworks = await detectFrameworks(
      path.join(FIXTURES, "monorepo/packages/api")
    );

    const express = frameworks.find((f) => f.name === "Express");
    expect(express).toBeDefined();
  });
});
