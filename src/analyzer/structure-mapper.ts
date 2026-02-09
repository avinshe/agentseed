import fg from "fast-glob";
import * as path from "node:path";
import type { StructureInfo, DirectoryEntry } from "./types";

const ENTRY_POINT_PATTERNS = [
  "src/index.*",
  "src/main.*",
  "src/app.*",
  "src/cli.*",
  "index.*",
  "main.*",
  "app.*",
  "server.*",
  "src/server.*",
  "cmd/main.*",
  "lib/index.*",
  "manage.py",
  "app.py",
  "main.py",
  "dbt_project.yml",
  "airflow.cfg",
  "alembic.ini",
];

export async function mapStructure(
  rootDir: string,
  ignore: string[]
): Promise<StructureInfo> {
  const ignorePatterns = ignore.map((p) => `**/${p}/**`);

  const files = await fg("**/*", {
    cwd: rootDir,
    ignore: ignorePatterns,
    onlyFiles: true,
    dot: false,
    deep: 6,
  });

  const dirs = await fg("**/", {
    cwd: rootDir,
    ignore: ignorePatterns,
    onlyDirectories: true,
    dot: false,
    deep: 4,
  });

  // Build tree (limited depth for readability)
  const tree: DirectoryEntry[] = [];

  for (const dir of dirs.slice(0, 50)) {
    const depth = dir.split("/").length - 1;
    if (depth <= 3) {
      tree.push({ path: dir, type: "directory", depth });
    }
  }

  for (const file of files) {
    const depth = file.split("/").length - 1;
    if (depth <= 2) {
      tree.push({ path: file, type: "file", depth });
    }
  }

  tree.sort((a, b) => a.path.localeCompare(b.path));

  // Find entry points
  const entryPoints: string[] = [];
  for (const pattern of ENTRY_POINT_PATTERNS) {
    const matches = await fg(pattern, {
      cwd: rootDir,
      ignore: ignorePatterns,
    });
    entryPoints.push(...matches);
  }

  return {
    totalFiles: files.length,
    totalDirs: dirs.length,
    tree,
    entryPoints: [...new Set(entryPoints)],
  };
}
