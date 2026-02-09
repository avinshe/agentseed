import type { LLMRequest, LLMResponse } from "./types";

export abstract class LLMProvider {
  constructor(
    protected model: string,
    protected apiKey?: string
  ) {}

  abstract generate(request: LLMRequest): Promise<LLMResponse>;

  abstract get name(): string;
}
