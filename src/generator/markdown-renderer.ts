import type { AnalysisResult } from "../analyzer/types";

// Well-known directory descriptions
const DIR_DESCRIPTIONS: Record<string, string> = {
  src: "Source code",
  lib: "Library code",
  app: "Application code",
  bin: "CLI entry points / executables",
  dist: "Build output",
  build: "Build output",
  out: "Build output",
  tests: "Test files",
  test: "Test files",
  __tests__: "Test files",
  spec: "Test specifications",
  docs: "Documentation",
  doc: "Documentation",
  config: "Configuration files",
  scripts: "Build/automation scripts",
  public: "Static public assets",
  static: "Static assets",
  assets: "Project assets",
  styles: "Stylesheets",
  components: "UI components",
  pages: "Page components / routes",
  routes: "Route handlers",
  api: "API endpoints",
  middleware: "Middleware functions",
  middlewares: "Middleware functions",
  utils: "Utility functions",
  helpers: "Helper functions",
  hooks: "Custom hooks",
  types: "Type definitions",
  models: "Data models / dbt models",
  services: "Service layer",
  controllers: "Request handlers",
  schemas: "Validation / schema definitions",
  migrations: "Database migrations",
  fixtures: "Test fixtures / seed data",
  packages: "Monorepo packages",
  apps: "Monorepo applications",
  plugins: "Plugin modules",
  adapters: "Platform adapters",
  adapter: "Platform adapters",
  router: "Routing logic",
  routers: "Routing logic",
  client: "Client-side code",
  server: "Server-side code",
  benchmarks: "Performance benchmarks",
  examples: "Example code",
  templates: "Template files",
  i18n: "Internationalization",
  locales: "Locale files",
  dags: "Airflow DAG definitions",
  pipelines: "Data pipelines",
  etl: "ETL jobs",
  sql: "SQL queries / scripts",
  queries: "SQL queries",
  macros: "dbt macros / reusable SQL",
  seeds: "dbt seed data (CSV)",
  snapshots: "dbt snapshots",
  analyses: "dbt ad-hoc analyses",
  transforms: "Data transformations",
  warehouse: "Data warehouse definitions",
  staging: "Staging layer models",
  marts: "Data mart models",
  raw: "Raw data ingestion",
  alembic: "Alembic migration scripts",
  notebooks: "Jupyter / data notebooks",
  data: "Data files",
  jobs: "Scheduled jobs / tasks",
  connectors: "Data source connectors",
};

/**
 * Renders format-agnostic core content from analysis results.
 * If llmContent is provided, returns it directly.
 * Otherwise, renders from static analysis.
 */
export function renderCoreContent(
  analysis: AnalysisResult,
  llmContent: string | null,
  subfolderPath?: string
): string {
  if (llmContent) {
    return llmContent.trim();
  }
  return renderStaticContent(analysis, subfolderPath);
}

/**
 * Legacy wrapper: renders AGENTS.md with header/footer.
 * Used by tests and backward-compat code paths.
 */
export function renderMarkdown(
  analysis: AnalysisResult,
  llmContent: string | null,
  subfolderPath?: string
): string {
  const core = renderCoreContent(analysis, llmContent, subfolderPath);
  return core;
}

