import * as path from "node:path";
import pc from "picocolors";
import { logger, setLogLevel } from "../utils/logger";
import { loadConfig } from "../config/loader";
import { analyze } from "../analyzer";
import { generate, generateStatic } from "../generator";
import { writeFileSync, fileExists, readFileSync } from "../utils/fs";
import { withSpinner } from "../utils/spinner";
import { UsageTracker } from "../utils/usage-tracker";
import { FORMATS, resolveFormats, type OutputFormat } from "../generator/formats";
import { renderForFormat } from "../generator/format-renderer";
import { renderCoreContent } from "../generator/markdown-renderer";
import {
  isGitRepo,
  getHeadSha,
  needsRegeneration,
  parseMetaTag,
  type FileMeta,
} from "../utils/git";

interface InitOptions {
  dryRun?: boolean;
  output?: string;
  format: string;
  provider?: string;
  model?: string;
  force?: boolean;
  verbose?: boolean;
}

export async function initCommand(options: InitOptions): Promise<void> {
  if (options.verbose) setLogLevel("debug");

  const rootDir = process.cwd();
  const format = options.format as OutputFormat;
  const formats = resolveFormats(format);
  const useLlm = !!options.provider;

  logger.info(pc.bold("agentseed init"), pc.gray(`(${rootDir})`));
  logger.info(
    pc.gray(`Formats: ${formats.map((f) => FORMATS[f].name).join(", ")}`)
  );
  if (!useLlm) {
    logger.info(pc.gray("Static analysis mode. Use --provider claude for LLM enhancement."));
  }

  try {
    const config = await loadConfig(rootDir, {
      provider: options.provider,
      model: options.model,
      noLlm: !useLlm,
    });

    // --- Staleness check ---
    const gitRepo = isGitRepo(rootDir);
    const currentSha = gitRepo ? getHeadSha(rootDir) : null;

    if (!options.force && !options.dryRun && gitRepo && currentSha) {
      const allFresh = formats.every((fmt) => {
        const outPath = options.output
          ? path.resolve(rootDir, options.output)
          : path.resolve(rootDir, FORMATS[fmt].outputPath);
        if (!fileExists(outPath)) return false;
        const existing = readFileSync(outPath);
        return !needsRegeneration(existing, currentSha, rootDir);
      });

      if (allFresh) {
        logger.info(
          pc.green("All files are up to date.") +
            pc.gray(" Use --force to regenerate.")
        );
        return;
      }
    }

    const analysis = await withSpinner("Analyzing repository...", () =>
      analyze(rootDir, config)
    );

    // Generate core content once (static or LLM), then render for each format
    let coreContent: string;
    const tracker = new UsageTracker(config.model!);

    if (config.noLlm) {
      coreContent = renderCoreContent(analysis, null);
    } else {
      // Use first format for the LLM call — content is format-agnostic
      const result = await withSpinner("Generating with LLM...", () =>
        generate(rootDir, analysis, config, formats[0])
      );
      coreContent = result.coreContent;
      tracker.add(result.usage);
    }

    // Build metadata for tracking
    const meta: FileMeta | undefined =
      gitRepo && currentSha
        ? {
            sha: currentSha,
            timestamp: new Date().toISOString(),
            format: "agentseed-v1",
          }
        : undefined;

    if (options.dryRun) {
      for (const fmt of formats) {
        const formatted = renderForFormat(fmt, analysis, coreContent);
        logger.info(pc.bold(`\n--- ${FORMATS[fmt].name} (dry run) ---\n`));
        logger.info(formatted);
      }
      if (!config.noLlm) tracker.printSummary();
      return;
    }

    // Write each format
    let written = 0;
    let skipped = 0;
    for (const fmt of formats) {
      const outputPath = options.output
        ? path.resolve(rootDir, options.output)
        : path.resolve(rootDir, FORMATS[fmt].outputPath);

      // Per-file staleness check (skip files that are already current)
      if (!options.force && gitRepo && currentSha && fileExists(outputPath)) {
        const existing = readFileSync(outputPath);
        if (!needsRegeneration(existing, currentSha, rootDir)) {
          logger.info(
            pc.gray(`  ${FORMATS[fmt].name} is up to date, skipping`)
          );
          skipped++;
          continue;
        }
      }

      const formatted = renderForFormat(
        fmt,
        analysis,
        coreContent,
        undefined,
        meta
      );
      writeFileSync(outputPath, formatted);
      logger.success(
        `${FORMATS[fmt].name} written to ${pc.bold(outputPath)}`
      );
      written++;
    }

    if (skipped > 0) {
      logger.info(
        pc.gray(`${skipped} file(s) skipped (unchanged). Use --force to regenerate all.`)
      );
    }

    if (!config.noLlm) tracker.printSummary();
  } catch (err) {
    logger.error((err as Error).message);
    process.exitCode = 1;
  }
}
