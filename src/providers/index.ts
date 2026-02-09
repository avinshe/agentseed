import type { AgentseedConfig } from "../config/schema";
import type { LLMProvider } from "./base";
import { ClaudeProvider } from "./claude";
import { OpenAIProvider } from "./openai";
import { OllamaProvider } from "./ollama";
import { ConfigError } from "../utils/errors";

export function createProvider(config: AgentseedConfig): LLMProvider {
  const model = config.model!;

  switch (config.provider) {
    case "claude":
      return new ClaudeProvider(model, config.apiKey);
    case "openai":
      return new OpenAIProvider(model, config.apiKey);
    case "ollama":
      return new OllamaProvider(model, config.ollamaUrl);
    default:
      throw new ConfigError(`Unknown provider: ${config.provider}`);
  }
}

export type { LLMProvider } from "./base";
