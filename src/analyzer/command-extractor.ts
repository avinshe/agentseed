import * as path from "node:path";
import type { CommandInfo } from "./types";
import { fileExists, readFileSync } from "../utils/fs";

export async function extractCommands(
  rootDir: string
): Promise<CommandInfo[]> {
  const commands: CommandInfo[] = [];

  commands.push(...extractFromPackageJson(rootDir));
  commands.push(...extractFromMakefile(rootDir));
  commands.push(...extractFromPyproject(rootDir));
  commands.push(...extractFromCargoToml(rootDir));
  commands.push(...extractFromDbt(rootDir));
  commands.push(...extractFromAirflow(rootDir));

  return commands;
}

function extractFromPackageJson(rootDir: string): CommandInfo[] {
  const pkgPath = path.join(rootDir, "package.json");
  if (!fileExists(pkgPath)) return [];

  try {
    const pkg = JSON.parse(readFileSync(pkgPath));
    const scripts = pkg.scripts as Record<string, string> | undefined;
    if (!scripts) return [];

    const important = [
      "dev", "start", "build", "test", "lint", "format",
      "preview", "serve", "watch", "check", "typecheck",
      "e2e", "test:unit", "test:e2e", "test:watch",
    ];

    const commands: CommandInfo[] = [];
    for (const [name, cmd] of Object.entries(scripts)) {
      if (important.includes(name) || name.startsWith("test") || name.startsWith("build")) {
        commands.push({
          name,
          command: `npm run ${name}`,
          source: "package.json scripts",
        });
      }
    }

    // Also check for package manager
    if (fileExists(path.join(rootDir, "pnpm-lock.yaml"))) {
      commands.forEach((c) => (c.command = c.command.replace("npm run", "pnpm")));
    } else if (fileExists(path.join(rootDir, "yarn.lock"))) {
      commands.forEach((c) => (c.command = c.command.replace("npm run", "yarn")));
    } else if (fileExists(path.join(rootDir, "bun.lockb")) || fileExists(path.join(rootDir, "bun.lock"))) {
      commands.forEach((c) => (c.command = c.command.replace("npm run", "bun run")));
    }

    return commands;
  } catch {
    return [];
  }
}

function extractFromMakefile(rootDir: string): CommandInfo[] {
  const mkPath = path.join(rootDir, "Makefile");
  if (!fileExists(mkPath)) return [];

  try {
    const content = readFileSync(mkPath);
    const commands: CommandInfo[] = [];
    const targetRegex = /^([a-zA-Z_][\w-]*):/gm;
    let match;

    while ((match = targetRegex.exec(content)) !== null) {
      const name = match[1];
      if (!name.startsWith(".") && !name.startsWith("_")) {
        commands.push({
          name,
          command: `make ${name}`,
          source: "Makefile",
        });
      }
    }

    return commands;
  } catch {
    return [];
  }
}

function extractFromPyproject(rootDir: string): CommandInfo[] {
  const pyprojectPath = path.join(rootDir, "pyproject.toml");
  if (!fileExists(pyprojectPath)) return [];

  const commands: CommandInfo[] = [];

  // Check for common Python project commands
  if (fileExists(path.join(rootDir, "manage.py"))) {
    commands.push({ name: "runserver", command: "python manage.py runserver", source: "Django" });
    commands.push({ name: "test", command: "python manage.py test", source: "Django" });
  }

  if (fileExists(path.join(rootDir, "pytest.ini")) || fileExists(pyprojectPath)) {
    commands.push({ name: "test", command: "pytest", source: "pytest" });
  }

  return commands;
}

function extractFromCargoToml(rootDir: string): CommandInfo[] {
  const cargoPath = path.join(rootDir, "Cargo.toml");
  if (!fileExists(cargoPath)) return [];

  return [
    { name: "build", command: "cargo build", source: "Cargo.toml" },
    { name: "test", command: "cargo test", source: "Cargo.toml" },
    { name: "run", command: "cargo run", source: "Cargo.toml" },
    { name: "check", command: "cargo check", source: "Cargo.toml" },
  ];
}

function extractFromDbt(rootDir: string): CommandInfo[] {
  if (!fileExists(path.join(rootDir, "dbt_project.yml"))) return [];

  return [
    { name: "run", command: "dbt run", source: "dbt" },
    { name: "test", command: "dbt test", source: "dbt" },
    { name: "build", command: "dbt build", source: "dbt" },
    { name: "compile", command: "dbt compile", source: "dbt" },
    { name: "docs", command: "dbt docs generate && dbt docs serve", source: "dbt" },
    { name: "seed", command: "dbt seed", source: "dbt" },
    { name: "snapshot", command: "dbt snapshot", source: "dbt" },
  ];
}

function extractFromAirflow(rootDir: string): CommandInfo[] {
  const hasDags =
    fileExists(path.join(rootDir, "airflow.cfg")) ||
    fileExists(path.join(rootDir, "dags"));

  if (!hasDags) return [];

  return [
    { name: "webserver", command: "airflow webserver", source: "Airflow" },
    { name: "scheduler", command: "airflow scheduler", source: "Airflow" },
    { name: "test-dag", command: "airflow dags test <dag_id>", source: "Airflow" },
    { name: "list-dags", command: "airflow dags list", source: "Airflow" },
  ];
}
