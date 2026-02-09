import fg from "fast-glob";
import * as path from "node:path";
import type { LanguageInfo } from "./types";

const EXTENSIONS: Record<string, string> = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".mjs": "JavaScript",
  ".cjs": "JavaScript",
  ".py": "Python",
  ".rs": "Rust",
  ".go": "Go",
  ".java": "Java",
  ".kt": "Kotlin",
  ".rb": "Ruby",
  ".php": "PHP",
  ".cs": "C#",
  ".cpp": "C++",
  ".c": "C",
  ".h": "C",
  ".hpp": "C++",
  ".swift": "Swift",
  ".scala": "Scala",
  ".ex": "Elixir",
  ".exs": "Elixir",
  ".erl": "Erlang",
  ".hs": "Haskell",
  ".lua": "Lua",
  ".r": "R",
  ".R": "R",
  ".dart": "Dart",
  ".vue": "Vue",
  ".svelte": "Svelte",
  ".astro": "Astro",
  ".sql": "SQL",
  ".hql": "HiveQL",
  ".ddl": "SQL",
  ".dml": "SQL",
  ".plsql": "PL/SQL",
  ".pgsql": "PL/pgSQL",
  ".sh": "Shell",
  ".bash": "Shell",
  ".zsh": "Shell",
  ".css": "CSS",
  ".scss": "SCSS",
  ".less": "Less",
  ".html": "HTML",
  ".yml": "YAML",
  ".yaml": "YAML",
  ".toml": "TOML",
  ".tf": "Terraform",
  ".tfvars": "Terraform",
};

export async function detectLanguages(
  rootDir: string,
  ignore: string[]
): Promise<LanguageInfo[]> {
  const files = await fg("**/*", {
    cwd: rootDir,
    ignore: ignore.map((p) => `**/${p}/**`),
    onlyFiles: true,
    dot: false,
  });

  const counts = new Map<string, number>();

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const lang = EXTENSIONS[ext];
    if (lang) {
      counts.set(lang, (counts.get(lang) ?? 0) + 1);
    }
  }

  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  if (total === 0) return [];

  return Array.from(counts.entries())
    .map(([name, fileCount]) => ({
      name,
      fileCount,
      percentage: Math.round((fileCount / total) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage);
}
