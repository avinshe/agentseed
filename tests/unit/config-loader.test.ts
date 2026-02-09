import { describe, it, expect } from "vitest";
import * as path from "node:path";
import { loadConfig } from "../../src/config/loader";

const FIXTURES = path.resolve(__dirname, "../fixtures");

describe("loadConfig", () => {
  it("returns default config when no .agentseedrc exists", async () => {
    const config = await loadConfig(path.join(FIXTURES, "node-project"));

    expect(config.provider).toBe("claude");
    expect(config.noLlm).toBe(false);
    expect(config.maxFiles).toBe(15);
    expect(config.ignore).toContain("node_modules");
  });

  it("respects CLI overrides", async () => {
    const config = await loadConfig(path.join(FIXTURES, "node-project"), {
      provider: "openai",
      noLlm: true,
    });

    expect(config.provider).toBe("openai");
    expect(config.noLlm).toBe(true);
  });

  it("sets default model based on provider", async () => {
    const config = await loadConfig(path.join(FIXTURES, "node-project"), {
      provider: "ollama",
    });

    expect(config.model).toBe("llama3");
  });
});
