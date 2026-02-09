import type { AnalysisResult } from "../analyzer/types";
import type { AgentseedConfig } from "../config/schema";
import type { LLMResponse } from "../providers/types";
import type { OutputFormat } from "./formats";
import { createProvider } from "../providers";
import {
  buildRootPrompt,
  buildSubfolderPrompt,
  SYSTEM_PROMPT,
} from "./prompt-builder";
import { renderForFormat } from "./format-renderer";
import { renderCoreContent } from "./markdown-renderer";
import { logger } from "../utils/logger";
import { withRetry } from "../utils/retry";

interface SubfolderContext {
  rootAnalysis: AnalysisResult;
  subfolderPath: string;
}

export interface GenerateResult {
  /** Core content (format-agnostic) */
  coreContent: string;
  /** Formatted output for the requested format */
  formatted: string;
  usage?: LLMResponse["usage"];
}

/**
 * Generates core content via LLM, then renders it for the specified format.
 */
export async function generate(
  rootDir: string,
  analysis: AnalysisResult,
  config: AgentseedConfig,
  format: Exclude<OutputFormat, "all">,
  subfolderCtx?: SubfolderContext
): Promise<GenerateResult> {
  const provider = createProvider(config);

  let prompt: string;
  if (subfolderCtx) {
    const rootContent = renderCoreContent(subfolderCtx.rootAnalysis, null);
    prompt = buildSubfolderPrompt(
      analysis,
      rootContent,
      subfolderCtx.subfolderPath
    );
  } else {
    prompt = buildRootPrompt(analysis);
  }

  logger.debug(`Sending prompt to ${provider.name} (${config.model})`);

  const response = await withRetry(() =>
    provider.generate({
      prompt,
      systemPrompt: SYSTEM_PROMPT,
      maxTokens: 4096,
      temperature: 0.3,
    })
  );

  if (response.usage) {
    logger.debug(
      `Tokens: ${response.usage.inputTokens} in, ${response.usage.outputTokens} out`
    );
  }

  const coreContent = response.content;
  const formatted = renderForFormat(
    format,
    analysis,
    coreContent,
    subfolderCtx?.subfolderPath
  );

  return { coreContent, formatted, usage: response.usage };
}

/**
 * Generates static-only content (no LLM) for the specified format.
 */
export function generateStatic(
  analysis: AnalysisResult,
  format: Exclude<OutputFormat, "all">,
  subfolderPath?: string
): string {
  const coreContent = renderCoreContent(analysis, null, subfolderPath);
  return renderForFormat(format, analysis, coreContent, subfolderPath);
}
