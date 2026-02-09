import { z } from "zod";

export const providerSchema = z.enum(["claude", "openai", "ollama"]);

export const configSchema = z.object({
  provider: providerSchema.default("claude"),
  model: z.string().optional(),
  apiKey: z.string().optional(),
  ollamaUrl: z.string().default("http://localhost:11434"),
  noLlm: z.boolean().default(false),
  maxFiles: z.number().int().positive().default(15),
  maxTokenBudget: z.number().int().positive().default(65536),
  sections: z
    .object({
      projectContext: z.boolean().default(true),
      stack: z.boolean().default(true),
      commands: z.boolean().default(true),
      conventions: z.boolean().default(true),
      architecture: z.boolean().default(true),
      boundaries: z.boolean().default(true),
    })
    .default({}),
  ignore: z.array(z.string()).default([
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
  ]),
});

export type AgentseedConfig = z.infer<typeof configSchema>;
export type Provider = z.infer<typeof providerSchema>;
