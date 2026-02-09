import * as path from "node:path";
import fg from "fast-glob";
import { fileExists } from "../utils/fs";

const CONFIG_INDICATORS = [
  "package.json",
  "Cargo.toml",
  "go.mod",
  "pyproject.toml",
  "setup.py",
  "Gemfile",
  "composer.json",
  "pom.xml",
  "build.gradle",
];

const MIN_FILE_COUNT = 5;

export interface SubfolderCandidate {
  relativePath: string;
  reason: string;
}

/**
 * Determines if a directory qualifies as a subfolder that should get its own AGENTS.md.
 */
export async function shouldHaveAgentsMd(
  rootDir: string,
  dirPath: string
): Promise<SubfolderCandidate | null> {
  const relativePath = path.relative(rootDir, dirPath).replace(/\\/g, "/");

  // Check for own config file
  for (const config of CONFIG_INDICATORS) {
    if (fileExists(path.join(dirPath, config))) {
      return { relativePath, reason: `Has own ${config}` };
    }
  }

  // Check file count
  const files = await fg("**/*", {
    cwd: dirPath,
    onlyFiles: true,
    ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/build/**"],
    deep: 3,
  });

  if (files.length < MIN_FILE_COUNT) {
    return null;
  }

  // Recognized structure patterns
  const parts = relativePath.split("/");
  const parentDir = parts[0];
  const recognizedParents = [
    "packages", "apps", "services", "libs", "modules",
    "src/features", "src/modules", "src/apps",
    "runtime-tests", "benchmarks", "examples", "plugins",
    "tools", "crates", "internal",
  ];

  for (const rp of recognizedParents) {
    if (relativePath.startsWith(rp + "/") && parts.length === rp.split("/").length + 1) {
      return { relativePath, reason: `Recognized pattern: ${rp}/*` };
    }
  }

  // Fallback: any directory with its own config and enough files is a candidate
  if (files.length >= 10) {
    return { relativePath, reason: `Standalone directory (${files.length} files)` };
  }

  return null;
}