function renderStaticContent(
  analysis: AnalysisResult,
  subfolderPath?: string
): string {
  const lines: string[] = [];

  // Project Context
  lines.push("## Project Context");
  lines.push("");
  if (analysis.languages.length > 0) {
    const primary = analysis.languages[0].name;
    const frameworks = analysis.frameworks
      .filter((f) => f.category === "web" || f.category === "api")
      .map((f) => f.name);
    const extras: string[] = [];
    if (analysis.patterns.hasMonorepo) extras.push("monorepo");
    if (analysis.patterns.fileOrganization !== "flat") {
      extras.push(`${analysis.patterns.fileOrganization} architecture`);
    }
    const suffix = extras.length > 0 ? ` Uses ${extras.join(", ")}.` : "";

    if (frameworks.length > 0) {
      lines.push(
        `A ${primary} project using ${frameworks.join(", ")}. ` +
          `Contains ${analysis.structure.totalFiles} files across ${analysis.structure.totalDirs} directories.${suffix}`
      );
    } else {
      lines.push(
        `A ${primary} project with ${analysis.structure.totalFiles} files across ${analysis.structure.totalDirs} directories.${suffix}`
      );
    }
  } else {
    lines.push("Project details could not be determined from static analysis alone.");
  }
  lines.push("");

  // Stack
  lines.push("## Stack");
  lines.push("");
  if (analysis.languages.length > 0) {
    lines.push("**Languages:**");
    for (const lang of analysis.languages.slice(0, 5)) {
      lines.push(`- ${lang.name} (${lang.percentage}%)`);
    }
    lines.push("");
  }
  if (analysis.frameworks.length > 0) {
    lines.push("**Frameworks & Tools:**");
    for (const fw of analysis.frameworks) {
      lines.push(`- ${fw.name} (${fw.category})`);
    }
    lines.push("");
  }

  // Commands
  lines.push("## Commands");
  lines.push("");
  if (analysis.commands.length > 0) {
    lines.push("```bash");
    for (const cmd of analysis.commands) {
      lines.push(`${cmd.command}  # ${cmd.name}`);
    }
    lines.push("```");
  } else {
    lines.push("No commands detected. Check project documentation for build/run instructions.");
  }
  lines.push("");

  // Conventions
  lines.push("## Conventions");
  lines.push("");
  lines.push(`- **Naming**: ${analysis.patterns.namingConvention}`);
  lines.push(`- **File organization**: ${analysis.patterns.fileOrganization}`);
  if (analysis.patterns.hasMonorepo) {
    lines.push("- **Monorepo**: Yes");
  }
  if (analysis.patterns.configFiles.length > 0) {
    lines.push(`- **Config files**: ${analysis.patterns.configFiles.join(", ")}`);
  }
  if (analysis.patterns.ciFiles.length > 0) {
    lines.push(`- **CI/CD**: ${analysis.patterns.ciFiles.join(", ")}`);
  }
  lines.push("");

  // Architecture
  lines.push("## Architecture");
  lines.push("");
  if (analysis.structure.entryPoints.length > 0) {
    lines.push(`**Entry points:** ${analysis.structure.entryPoints.join(", ")}`);
    lines.push("");
  }
  lines.push("**Key directories:**");
  const topDirs = analysis.structure.tree
    .filter((e) => e.type === "directory" && e.depth === 0)
    .slice(0, 15);
  for (const dir of topDirs) {
    const dirName = dir.path.replace(/\/$/, "");
    const desc = DIR_DESCRIPTIONS[dirName];
    if (desc) {
      lines.push(`- \`${dirName}/\` - ${desc}`);
    } else {
      lines.push(`- \`${dirName}/\``);
    }
  }
  lines.push("");

  // Boundaries
  lines.push("## Boundaries");
  lines.push("");
  lines.push("**Always:**");

  const testCmd = analysis.commands.find((c) => c.name === "test");
  if (testCmd) {
    lines.push(`- Run \`${testCmd.command}\` before committing changes`);
  } else {
    lines.push("- Run existing tests before committing changes");
  }

  const lintCmd = analysis.commands.find(
    (c) => c.name === "lint" || c.name === "check" || c.name === "typecheck"
  );
  if (lintCmd) {
    lines.push(`- Run \`${lintCmd.command}\` before committing`);
  }

  lines.push(`- Follow ${analysis.patterns.namingConvention} naming convention`);
  lines.push(`- Follow ${analysis.patterns.fileOrganization} file organization`);
  lines.push("");

  lines.push("**Ask first:**");
  lines.push("- Adding new dependencies");
  lines.push("- Changing project configuration files");
  if (analysis.patterns.ciFiles.length > 0) {
    lines.push("- Modifying CI/CD pipelines");
  }
  if (analysis.patterns.hasMonorepo) {
    lines.push("- Adding new packages/workspaces");
  }
  lines.push("");

  lines.push("**Never:**");
  lines.push("- Commit secrets, API keys, or .env files");
  lines.push("- Delete or overwrite test files without understanding them");
  lines.push("- Force push to main/master branch");
  if (analysis.patterns.hasMonorepo) {
    lines.push("- Make cross-package changes without checking downstream effects");
  }

  return lines.join("\n");
}
