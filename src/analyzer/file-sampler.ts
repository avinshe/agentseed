import fg from "fast-glob";
import * as path from "node:path";
import * as fs from "node:fs";
import type { SampledFile, StructureInfo } from "./types";

const PRIORITY_PATTERNS: Record<SampledFile["priority"], string[]> = {
  entry: [
    "src/index.{ts,tsx,js,jsx}",
    "src/main.{ts,tsx,js,jsx}",
    "src/app.{ts,tsx,js,jsx}",
    "src/cli.{ts,tsx,js,jsx}",
    "index.{ts,tsx,js,jsx}",
    "main.{ts,tsx,js,jsx,py,go,rs}",
    "app.{ts,tsx,js,jsx,py}",
    "server.{ts,js}",
    "manage.py",
    "cmd/main.go",
  ],
  config: [
    "package.json",
    "tsconfig.json",
    "pyproject.toml",
    "Cargo.toml",
    "go.mod",
    "Makefile",
    "Dockerfile",
    "docker-compose.yml",
    ".env.example",
    "dbt_project.yml",
    "profiles.yml",
    "airflow.cfg",
    "alembic.ini",
  ],
  source: [
    "src/**/*.{ts,tsx,js,jsx,py,go,rs,java,rb}",
    "lib/**/*.{ts,tsx,js,jsx,py,go,rs,java,rb}",
    "app/**/*.{ts,tsx,js,jsx,py,rb}",
    "models/**/*.sql",
    "dags/**/*.py",
    "sql/**/*.sql",
    "queries/**/*.sql",
    "macros/**/*.sql",
    "staging/**/*.sql",
    "marts/**/*.sql",
    "transforms/**/*.{sql,py}",
    "pipelines/**/*.{py,yml,yaml}",
    "etl/**/*.{py,sql}",
  ],
  test: [
    "tests/**/*.{ts,tsx,js,jsx,py}",
    "test/**/*.{ts,tsx,js,jsx,py}",
    "**/*.test.{ts,tsx,js,jsx}",
    "**/*.spec.{ts,tsx,js,jsx}",
    "**/*_test.{go,py}",
  ],
};

export async function sampleFiles(
  rootDir: string,
  ignore: string[],
  structure: StructureInfo,
  maxFiles: number,
  maxBudget: number
): Promise<SampledFile[]> {
  const ignorePatterns = ignore.map((p) => `**/${p}/**`);
  const sampled: SampledFile[] = [];
  const seenPaths = new Set<string>();
  let totalSize = 0;

  const priorities: SampledFile["priority"][] = ["entry", "config", "source", "test"];

  for (const priority of priorities) {
    if (sampled.length >= maxFiles) break;

    const patterns = PRIORITY_PATTERNS[priority];
    for (const pattern of patterns) {
      if (sampled.length >= maxFiles) break;

      const matches = await fg(pattern, {
        cwd: rootDir,
        ignore: ignorePatterns,
        onlyFiles: true,
      });

      for (const match of matches) {
        if (sampled.length >= maxFiles || totalSize >= maxBudget) break;
        if (seenPaths.has(match)) continue;

        const fullPath = path.join(rootDir, match);
        try {
          const stat = fs.statSync(fullPath);
          // Skip very large files
          if (stat.size > 32768) continue;
          // Skip binary files
          if (isBinary(fullPath)) continue;

          const content = fs.readFileSync(fullPath, "utf-8");
          const sizeBytes = Buffer.byteLength(content);

          if (totalSize + sizeBytes > maxBudget) continue;

          seenPaths.add(match);
          totalSize += sizeBytes;
          sampled.push({ path: match, content, priority, sizeBytes });
        } catch {
          // Skip unreadable files
        }
      }
    }
  }

  return sampled;
}

function isBinary(filePath: string): boolean {
  const binaryExts = new Set([
    ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg",
    ".woff", ".woff2", ".ttf", ".eot",
    ".zip", ".tar", ".gz", ".bz2",
    ".pdf", ".doc", ".docx",
    ".exe", ".dll", ".so", ".dylib",
    ".lock", ".lockb",
  ]);
  return binaryExts.has(path.extname(filePath).toLowerCase());
}
