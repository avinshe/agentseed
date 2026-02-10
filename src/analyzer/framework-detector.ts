import * as path from "node:path";
import type { FrameworkInfo } from "./types";
import { fileExists, readFileSync } from "../utils/fs";
import { loadPyprojectToml, loadSetupCfg, parseTOML } from "../utils/toml";

interface FrameworkSignature {
  name: string;
  category: FrameworkInfo["category"];
  indicators: {
    files?: string[];
    dependencies?: string[];
    devDependencies?: string[];
  };
}

const FRAMEWORKS: FrameworkSignature[] = [
  // Web frameworks
  { name: "Next.js", category: "web", indicators: { files: ["next.config.js", "next.config.mjs", "next.config.ts"], dependencies: ["next"] } },
  { name: "React", category: "web", indicators: { dependencies: ["react"] } },
  { name: "Vue", category: "web", indicators: { dependencies: ["vue"] } },
  { name: "Nuxt", category: "web", indicators: { files: ["nuxt.config.ts", "nuxt.config.js"], dependencies: ["nuxt"] } },
  { name: "Svelte", category: "web", indicators: { dependencies: ["svelte"] } },
  { name: "SvelteKit", category: "web", indicators: { files: ["svelte.config.js"], dependencies: ["@sveltejs/kit"] } },
  { name: "Angular", category: "web", indicators: { files: ["angular.json"], dependencies: ["@angular/core"] } },
  { name: "Astro", category: "web", indicators: { files: ["astro.config.mjs", "astro.config.ts"], dependencies: ["astro"] } },
  { name: "Remix", category: "web", indicators: { dependencies: ["@remix-run/react"] } },
  { name: "Gatsby", category: "web", indicators: { files: ["gatsby-config.js", "gatsby-config.ts"], dependencies: ["gatsby"] } },

  // API frameworks
  { name: "Express", category: "api", indicators: { dependencies: ["express"] } },
  { name: "Fastify", category: "api", indicators: { dependencies: ["fastify"] } },
  { name: "NestJS", category: "api", indicators: { dependencies: ["@nestjs/core"] } },
  { name: "Hono", category: "api", indicators: { dependencies: ["hono"] } },
  { name: "Koa", category: "api", indicators: { dependencies: ["koa"] } },
  { name: "Flask", category: "api", indicators: { files: ["app.py"], dependencies: ["flask", "Flask"] } },
  { name: "Django", category: "api", indicators: { files: ["manage.py"], dependencies: ["django", "Django"] } },
  { name: "FastAPI", category: "api", indicators: { dependencies: ["fastapi"] } },
  { name: "Spring Boot", category: "api", indicators: { files: ["pom.xml", "build.gradle"] } },

  // Testing
  { name: "Vitest", category: "testing", indicators: { devDependencies: ["vitest"] } },
  { name: "Jest", category: "testing", indicators: { devDependencies: ["jest"] } },
  { name: "Mocha", category: "testing", indicators: { devDependencies: ["mocha"] } },
  { name: "Playwright", category: "testing", indicators: { devDependencies: ["@playwright/test", "playwright"] } },
  { name: "Cypress", category: "testing", indicators: { devDependencies: ["cypress"] } },
  { name: "pytest", category: "testing", indicators: { files: ["pytest.ini", "pyproject.toml"] } },

  // Build tools
  { name: "Vite", category: "build", indicators: { files: ["vite.config.ts", "vite.config.js"], devDependencies: ["vite"] } },
  { name: "Webpack", category: "build", indicators: { files: ["webpack.config.js", "webpack.config.ts"], devDependencies: ["webpack"] } },
  { name: "tsup", category: "build", indicators: { devDependencies: ["tsup"] } },
  { name: "esbuild", category: "build", indicators: { devDependencies: ["esbuild"] } },
  { name: "Turbopack", category: "build", indicators: { files: ["turbo.json"] } },
  { name: "Rollup", category: "build", indicators: { files: ["rollup.config.js", "rollup.config.ts"], devDependencies: ["rollup"] } },

  // ORM
  { name: "Prisma", category: "orm", indicators: { files: ["prisma/schema.prisma"], dependencies: ["@prisma/client"] } },
  { name: "Drizzle", category: "orm", indicators: { dependencies: ["drizzle-orm"] } },
  { name: "TypeORM", category: "orm", indicators: { dependencies: ["typeorm"] } },
  { name: "Sequelize", category: "orm", indicators: { dependencies: ["sequelize"] } },
  { name: "SQLAlchemy", category: "orm", indicators: { dependencies: ["sqlalchemy"] } },

  // Data / ETL / Analytics
  { name: "dbt", category: "data", indicators: { files: ["dbt_project.yml"] } },
  { name: "Apache Airflow", category: "etl", indicators: { files: ["dags/", "airflow.cfg"], dependencies: ["apache-airflow", "airflow"] } },
  { name: "Dagster", category: "etl", indicators: { dependencies: ["dagster"] } },
  { name: "Prefect", category: "etl", indicators: { dependencies: ["prefect"] } },
  { name: "Luigi", category: "etl", indicators: { dependencies: ["luigi"] } },
  { name: "Apache Spark", category: "data", indicators: { dependencies: ["pyspark"] } },
  { name: "Pandas", category: "data", indicators: { dependencies: ["pandas"] } },
  { name: "Polars", category: "data", indicators: { dependencies: ["polars"] } },
  { name: "Great Expectations", category: "data", indicators: { dependencies: ["great-expectations", "great_expectations"] } },
  { name: "Alembic", category: "data", indicators: { files: ["alembic.ini", "alembic/"], dependencies: ["alembic"] } },
  { name: "Flyway", category: "data", indicators: { files: ["flyway.conf", "sql/"] } },
  { name: "Liquibase", category: "data", indicators: { files: ["liquibase.properties", "changelog.xml"] } },
  { name: "Terraform", category: "data", indicators: { files: ["main.tf", "terraform.tfvars"] } },
  { name: "Snowflake", category: "data", indicators: { dependencies: ["snowflake-connector-python", "snowflake-sqlalchemy"] } },
  { name: "DuckDB", category: "data", indicators: { dependencies: ["duckdb"] } },
  { name: "Databricks", category: "data", indicators: { dependencies: ["databricks-sdk", "databricks-connect"] } },
  { name: "Soda", category: "data", indicators: { dependencies: ["soda-core", "soda-core-pandas"] } },
  { name: "Jupyter", category: "data", indicators: { files: ["notebooks/"], dependencies: ["jupyter", "jupyterlab", "notebook"] } },
  { name: "Apache Beam", category: "etl", indicators: { dependencies: ["apache-beam"] } },
  { name: "Mage.ai", category: "etl", indicators: { dependencies: ["mage-ai"] } },
  { name: "Feast", category: "data", indicators: { files: ["feature_store.yaml"], dependencies: ["feast"] } },
  { name: "Apache Superset", category: "data", indicators: { dependencies: ["apache-superset"] } },

  // MLOps
  { name: "MLflow", category: "mlops", indicators: { files: ["MLproject", "mlruns/"], dependencies: ["mlflow"] } },
  { name: "DVC", category: "mlops", indicators: { files: ["dvc.yaml", ".dvc/"], dependencies: ["dvc"] } },
  { name: "Weights & Biases", category: "mlops", indicators: { dependencies: ["wandb"] } },

  // Streaming
  { name: "Apache Kafka", category: "streaming", indicators: { dependencies: ["confluent-kafka", "kafka-python"] } },
  { name: "Apache Flink", category: "streaming", indicators: { dependencies: ["apache-flink", "pyflink"] } },
];

