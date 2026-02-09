import type { AnalysisResult } from "./types";
import type { AgentseedConfig } from "../config/schema";
import { detectLanguages } from "./language-detector";
import { detectFrameworks } from "./framework-detector";
import { extractCommands } from "./command-extractor";
import { mapStructure } from "./structure-mapper";
import { detectPatterns } from "./pattern-detector";
import { sampleFiles } from "./file-sampler";
import { logger } from "../utils/logger";

export async function analyze(
  rootDir: string,
  config: AgentseedConfig
): Promise<AnalysisResult> {
  logger.debug(`Analyzing ${rootDir}...`);

  const [languages, frameworks, commands, structure, patterns] =
    await Promise.all([
      detectLanguages(rootDir, config.ignore),
      detectFrameworks(rootDir),
      extractCommands(rootDir),
      mapStructure(rootDir, config.ignore),
      detectPatterns(rootDir, config.ignore),
    ]);

  logger.debug(`Found ${languages.length} languages, ${frameworks.length} frameworks`);

  // Only sample files if LLM pass is enabled
  let sampledFiles: AnalysisResult["sampledFiles"] = [];
  if (!config.noLlm) {
    sampledFiles = await sampleFiles(
      rootDir,
      config.ignore,
      structure,
      config.maxFiles,
      config.maxTokenBudget
    );
    logger.debug(`Sampled ${sampledFiles.length} files for LLM`);
  }

  return { languages, frameworks, commands, structure, patterns, sampledFiles };
}

export type { AnalysisResult } from "./types";
