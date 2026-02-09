import pc from "picocolors";
import { logger } from "./logger";

// Approximate pricing per 1M tokens (USD) as of 2025
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-5-20250929": { input: 3, output: 15 },
  "claude-haiku-4-5-20251001": { input: 0.8, output: 4 },
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
};

interface UsageEntry {
  inputTokens: number;
  outputTokens: number;
}

export class UsageTracker {
  private entries: UsageEntry[] = [];
  private model: string;

  constructor(model: string) {
    this.model = model;
  }

  add(usage?: { inputTokens: number; outputTokens: number }): void {
    if (usage) {
      this.entries.push(usage);
    }
  }

  get totalInput(): number {
    return this.entries.reduce((sum, e) => sum + e.inputTokens, 0);
  }

  get totalOutput(): number {
    return this.entries.reduce((sum, e) => sum + e.outputTokens, 0);
  }

  get callCount(): number {
    return this.entries.length;
  }

  printSummary(): void {
    if (this.entries.length === 0) return;

    const input = this.totalInput;
    const output = this.totalOutput;
    const total = input + output;

    const pricing = PRICING[this.model];
    let costStr = "";
    if (pricing) {
      const cost =
        (input / 1_000_000) * pricing.input +
        (output / 1_000_000) * pricing.output;
      costStr = ` (~$${cost.toFixed(4)})`;
    }

    logger.info(
      pc.gray(
        `\nLLM usage: ${this.entries.length} call(s), ` +
          `${input.toLocaleString()} input + ${output.toLocaleString()} output = ` +
          `${total.toLocaleString()} tokens${costStr}`
      )
    );
  }
}