export async function detectFrameworks(
  rootDir: string
): Promise<FrameworkInfo[]> {
  const detected: FrameworkInfo[] = [];
  const pkgJson = loadPackageJson(rootDir);
  const pyDeps = loadPythonDeps(rootDir);

  for (const fw of FRAMEWORKS) {
    let confidence = 0;
    const { files, dependencies, devDependencies } = fw.indicators;

    // Check for indicator files
    if (files) {
      for (const f of files) {
        if (fileExists(path.join(rootDir, f))) {
          confidence += 0.5;
          break;
        }
      }
    }

    // Check npm dependencies
    if (dependencies && pkgJson) {
      for (const dep of dependencies) {
        if (pkgJson.dependencies?.[dep] || pkgJson.devDependencies?.[dep]) {
          confidence += 0.8;
          break;
        }
      }
    }

    if (devDependencies && pkgJson) {
      for (const dep of devDependencies) {
        if (pkgJson.devDependencies?.[dep]) {
          confidence += 0.7;
          break;
        }
      }
    }

    // Check Python dependencies
    if (dependencies && pyDeps.length > 0) {
      for (const dep of dependencies) {
        if (pyDeps.includes(dep.toLowerCase())) {
          confidence += 0.8;
          break;
        }
      }
    }

    if (confidence > 0) {
      detected.push({
        name: fw.name,
        category: fw.category,
        confidence: Math.min(confidence, 1),
      });
    }
  }

  return detected.sort((a, b) => b.confidence - a.confidence);
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

function loadPackageJson(rootDir: string): PackageJson | null {
  const pkgPath = path.join(rootDir, "package.json");
  if (!fileExists(pkgPath)) return null;
  try {
    return JSON.parse(readFileSync(pkgPath));
  } catch {
    return null;
  }
}

function loadPythonDeps(rootDir: string): string[] {
  const deps = new Set<string>();

  // Helper: extract package name from a PEP 508 dependency string
  const extractName = (raw: string): string | null => {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("-")) return null;
    // Strip extras like pkg[extra], version specifiers, env markers
    const match = trimmed.match(/^([A-Za-z0-9_.-]+)/);
    return match ? match[1].toLowerCase() : null;
  };

  // 1. requirements.txt
  const reqPath = path.join(rootDir, "requirements.txt");
  if (fileExists(reqPath)) {
    for (const line of readFileSync(reqPath).split("\n")) {
      const name = extractName(line);
      if (name) deps.add(name);
    }
  }

  // 2-3. pyproject.toml (PEP 621 + Poetry)
  const pyproject = loadPyprojectToml(rootDir);
  if (pyproject) {
    // PEP 621: [project.dependencies]
    const project = pyproject.project as Record<string, unknown> | undefined;
    if (project?.dependencies && Array.isArray(project.dependencies)) {
      for (const dep of project.dependencies) {
        const name = extractName(String(dep));
        if (name) deps.add(name);
      }
    }

    // Poetry: [tool.poetry.dependencies]
    const tool = pyproject.tool as Record<string, unknown> | undefined;
    const poetry = tool?.poetry as Record<string, unknown> | undefined;
    const poetryDeps = poetry?.dependencies as Record<string, unknown> | undefined;
    if (poetryDeps) {
      for (const key of Object.keys(poetryDeps)) {
        if (key !== "python") deps.add(key.toLowerCase());
      }
    }
  }

  // 4. setup.cfg [options] install_requires
  const setupCfg = loadSetupCfg(rootDir);
  if (setupCfg) {
    const match = setupCfg.match(/install_requires\s*=\s*\n((?:[ \t]+\S.*\n?)*)/);
    if (match) {
      for (const line of match[1].split("\n")) {
        const name = extractName(line);
        if (name) deps.add(name);
      }
    }
  }

  // 5. Pipfile [packages]
  const pipfile = parseTOML(path.join(rootDir, "Pipfile"));
  if (pipfile) {
    const packages = pipfile.packages as Record<string, unknown> | undefined;
    if (packages) {
      for (const key of Object.keys(packages)) {
        deps.add(key.toLowerCase());
      }
    }
  }

  return Array.from(deps);
}
