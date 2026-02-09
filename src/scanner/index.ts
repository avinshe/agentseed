import * as path from "node:path";
import fg from "fast-glob";
import { shouldHaveAgentsMd, type SubfolderCandidate } from "./heuristics";
import { logger } from "../utils/logger";

export async function detectSubfolders(
  rootDir: string
): Promise<SubfolderCandidate[]> {
  // Find all candidate directories (heuristics handle filtering)
  const dirs = await fg("**/", {
    cwd: rootDir,
    onlyDirectories: true,
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

  return deduplicateCandidates(candidates);
}

/**
 * Remove any candidate whose ancestor is also a candidate (prefer shallower).
 */
function deduplicateCandidates(
  candidates: SubfolderCandidate[]
): SubfolderCandidate[] {
  const paths = new Set(candidates.map((c) => c.relativePath));

  return candidates.filter((c) => {
    const parts = c.relativePath.split("/");
    for (let i = 1; i < parts.length; i++) {
      const ancestor = parts.slice(0, i).join("/");
      if (ancestor !== c.relativePath && paths.has(ancestor)) {
        return false;
      }
    }
    return true;
  });
}

export type { SubfolderCandidate } from "./heuristics";
