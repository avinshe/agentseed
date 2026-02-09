import { LLMProvider } from "./base";
import { ProviderError } from "../utils/errors";
import type { LLMRequest, LLMResponse } from "./types";

export class ClaudeProvider extends LLMProvider {
  get name(): string {
    return "claude";
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    if (!this.apiKey) {
      throw new ProviderError(
        "ANTHROPIC_API_KEY is required. Set it via environment variable or .agentseedrc config.",
        "claude"
      );
    }

    try {
      // Dynamic import to avoid requiring the SDK when not used
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey: this.apiKey });

      const message = await client.messages.create({
        model: this.model,
        max_tokens: request.maxTokens ?? 4096,
        ...(request.systemPrompt ? { system: request.systemPrompt } : {}),
        messages: [{ role: "user", content: request.prompt }],
      });

      const textBlock = message.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new ProviderError("No text response from Claude", "claude");
      }

      return {
        content: textBlock.text,
        usage: {
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
        },
      };
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new ProviderError(
        `Claude API error: ${(err as Error).message}`,
        "claude"
      );
    }
  }
}
