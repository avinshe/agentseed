import * as path from "node:path";
import fg from "fast-glob";
import { shouldHaveAgentsMd, type SubfolderCandidate } from "./heuristics";
import { logger } from "../utils/logger";

export async function detectSubfolders(
  rootDir: string
): Promise<SubfolderCandidate[]> {
  // Look for candidate directories (depth 1-3)
  const dirs = await fg("**/", {
    cwd: rootDir,
    onlyDirectories: true,
    deep: 3,
    ignore: [
      "**/node_modules/**",
      "**/.git/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/__pycache__/**",
      "**/vendor/**",
      "**/target/**",
    ],
  });

  const candidates: SubfolderCandidate[] = [];

  for (const dir of dirs) {
    const fullPath = path.join(rootDir, dir);
    const result = await shouldHaveAgentsMd(rootDir, fullPath);
    if (result) {
      candidates.push(result);
      logger.debug(`Subfolder candidate: ${result.relativePath} (${result.reason})`);
    }
  }

  return candidates;
}

export type { SubfolderCandidate } from "./heuristics";
