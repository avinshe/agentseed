import * as path from "node:path";
import pc from "picocolors";
import { logger, setLogLevel } from "../utils/logger";
import { loadConfig } from "../config/loader";
import { analyze } from "../analyzer";
import { generate } from "../generator";
import { detectSubfolders } from "../scanner";
import { writeFileSync, fileExists, readFileSync } from "../utils/fs";
import { withSpinner } from "../utils/spinner";
import { computeSubfolderDelta } from "../generator/subfolder-differ";
import { renderCoreContent } from "../generator/markdown-renderer";
import { renderForFormat } from "../generator/format-renderer";
import { UsageTracker } from "../utils/usage-tracker";
import { FORMATS, resolveFormats, type OutputFormat } from "../generator/formats";
import {
  isGitRepo,
  getHeadSha,
  getPathSha,
  needsRegeneration,
  type FileMeta,
} from "../utils/git";

interface ScanOptions {
  dryRun?: boolean;
  format: string;
  provider?: string;
  model?: string;
  force?: boolean;
  verbose?: boolean;
}

export async function scanCommand(
  targetPath: string,
  options: ScanOptions
): Promise<void> {
  if (options.verbose) setLogLevel("debug");

  const rootDir = path.resolve(targetPath);
  const format = options.format as OutputFormat;
  const formats = resolveFormats(format);
  const useLlm = !!options.provider;

  logger.info(pc.bold("agentseed scan"), pc.gray(`(${rootDir})`));
  logger.info(
    pc.gray(`Formats: ${formats.map((f) => FORMATS[f].name).join(", ")}`)
  );

  try {
    const config = await loadConfig(rootDir, {
      provider: options.provider,
      model: options.model,
      noLlm: !useLlm,
    });

    const tracker = new UsageTracker(config.model!);

    // Git context
    const gitRepo = isGitRepo(rootDir);
    const rootSha = gitRepo ? getHeadSha(rootDir) : null;

    // Analyze root
    const rootAnalysis = await withSpinner("Analyzing root...", () =>
      analyze(rootDir, config)
    );

    // Build root metadata
    const rootMeta: FileMeta | undefined =
      gitRepo && rootSha
        ? {
            sha: rootSha,
            timestamp: new Date().toISOString(),
            format: "agentseed-v1",
          }
        : undefined;

    // Generate root core content
    let rootCoreContent: string;

    // Check if root needs regeneration
    let rootNeedsRegen = true;
    if (!options.force && !options.dryRun && gitRepo && rootSha) {
      rootNeedsRegen = formats.some((fmt) => {
        const outPath = path.join(rootDir, FORMATS[fmt].outputPath);
        if (!fileExists(outPath)) return true;
        const existing = readFileSync(outPath);
        return needsRegeneration(existing, rootSha, rootDir);
      });
    }

    if (!rootNeedsRegen) {
      logger.info(pc.gray("Root files are up to date, skipping analysis"));
      // Still need core content for subfolder diffing — read from existing file
      const agentsPath = path.join(rootDir, FORMATS.agents.outputPath);
      rootCoreContent = fileExists(agentsPath) ? readFileSync(agentsPath) : "";
    } else if (config.noLlm) {
      rootCoreContent = renderCoreContent(rootAnalysis, null);
    } else {
      const result = await withSpinner("Generating root with LLM...", () =>
        generate(rootDir, rootAnalysis, config, formats[0])
      );
      rootCoreContent = result.coreContent;
      tracker.add(result.usage);
    }

    // Detect subfolders
    const subfolders = await withSpinner("Detecting subfolders...", () =>
      detectSubfolders(rootDir)
    );

    if (options.dryRun) {
      for (const fmt of formats) {
        const formatted = renderForFormat(fmt, rootAnalysis, rootCoreContent);
        logger.info(pc.bold(`\n--- Root ${FORMATS[fmt].name} ---\n`));
        logger.info(formatted);
      }
      logger.info(pc.bold(`\nDetected ${subfolders.length} subfolder(s):`));
      for (const sf of subfolders) {
        logger.info(`  ${pc.cyan(sf.relativePath)} - ${sf.reason}`);
      }
      if (!config.noLlm) tracker.printSummary();
      return;
    }

    // Write root files (if needed)
    if (rootNeedsRegen) {
      for (const fmt of formats) {
        const formatted = renderForFormat(
          fmt,
          rootAnalysis,
          rootCoreContent,
          undefined,
          rootMeta
        );
        writeFileSync(path.join(rootDir, FORMATS[fmt].outputPath), formatted);
      }
      logger.success(
        `Root files written (${formats.map((f) => FORMATS[f].name).join(", ")})`
      );
    }

    // Process each subfolder
    const total = subfolders.length;
    let sfWritten = 0;
    let sfSkipped = 0;

    for (let i = 0; i < total; i++) {
      const sf = subfolders[i];
      const progress = pc.gray(`[${i + 1}/${total}]`);
      const sfDir = path.join(rootDir, sf.relativePath);

      // Per-subfolder staleness check using path-specific SHA
      const sfSha = gitRepo
        ? getPathSha(rootDir, sf.relativePath)
        : null;

      if (!options.force && gitRepo && sfSha) {
        const sfAllFresh = formats.every((fmt) => {
          const outPath = path.join(sfDir, FORMATS[fmt].outputPath);
          if (!fileExists(outPath)) return false;
          const existing = readFileSync(outPath);
          return !needsRegeneration(existing, sfSha, rootDir, sf.relativePath);
        });

        if (sfAllFresh) {
          logger.info(
            `${progress} ${pc.gray(sf.relativePath + "/")} ${pc.yellow("unchanged, skipping")}`
          );
          sfSkipped++;
          continue;
        }
      }

      const sfMeta: FileMeta | undefined =
        gitRepo && sfSha
          ? {
              sha: sfSha,
              timestamp: new Date().toISOString(),
              format: "agentseed-v1",
            }
          : undefined;

      const sfAnalysis = await analyze(sfDir, config);

      let sfCoreContent: string;
      if (config.noLlm) {
        const delta = computeSubfolderDelta(rootAnalysis, sfAnalysis);
        sfCoreContent = renderCoreContent(delta, null, sf.relativePath);
      } else {
        const result = await withSpinner(
          `${progress} Generating ${sf.relativePath}...`,
          () =>
            generate(sfDir, sfAnalysis, config, formats[0], {
              rootAnalysis,
              subfolderPath: sf.relativePath,
            })
        );
        sfCoreContent = result.coreContent;
        tracker.add(result.usage);
      }

      for (const fmt of formats) {
        const formatted = renderForFormat(
          fmt,
          sfAnalysis,
          sfCoreContent,
          sf.relativePath,
          sfMeta
        );
        writeFileSync(
          path.join(sfDir, FORMATS[fmt].outputPath),
          formatted
        );
      }
      logger.success(`${progress} ${sf.relativePath}/ files written`);
      sfWritten++;
    }

    if (sfSkipped > 0) {
      logger.info(
        pc.gray(
          `${sfSkipped} subfolder(s) skipped (unchanged). Use --force to regenerate all.`
        )
      );
    }

    if (!config.noLlm) tracker.printSummary();
  } catch (err) {
    logger.error((err as Error).message);
    process.exitCode = 1;
  }
}
