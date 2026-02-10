import { describe, it, expect } from "vitest";
import * as path from "node:path";
import { analyze } from "../../src/analyzer";
import { loadConfig } from "../../src/config/loader";
import { renderMarkdown } from "../../src/generator/markdown-renderer";

const FIXTURES = path.resolve(__dirname, "../fixtures");

describe("init command (no-llm mode)", () => {
  it("generates valid AGENTS.md for node project", async () => {
    const rootDir = path.join(FIXTURES, "node-project");
    const config = await loadConfig(rootDir, { noLlm: true });
    const analysis = await analyze(rootDir, config);
    const md = renderMarkdown(analysis, null);

    // Should have all 6 sections
    expect(md).toContain("## Project Context");
    expect(md).toContain("## Stack");
    expect(md).toContain("## Commands");
    expect(md).toContain("## Conventions");
    expect(md).toContain("## Architecture");
    expect(md).toContain("## Boundaries");

    // Should detect TypeScript
    expect(md).toContain("TypeScript");

    // Should detect React
    expect(md).toContain("React");

    // Should have build/test commands
    expect(md).toContain("npm run build");
    expect(md).toContain("npm run test");
  });

  it("generates valid AGENTS.md for python project", async () => {
    const rootDir = path.join(FIXTURES, "python-project");
    const config = await loadConfig(rootDir, { noLlm: true });
    const analysis = await analyze(rootDir, config);
    const md = renderMarkdown(analysis, null);

    expect(md).toContain("## Project Context");
    expect(md).toContain("Python");
  });

  it("generates valid AGENTS.md for monorepo", async () => {
    const rootDir = path.join(FIXTURES, "monorepo");
    const config = await loadConfig(rootDir, { noLlm: true });
    const analysis = await analyze(rootDir, config);
    const md = renderMarkdown(analysis, null);

    expect(md).toContain("## Project Context");
    expect(md).toContain("Monorepo");
  });

  it("generates AGENTS.md for data-etl-project with Dagster and Alembic commands", async () => {
    const rootDir = path.join(FIXTURES, "data-etl-project");
    const config = await loadConfig(rootDir, { noLlm: true });
    const analysis = await analyze(rootDir, config);
    const md = renderMarkdown(analysis, null);

    expect(md).toContain("## Stack");
    expect(md).toContain("## Commands");

    // Should detect data/ETL frameworks
    expect(md).toContain("Dagster");
    expect(md).toContain("Snowflake");

    // Should have uv run prefix on commands
    expect(md).toContain("uv run dagster dev");
    expect(md).toContain("uv run alembic upgrade head");

    // dbt commands should also be present
    expect(md).toContain("dbt run");
  });

  it("generates AGENTS.md for mlops-project with MLflow and DVC commands", async () => {
    const rootDir = path.join(FIXTURES, "mlops-project");
    const config = await loadConfig(rootDir, { noLlm: true });
    const analysis = await analyze(rootDir, config);
    const md = renderMarkdown(analysis, null);

    expect(md).toContain("## Stack");
    expect(md).toContain("## Commands");

    // Should detect MLOps frameworks
    expect(md).toContain("MLflow");
    expect(md).toContain("DVC");

    // Should have poetry run prefix on commands
    expect(md).toContain("poetry run mlflow ui");
    expect(md).toContain("poetry run dvc repro");
  });
});
