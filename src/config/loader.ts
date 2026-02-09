import * as path from "node:path";
import YAML from "yaml";
import { configSchema, type AgentseedConfig } from "./schema";
import { DEFAULT_MODELS } from "./defaults";
import { fileExists, readFileSync } from "../utils/fs";
import { ConfigError } from "../utils/errors";
import { logger } from "../utils/logger";

interface LoadOverrides {
  provider?: string;
  model?: string;
  noLlm?: boolean;
}

const CONFIG_FILES = [".agentseedrc", ".agentseedrc.yml", ".agentseedrc.yaml"];

export async function loadConfig(
  rootDir: string,
  overrides: LoadOverrides = {}
): Promise<AgentseedConfig> {
  let rawConfig: Record<string, unknown> = {};

  // Look for config file
  for (const filename of CONFIG_FILES) {
    const configPath = path.join(rootDir, filename);
    if (fileExists(configPath)) {
      logger.debug(`Loading config from ${configPath}`);
      try {
        const content = readFileSync(configPath);
        rawConfig = YAML.parse(content) ?? {};
      } catch (err) {
        throw new ConfigError(
          `Failed to parse ${filename}: ${(err as Error).message}`
        );
      }
      break;
    }
  }

  // Apply CLI overrides
  if (overrides.provider) rawConfig.provider = overrides.provider;
  if (overrides.model) rawConfig.model = overrides.model;
  if (overrides.noLlm !== undefined) rawConfig.noLlm = overrides.noLlm;

  // Resolve env vars for API key
  if (!rawConfig.apiKey) {
    const provider = (rawConfig.provider as string) ?? "claude";
    rawConfig.apiKey = resolveApiKey(provider);
  }

  // Set default model if not specified
  if (!rawConfig.model) {
    const provider = (rawConfig.provider as string) ?? "claude";
    rawConfig.model = DEFAULT_MODELS[provider];
  }

  // Validate
  const result = configSchema.safeParse(rawConfig);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new ConfigError(`Invalid configuration:\n${issues}`);
  }

  return result.data;
}

function resolveApiKey(provider: string): string | undefined {
  switch (provider) {
    case "claude":
      return process.env.ANTHROPIC_API_KEY;
    case "openai":
      return process.env.OPENAI_API_KEY;
    case "ollama":
      return undefined; // Ollama doesn't need an API key
    default:
      return undefined;
  }
}
