import fg from "fast-glob";
import * as path from "node:path";
import type { PatternInfo } from "./types";
import { fileExists } from "../utils/fs";

const CONFIG_FILES = [
  "tsconfig.json", "jsconfig.json",
  ".eslintrc", ".eslintrc.js", ".eslintrc.json", ".eslintrc.yml", "eslint.config.js", "eslint.config.mjs",
  ".prettierrc", ".prettierrc.js", ".prettierrc.json", "prettier.config.js",
  ".editorconfig",
  "biome.json",
  ".env.example",
  "docker-compose.yml", "docker-compose.yaml", "Dockerfile",
  "pyproject.toml", "setup.py", "setup.cfg",
  "Cargo.toml",
  "go.mod",
  "Gemfile",
  "composer.json",
];

const CI_FILES = [
  ".github/workflows/*.yml",
  ".github/workflows/*.yaml",
  ".gitlab-ci.yml",
  "Jenkinsfile",
  ".circleci/config.yml",
  ".travis.yml",
  "bitbucket-pipelines.yml",
];

export async function detectPatterns(
  rootDir: string,
  ignore: string[]
): Promise<PatternInfo> {
  const ignorePatterns = ignore.map((p) => `**/${p}/**`);

  // Detect naming convention from source files
  const sourceFiles = await fg("src/**/*.*", {
    cwd: rootDir,
    ignore: ignorePatterns,
    onlyFiles: true,
    deep: 3,
  });

  const namingConvention = detectNamingConvention(sourceFiles);
  const fileOrganization = detectFileOrganization(rootDir, sourceFiles);

  // Detect monorepo
  const hasMonorepo =
    fileExists(path.join(rootDir, "lerna.json")) ||
    fileExists(path.join(rootDir, "pnpm-workspace.yaml")) ||
    fileExists(path.join(rootDir, "turbo.json")) ||
    (await fg("packages/*/package.json", { cwd: rootDir })).length > 0 ||
    (await fg("apps/*/package.json", { cwd: rootDir })).length > 0;

  // Find config files
  const configFiles: string[] = [];
  for (const cf of CONFIG_FILES) {
    if (fileExists(path.join(rootDir, cf))) {
      configFiles.push(cf);
    }
  }

  // Find CI files (use dot: true to match .github)
  const ciFiles: string[] = [];
  for (const pattern of CI_FILES) {
    const matches = await fg(pattern, { cwd: rootDir, dot: true });
    ciFiles.push(...matches);
  }

  return {
    namingConvention,
    fileOrganization,
    hasMonorepo,
    configFiles,
    ciFiles,
  };
}

function detectNamingConvention(files: string[]): PatternInfo["namingConvention"] {
  const names = files.map((f) => path.basename(f, path.extname(f)));
  let camel = 0, snake = 0, kebab = 0, pascal = 0;

  for (const name of names) {
    if (name.includes("_")) snake++;
    else if (name.includes("-")) kebab++;
    else if (/^[A-Z]/.test(name)) pascal++;
    else if (/[a-z][A-Z]/.test(name)) camel++;
  }

  const total = camel + snake + kebab + pascal;
  if (total === 0) return "mixed";

  const max = Math.max(camel, snake, kebab, pascal);
  if (max / total < 0.5) return "mixed";

  if (max === kebab) return "kebab-case";
  if (max === snake) return "snake_case";
  if (max === pascal) return "PascalCase";
  return "camelCase";
}

function detectFileOrganization(rootDir: string, files: string[]): string {
  // Collect both top-level dirs and src/ subdirectories
  const topDirs = new Set<string>();
  const srcSubDirs = new Set<string>();

  for (const f of files) {
    const parts = f.split("/");
    if (parts.length > 1) topDirs.add(parts[0]);
    // If file is under src/, track subdirectory names
    if (parts[0] === "src" && parts.length > 2) {
      srcSubDirs.add(parts[1]);
    }
  }

  const allDirs = new Set([...topDirs, ...srcSubDirs]);

  // Feature-based: src/features/*, src/modules/*, etc.
  const featureDirs = ["features", "modules", "domains", "pages", "routes"];
  for (const fd of featureDirs) {
    if (allDirs.has(fd)) return "feature-based";
  }

  // Module-based: organized by functional areas (router/, middleware/, adapter/, helper/, etc.)
  const moduleDirs = [
    "router", "routers", "middleware", "middlewares",
    "adapter", "adapters", "helper", "helpers",
    "plugin", "plugins", "handler", "handlers",
    "client", "utils", "hooks", "providers",
  ];
  let moduleCount = 0;
  for (const md of moduleDirs) {
    if (srcSubDirs.has(md) || topDirs.has(md)) moduleCount++;
  }
  if (moduleCount >= 2) return "module-based";

  // Layer-based: src/controllers, src/services, src/models, etc.
  const layerDirs = ["controllers", "services", "models", "repositories"];
  let layerCount = 0;
  for (const ld of layerDirs) {
    if (allDirs.has(ld)) layerCount++;
  }
  if (layerCount >= 2) return "layer-based";

  // Component-based (React/Vue/Svelte)
  if (allDirs.has("components")) return "component-based";

  // Check if there are meaningful subdirectories at all
  if (srcSubDirs.size >= 3) return "domain-based";

  return "flat";
}
