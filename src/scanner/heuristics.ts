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
  "deno.json",
  "deno.jsonc",
];

const SOURCE_EXTENSIONS = new Set([
  // Web
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".vue", ".svelte",
  // Systems
  ".c", ".cpp", ".cc", ".h", ".hpp",
  ".rs",
  ".go",
  ".zig",
  // JVM
  ".java", ".kt", ".scala", ".clj", ".cljs",
  // Scripting
  ".py",
  ".rb",
  ".php",
  ".pl", ".pm",
  ".lua",
  ".r", ".R",
  // Mobile
  ".swift",
  ".dart",
  // Functional
  ".ex", ".exs", ".erl",
  ".hs",
  ".ml", ".mli",
  // .NET
  ".cs", ".fs",
  // Shell
  ".sh", ".bash",
  // Data
  ".sql",
]);

/** Minimum source files for a directory to qualify without a config file. */
const MIN_SOURCE_FILES = 5;

/**
 * Directories that are never meaningful sub-projects, even if they
 * have config files or source code.
 */
const NON_CODE_DIRS = new Set([
  "docs", "doc", "documentation",
  "examples", "example", "demos", "demo", "samples", "sample",
  "test", "tests", "testing", "__tests__", "spec", "specs",
  "benchmarks", "benchmark", "benches",
  "static", "assets", "public", "media",
  "fixtures", "scripts", "docker", "vendor",
]);

export interface SubfolderCandidate {
  relativePath: string;
  reason: string;
}

/**
 * Determines if a directory qualifies for its own AGENTS.md.
 *
 * A directory qualifies if:
 *   1. None of its path components are non-code directories, AND
 *   2. It has its own config file (package.json, Cargo.toml, etc.), OR
 *   3. It contains >= MIN_SOURCE_FILES source code files
 */
export async function shouldHaveAgentsMd(
  rootDir: string,
  dirPath: string
): Promise<SubfolderCandidate | null> {
  const relativePath = path.relative(rootDir, dirPath).replace(/\\/g, "/");

  // Skip non-code directories
  const parts = relativePath.split("/");
  for (const part of parts) {
    if (NON_CODE_DIRS.has(part.toLowerCase())) {
      return null;
    }
  }

  // Signal 1: has its own config file → strong indicator of a sub-project
  for (const config of CONFIG_INDICATORS) {
    if (fileExists(path.join(dirPath, config))) {
      return { relativePath, reason: `Has own ${config}` };
    }
  }

  // Signal 2: has enough source code files → meaningful code directory
  const sourceCount = await countSourceFiles(dirPath);
  if (sourceCount >= MIN_SOURCE_FILES) {
    return { relativePath, reason: `${sourceCount} source files` };
  }

  return null;
}

/**
 * Count source code files (by extension) as direct children of a directory.
 */
async function countSourceFiles(dirPath: string): Promise<number> {
  const files = await fg("*", {
    cwd: dirPath,
    onlyFiles: true,
    deep: 1,
  });

  let count = 0;
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (SOURCE_EXTENSIONS.has(ext)) {
      count++;
    }
  }
  return count;
}
