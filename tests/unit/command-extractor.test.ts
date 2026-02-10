import { describe, it, expect } from "vitest";
import * as path from "node:path";
import { extractCommands, detectPythonPackageManager, hasPythonDep } from "../../src/analyzer/command-extractor";

const FIXTURES = path.resolve(__dirname, "../fixtures");

describe("extractCommands", () => {
  it("extracts npm scripts from package.json", async () => {
    const commands = await extractCommands(
      path.join(FIXTURES, "node-project")
    );

    const names = commands.map((c) => c.name);
    expect(names).toContain("dev");
    expect(names).toContain("build");
    expect(names).toContain("test");
    expect(names).toContain("lint");
  });

  it("uses npm run prefix by default", async () => {
    const commands = await extractCommands(
      path.join(FIXTURES, "node-project")
    );

    const build = commands.find((c) => c.name === "build");
    expect(build).toBeDefined();
    expect(build!.command).toBe("npm run build");
    expect(build!.source).toBe("package.json scripts");
  });

  it("extracts pytest command from python project", async () => {
    const commands = await extractCommands(
      path.join(FIXTURES, "python-project")
    );

    const test = commands.find((c) => c.command === "pytest");
    expect(test).toBeDefined();
  });

  // --- Data / ETL / MLOps / Streaming command tests ---

  it("extracts Dagster commands with uv prefix", async () => {
    const commands = await extractCommands(
      path.join(FIXTURES, "data-etl-project")
    );

    const dev = commands.find((c) => c.source === "Dagster" && c.name === "dev");
    expect(dev).toBeDefined();
    expect(dev!.command).toBe("uv run dagster dev");

    const jobExec = commands.find((c) => c.source === "Dagster" && c.name === "job-execute");
    expect(jobExec).toBeDefined();
    expect(jobExec!.command).toBe("uv run dagster job execute");
  });

  it("extracts Alembic commands with uv prefix", async () => {
    const commands = await extractCommands(
      path.join(FIXTURES, "data-etl-project")
    );

    const upgrade = commands.find((c) => c.source === "Alembic" && c.name === "upgrade");
    expect(upgrade).toBeDefined();
    expect(upgrade!.command).toBe("uv run alembic upgrade head");

    const revision = commands.find((c) => c.source === "Alembic" && c.name === "revision");
    expect(revision).toBeDefined();
    expect(revision!.command).toBe("uv run alembic revision --autogenerate");
  });

  it("extracts Great Expectations commands with uv prefix", async () => {
    const commands = await extractCommands(
      path.join(FIXTURES, "data-etl-project")
    );

    const init = commands.find((c) => c.source === "Great Expectations" && c.name === "init");
    expect(init).toBeDefined();
    expect(init!.command).toBe("uv run great_expectations init");

    const docsBuild = commands.find((c) => c.source === "Great Expectations" && c.name === "docs-build");
    expect(docsBuild).toBeDefined();
    expect(docsBuild!.command).toBe("uv run great_expectations docs build");
  });

  it("extracts MLflow commands with poetry prefix", async () => {
    const commands = await extractCommands(
      path.join(FIXTURES, "mlops-project")
    );

    const ui = commands.find((c) => c.source === "MLflow" && c.name === "ui");
    expect(ui).toBeDefined();
    expect(ui!.command).toBe("poetry run mlflow ui");

    const run = commands.find((c) => c.source === "MLflow" && c.name === "run");
    expect(run).toBeDefined();
    expect(run!.command).toBe("poetry run mlflow run .");
  });

  it("extracts DVC commands with poetry prefix", async () => {
    const commands = await extractCommands(
      path.join(FIXTURES, "mlops-project")
    );

    const repro = commands.find((c) => c.source === "DVC" && c.name === "repro");
    expect(repro).toBeDefined();
    expect(repro!.command).toBe("poetry run dvc repro");

    const dag = commands.find((c) => c.source === "DVC" && c.name === "dag");
    expect(dag).toBeDefined();
    expect(dag!.command).toBe("poetry run dvc dag");
  });

  it("extracts Spark commands with poetry prefix", async () => {
    const commands = await extractCommands(
      path.join(FIXTURES, "mlops-project")
    );

    const submit = commands.find((c) => c.source === "Spark" && c.name === "spark-submit");
    expect(submit).toBeDefined();
    expect(submit!.command).toBe("poetry run spark-submit app.py");

    const pyspark = commands.find((c) => c.source === "Spark" && c.name === "pyspark");
    expect(pyspark).toBeDefined();
    expect(pyspark!.command).toBe("poetry run pyspark");
  });

  it("extracts Prefect commands with pipenv prefix", async () => {
    const commands = await extractCommands(
      path.join(FIXTURES, "streaming-project")
    );

    const server = commands.find((c) => c.source === "Prefect" && c.name === "server-start");
    expect(server).toBeDefined();
    expect(server!.command).toBe("pipenv run prefect server start");

    const deploy = commands.find((c) => c.source === "Prefect" && c.name === "deploy");
    expect(deploy).toBeDefined();
    expect(deploy!.command).toBe("pipenv run prefect deploy");
  });

  it("extracts Jupyter commands with pipenv prefix", async () => {
    const commands = await extractCommands(
      path.join(FIXTURES, "streaming-project")
    );

    const lab = commands.find((c) => c.source === "Jupyter" && c.name === "lab");
    expect(lab).toBeDefined();
    expect(lab!.command).toBe("pipenv run jupyter lab");

    const notebook = commands.find((c) => c.source === "Jupyter" && c.name === "notebook");
    expect(notebook).toBeDefined();
    expect(notebook!.command).toBe("pipenv run jupyter notebook");
  });

  it("dbt commands still work alongside new extractors", async () => {
    const commands = await extractCommands(
      path.join(FIXTURES, "data-etl-project")
    );

    const dbtRun = commands.find((c) => c.source === "dbt" && c.name === "run");
    expect(dbtRun).toBeDefined();
    expect(dbtRun!.command).toBe("dbt run");

    const dbtTest = commands.find((c) => c.source === "dbt" && c.name === "test");
    expect(dbtTest).toBeDefined();
  });
});

describe("detectPythonPackageManager", () => {
  it("detects uv", () => {
    expect(detectPythonPackageManager(path.join(FIXTURES, "data-etl-project"))).toBe("uv run ");
  });

  it("detects poetry", () => {
    expect(detectPythonPackageManager(path.join(FIXTURES, "mlops-project"))).toBe("poetry run ");
  });

  it("detects pipenv", () => {
    expect(detectPythonPackageManager(path.join(FIXTURES, "streaming-project"))).toBe("pipenv run ");
  });

  it("returns empty for plain projects", () => {
    expect(detectPythonPackageManager(path.join(FIXTURES, "python-project"))).toBe("");
  });
});
