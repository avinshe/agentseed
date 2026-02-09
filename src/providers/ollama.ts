import { LLMProvider } from "./base";
import { ProviderError } from "../utils/errors";
import type { LLMRequest, LLMResponse } from "./types";

export class OllamaProvider extends LLMProvider {
  private baseUrl: string;

  constructor(model: string, baseUrl: string = "http://localhost:11434") {
    super(model);
    this.baseUrl = baseUrl;
  }

  get name(): string {
    return "ollama";
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    try {
      const body: Record<string, unknown> = {
        model: this.model,
        prompt: request.prompt,
        stream: false,
        options: {
          num_predict: request.maxTokens ?? 4096,
          temperature: request.temperature ?? 0.3,
        },
      };

      if (request.systemPrompt) {
        body.system = request.systemPrompt;
      }

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new ProviderError(
          `Ollama returned ${response.status}: ${text}`,
          "ollama"
        );
      }

      const data = (await response.json()) as {
        response: string;
        eval_count?: number;
        prompt_eval_count?: number;
      };

      return {
        content: data.response,
        usage: {
          inputTokens: data.prompt_eval_count ?? 0,
          outputTokens: data.eval_count ?? 0,
        },
      };
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new ProviderError(
        `Ollama error: ${(err as Error).message}. Is Ollama running at ${this.baseUrl}?`,
        "ollama"
      );
    }
  }
}
