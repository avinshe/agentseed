import * as path from "node:path";
import type { CommandInfo } from "./types";
import { fileExists, readFileSync } from "../utils/fs";
import { loadPyprojectToml } from "../utils/toml";

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
  commands.push(...extractFromDagster(rootDir));
  commands.push(...extractFromPrefect(rootDir));
  commands.push(...extractFromSpark(rootDir));
  commands.push(...extractFromAlembic(rootDir));
  commands.push(...extractFromGreatExpectations(rootDir));
  commands.push(...extractFromMLflow(rootDir));
  commands.push(...extractFromDVC(rootDir));
  commands.push(...extractFromJupyter(rootDir));

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

export function detectPythonPackageManager(rootDir: string): string {
  if (fileExists(path.join(rootDir, "uv.lock"))) return "uv run ";
  if (fileExists(path.join(rootDir, "poetry.lock"))) return "poetry run ";
  if (fileExists(path.join(rootDir, "Pipfile.lock"))) return "pipenv run ";
  if (fileExists(path.join(rootDir, "pdm.lock"))) return "pdm run ";
  return "";
}

function extractFromPyproject(rootDir: string): CommandInfo[] {
  const pyprojectPath = path.join(rootDir, "pyproject.toml");
  const hasPyproject = fileExists(pyprojectPath);
  const hasManagePy = fileExists(path.join(rootDir, "manage.py"));

  // Need at least one Python indicator
  if (!hasPyproject && !hasManagePy) return [];

  const prefix = detectPythonPackageManager(rootDir);
  const commands: CommandInfo[] = [];
  const pyproject = hasPyproject ? loadPyprojectToml(rootDir) : null;

  // Django commands from manage.py
  if (hasManagePy) {
    commands.push({ name: "runserver", command: `${prefix}python manage.py runserver`, source: "Django" });
    commands.push({ name: "test", command: `${prefix}python manage.py test`, source: "Django" });
    commands.push({ name: "migrate", command: `${prefix}python manage.py migrate`, source: "Django" });
  }

  // pytest detection
  const tool = (pyproject?.tool ?? {}) as Record<string, unknown>;
  if (fileExists(path.join(rootDir, "pytest.ini")) || tool.pytest) {
    commands.push({ name: "test", command: `${prefix}pytest`, source: "pytest" });
  }

  if (!pyproject) return commands;

  // PEP 621 [project.scripts]
  const project = pyproject.project as Record<string, unknown> | undefined;
  const projectScripts = project?.scripts as Record<string, string> | undefined;
  if (projectScripts) {
    for (const [name, entry] of Object.entries(projectScripts)) {
      commands.push({ name, command: `${prefix}${name}`, source: "project.scripts" });
    }
  }

  // Poetry [tool.poetry.scripts]
  const poetry = tool.poetry as Record<string, unknown> | undefined;
  const poetryScripts = poetry?.scripts as Record<string, string> | undefined;
  if (poetryScripts) {
    for (const [name, entry] of Object.entries(poetryScripts)) {
      commands.push({ name, command: `${prefix}${name}`, source: "tool.poetry.scripts" });
    }
  }

  // Poethepoet [tool.poe.tasks]
  const poe = tool.poe as Record<string, unknown> | undefined;
  const poeTasks = poe?.tasks as Record<string, unknown> | undefined;
  if (poeTasks) {
    for (const name of Object.keys(poeTasks)) {
      commands.push({ name, command: `${prefix}poe ${name}`, source: "tool.poe.tasks" });
    }
  }

  // Hatch [tool.hatch.envs.default.scripts]
  const hatch = tool.hatch as Record<string, unknown> | undefined;
  const hatchEnvs = hatch?.envs as Record<string, unknown> | undefined;
  const hatchDefault = hatchEnvs?.default as Record<string, unknown> | undefined;
  const hatchScripts = hatchDefault?.scripts as Record<string, unknown> | undefined;
  if (hatchScripts) {
    for (const name of Object.keys(hatchScripts)) {
      commands.push({ name, command: `${prefix}hatch run ${name}`, source: "tool.hatch.envs.default.scripts" });
    }
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

export function hasPythonDep(rootDir: string, pkg: string): boolean {
  const reqPath = path.join(rootDir, "requirements.txt");
  if (fileExists(reqPath)) {
    const content = readFileSync(reqPath);
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("-")) continue;
      const match = trimmed.match(/^([A-Za-z0-9_.-]+)/);
      if (match && match[1].toLowerCase() === pkg.toLowerCase()) return true;
    }
  }

  const pyproject = loadPyprojectToml(rootDir);
  if (pyproject) {
    const project = pyproject.project as Record<string, unknown> | undefined;
    if (project?.dependencies && Array.isArray(project.dependencies)) {
      for (const dep of project.dependencies) {
        const match = String(dep).trim().match(/^([A-Za-z0-9_.-]+)/);
        if (match && match[1].toLowerCase() === pkg.toLowerCase()) return true;
      }
    }
  }

  return false;
}

