import { describe, it, expect } from "vitest";
import * as path from "node:path";
import { extractCommands } from "../../src/analyzer/command-extractor";

const FIXTURES = path.resolve(__dirname, "../fixtures");

describe("extractCommands", () => {
  it("extracts npm scripts from package.json", async () => {
    const commands = await extractCommands(
      path.join(FIXTURES, "node-project")
    );

    const names = commands.map((c) => c.name);
    expect(names).toContain("dev");
    expect(names).toContain("build");
    expect(names).toContain("test");
    expect(names).toContain("lint");
  });

  it("uses npm run prefix by default", async () => {
    const commands = await extractCommands(
      path.join(FIXTURES, "node-project")
    );

    const build = commands.find((c) => c.name === "build");
    expect(build).toBeDefined();
    expect(build!.command).toBe("npm run build");
    expect(build!.source).toBe("package.json scripts");
  });

  it("extracts pytest command from python project", async () => {
    const commands = await extractCommands(
      path.join(FIXTURES, "python-project")
    );

    const test = commands.find((c) => c.command === "pytest");
    expect(test).toBeDefined();
  });
});
