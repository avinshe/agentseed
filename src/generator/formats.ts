export type OutputFormat = "agents" | "claude" | "cursor" | "copilot" | "windsurf" | "all";

export const FORMATS: Record<Exclude<OutputFormat, "all">, FormatConfig> = {
  agents: {
    name: "AGENTS.md",
    outputPath: "AGENTS.md",
    description: "Universal format (GitHub Copilot, Codex, Gemini CLI, Cursor, 20+ tools)",
  },
  claude: {
    name: "CLAUDE.md",
    outputPath: "CLAUDE.md",
    description: "Claude Code",
  },
  cursor: {
    name: ".cursorrules",
    outputPath: ".cursorrules",
    description: "Cursor IDE",
  },
  copilot: {
    name: "copilot-instructions.md",
    outputPath: ".github/copilot-instructions.md",
    description: "GitHub Copilot",
  },
  windsurf: {
    name: ".windsurfrules",
    outputPath: ".windsurfrules",
    description: "Windsurf / Codeium",
  },
};

export interface FormatConfig {
  name: string;
  outputPath: string;
  description: string;
}

export function resolveFormats(format: OutputFormat): (Exclude<OutputFormat, "all">)[] {
  if (format === "all") {
    return ["agents", "claude", "cursor", "copilot", "windsurf"];
  }
  return [format];
}
