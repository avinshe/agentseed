import type { AgentseedConfig } from "./schema";

export const DEFAULT_CONFIG: AgentseedConfig = {
  provider: "claude",
  ollamaUrl: "http://localhost:11434",
  noLlm: false,
  maxFiles: 15,
  maxTokenBudget: 65536,
  sections: {
    projectContext: true,
    stack: true,
    commands: true,
    conventions: true,
    architecture: true,
    boundaries: true,
  },
  ignore: [
    "node_modules",
    ".git",
    "dist",
    "build",
    "coverage",
    "__pycache__",
    ".next",
    ".nuxt",
    "vendor",
    "target",
  ],
};

export const DEFAULT_MODELS: Record<string, string> = {
  claude: "claude-sonnet-4-5-20250929",
  openai: "gpt-4o",
  ollama: "llama3",
};
