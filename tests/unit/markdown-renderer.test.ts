import { describe, it, expect } from "vitest";
import { renderCoreContent } from "../../src/generator/markdown-renderer";
import { renderForFormat } from "../../src/generator/format-renderer";
import type { AnalysisResult } from "../../src/analyzer/types";

const mockAnalysis: AnalysisResult = {
  languages: [
    { name: "TypeScript", percentage: 80, fileCount: 20 },
    { name: "JavaScript", percentage: 20, fileCount: 5 },
  ],
  frameworks: [
    { name: "React", category: "web", confidence: 0.9 },
    { name: "Vitest", category: "testing", confidence: 0.7 },
  ],
  commands: [
    { name: "build", command: "npm run build", source: "package.json scripts" },
    { name: "test", command: "npm run test", source: "package.json scripts" },
  ],
  structure: {
    totalFiles: 25,
    totalDirs: 5,
    tree: [
      { path: "src", type: "directory", depth: 0 },
      { path: "tests", type: "directory", depth: 0 },
    ],
    entryPoints: ["src/index.ts"],
  },
  patterns: {
    namingConvention: "camelCase",
    fileOrganization: "feature-based",
    hasMonorepo: false,
    configFiles: ["tsconfig.json"],
    ciFiles: [],
  },
  sampledFiles: [],
};

describe("renderCoreContent", () => {
  it("renders static content with all 6 sections", () => {
    const content = renderCoreContent(mockAnalysis, null);

    expect(content).toContain("## Project Context");
    expect(content).toContain("## Stack");
    expect(content).toContain("## Commands");
    expect(content).toContain("## Conventions");
    expect(content).toContain("## Architecture");
    expect(content).toContain("## Boundaries");
  });

  it("includes detected languages", () => {
    const content = renderCoreContent(mockAnalysis, null);
    expect(content).toContain("TypeScript (80%)");
    expect(content).toContain("JavaScript (20%)");
  });

  it("includes commands", () => {
    const content = renderCoreContent(mockAnalysis, null);
    expect(content).toContain("npm run build");
    expect(content).toContain("npm run test");
  });

  it("returns LLM content directly when provided", () => {
    const llmContent = "# My Custom Content\nThis is LLM-generated.";
    const content = renderCoreContent(mockAnalysis, llmContent);
    expect(content).toContain("My Custom Content");
  });
});

describe("renderForFormat", () => {
  const coreContent = renderCoreContent(mockAnalysis, null);

  it("renders AGENTS.md format", () => {
    const output = renderForFormat("agents", mockAnalysis, coreContent);
    expect(output).toContain("## Project Context");
    expect(output).toContain("## Boundaries");
  });

  it("renders CLAUDE.md format", () => {
    const output = renderForFormat("claude", mockAnalysis, coreContent);
    expect(output).toContain("## Project Context");
  });

  it("renders .cursorrules format", () => {
    const output = renderForFormat("cursor", mockAnalysis, coreContent);
    expect(output).toContain("# Project Rules");
  });

  it("renders copilot-instructions.md format", () => {
    const output = renderForFormat("copilot", mockAnalysis, coreContent);
    expect(output).toContain("<!-- GitHub Copilot Custom Instructions -->");
  });

  it("renders .windsurfrules format", () => {
    const output = renderForFormat("windsurf", mockAnalysis, coreContent);
    expect(output).toContain("## Project Context");
  });

  it("adds subfolder context for AGENTS.md", () => {
    const output = renderForFormat("agents", mockAnalysis, coreContent, "packages/ui");
    expect(output).toContain("packages/ui");
    expect(output).toContain("See root AGENTS.md");
  });
});
