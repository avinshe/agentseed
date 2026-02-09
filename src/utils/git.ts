import { execSync } from "node:child_process";
import { logger } from "./logger";

/**
 * Get the current HEAD commit SHA for a repo.
 */
export function getHeadSha(cwd: string): string | null {
  try {
    return execSync("git rev-parse HEAD", { cwd, encoding: "utf-8" }).trim();
  } catch {
    return null;
  }
}

/**
 * Get the latest commit SHA that touched files in a specific directory.
 * Falls back to HEAD if the path has no commits (new files).
 */
export function getPathSha(cwd: string, relativePath: string): string | null {
  try {
    const sha = execSync(
      `git log -1 --format=%H -- "${relativePath}"`,
      { cwd, encoding: "utf-8" }
    ).trim();
    return sha || getHeadSha(cwd);
  } catch {
    return getHeadSha(cwd);
  }
}

/**
 * Check if a directory has uncommitted changes (staged or unstaged).
 */
export function hasUncommittedChanges(cwd: string, relativePath?: string): boolean {
  try {
    const pathArg = relativePath ? ` -- "${relativePath}"` : "";
    const status = execSync(`git status --porcelain${pathArg}`, {
      cwd,
      encoding: "utf-8",
    }).trim();
    return status.length > 0;
  } catch {
    return true; // Assume changes if git fails
  }
}

/**
 * Check if the repo is a git repository.
 */
export function isGitRepo(cwd: string): boolean {
  try {
    execSync("git rev-parse --git-dir", { cwd, encoding: "utf-8" });
    return true;
  } catch {
    return false;
  }
}

// Metadata tag format embedded in generated files
const META_REGEX = /<!-- agentseed:meta (.+?) -->/;

export interface FileMeta {
  sha: string;
  timestamp: string;
  format: string;
}

/**
 * Build a metadata comment to embed in generated files.
 */
export function buildMetaTag(meta: FileMeta): string {
  const json = JSON.stringify(meta);
  return `<!-- agentseed:meta ${json} -->`;
}

/**
 * Parse metadata from an existing generated file.
 */
export function parseMetaTag(content: string): FileMeta | null {
  const match = content.match(META_REGEX);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as FileMeta;
  } catch {
    return null;
  }
}

/**
 * Determine if a generated file needs regeneration.
 * Returns true if:
 *  - File doesn't exist
 *  - File has no metadata tag
 *  - Git SHA has changed since last generation
 *  - There are uncommitted changes in the specific path (subfolder only)
 *
 * Note: uncommitted changes are only checked when a relativePath is given.
 * At root level, the generated files themselves appear as uncommitted,
 * causing false positives. The HEAD SHA comparison is sufficient for root.
 */
export function needsRegeneration(
  existingContent: string | null,
  currentSha: string | null,
  cwd: string,
  relativePath?: string
): boolean {
  if (!existingContent || !currentSha) return true;

  const meta = parseMetaTag(existingContent);
  if (!meta) return true;

  // SHA changed = new commits since last generation
  if (meta.sha !== currentSha) return true;

  // Check for uncommitted changes in specific subfolder paths only
  if (relativePath && hasUncommittedChanges(cwd, relativePath)) return true;

  return false;
}