function extractFromDagster(rootDir: string): CommandInfo[] {
  const hasDagster =
    hasPythonDep(rootDir, "dagster") ||
    fileExists(path.join(rootDir, "workspace.yaml")) ||
    fileExists(path.join(rootDir, "dagster.yaml"));

  if (!hasDagster) return [];

  const prefix = detectPythonPackageManager(rootDir);
  return [
    { name: "dev", command: `${prefix}dagster dev`, source: "Dagster" },
    { name: "job-execute", command: `${prefix}dagster job execute`, source: "Dagster" },
    { name: "asset-materialize", command: `${prefix}dagster asset materialize`, source: "Dagster" },
  ];
}

function extractFromPrefect(rootDir: string): CommandInfo[] {
  if (!hasPythonDep(rootDir, "prefect")) return [];

  const prefix = detectPythonPackageManager(rootDir);
  return [
    { name: "server-start", command: `${prefix}prefect server start`, source: "Prefect" },
    { name: "deploy", command: `${prefix}prefect deploy`, source: "Prefect" },
    { name: "flow-run-create", command: `${prefix}prefect flow-run create`, source: "Prefect" },
  ];
}

function extractFromSpark(rootDir: string): CommandInfo[] {
  if (!hasPythonDep(rootDir, "pyspark")) return [];

  const prefix = detectPythonPackageManager(rootDir);
  return [
    { name: "spark-submit", command: `${prefix}spark-submit app.py`, source: "Spark" },
    { name: "pyspark", command: `${prefix}pyspark`, source: "Spark" },
  ];
}

function extractFromAlembic(rootDir: string): CommandInfo[] {
  const hasAlembic =
    fileExists(path.join(rootDir, "alembic.ini")) ||
    fileExists(path.join(rootDir, "alembic"));

  if (!hasAlembic) return [];

  const prefix = detectPythonPackageManager(rootDir);
  return [
    { name: "upgrade", command: `${prefix}alembic upgrade head`, source: "Alembic" },
    { name: "downgrade", command: `${prefix}alembic downgrade -1`, source: "Alembic" },
    { name: "revision", command: `${prefix}alembic revision --autogenerate`, source: "Alembic" },
    { name: "history", command: `${prefix}alembic history`, source: "Alembic" },
    { name: "current", command: `${prefix}alembic current`, source: "Alembic" },
  ];
}

function extractFromGreatExpectations(rootDir: string): CommandInfo[] {
  const hasGE =
    fileExists(path.join(rootDir, "great_expectations")) ||
    hasPythonDep(rootDir, "great-expectations");

  if (!hasGE) return [];

  const prefix = detectPythonPackageManager(rootDir);
  return [
    { name: "init", command: `${prefix}great_expectations init`, source: "Great Expectations" },
    { name: "suite-new", command: `${prefix}great_expectations suite new`, source: "Great Expectations" },
    { name: "checkpoint-run", command: `${prefix}great_expectations checkpoint run`, source: "Great Expectations" },
    { name: "docs-build", command: `${prefix}great_expectations docs build`, source: "Great Expectations" },
  ];
}

function extractFromMLflow(rootDir: string): CommandInfo[] {
  const hasMLflow =
    fileExists(path.join(rootDir, "MLproject")) ||
    fileExists(path.join(rootDir, "mlruns")) ||
    hasPythonDep(rootDir, "mlflow");

  if (!hasMLflow) return [];

  const prefix = detectPythonPackageManager(rootDir);
  return [
    { name: "ui", command: `${prefix}mlflow ui`, source: "MLflow" },
    { name: "run", command: `${prefix}mlflow run .`, source: "MLflow" },
    { name: "serve", command: `${prefix}mlflow models serve -m <model_uri>`, source: "MLflow" },
  ];
}

function extractFromDVC(rootDir: string): CommandInfo[] {
  const hasDVC =
    fileExists(path.join(rootDir, ".dvc")) ||
    fileExists(path.join(rootDir, "dvc.yaml"));

  if (!hasDVC) return [];

  const prefix = detectPythonPackageManager(rootDir);
  return [
    { name: "repro", command: `${prefix}dvc repro`, source: "DVC" },
    { name: "push", command: `${prefix}dvc push`, source: "DVC" },
    { name: "pull", command: `${prefix}dvc pull`, source: "DVC" },
    { name: "dag", command: `${prefix}dvc dag`, source: "DVC" },
  ];
}

function extractFromJupyter(rootDir: string): CommandInfo[] {
  const hasJupyter =
    fileExists(path.join(rootDir, "notebooks")) ||
    hasPythonDep(rootDir, "jupyter") ||
    hasPythonDep(rootDir, "jupyterlab");

  if (!hasJupyter) return [];

  const prefix = detectPythonPackageManager(rootDir);
  return [
    { name: "lab", command: `${prefix}jupyter lab`, source: "Jupyter" },
    { name: "notebook", command: `${prefix}jupyter notebook`, source: "Jupyter" },
  ];
}
