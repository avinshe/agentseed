import { describe, it, expect } from "vitest";
import * as path from "node:path";
import { detectFrameworks } from "../../src/analyzer/framework-detector";

const FIXTURES = path.resolve(__dirname, "../fixtures");

describe("detectFrameworks", () => {
  it("detects React and Next.js in node project", async () => {
    const frameworks = await detectFrameworks(
      path.join(FIXTURES, "node-project")
    );

    const names = frameworks.map((f) => f.name);
    expect(names).toContain("React");
    expect(names).toContain("Next.js");
  });

  it("detects Vitest in node project", async () => {
    const frameworks = await detectFrameworks(
      path.join(FIXTURES, "node-project")
    );

    const vitest = frameworks.find((f) => f.name === "Vitest");
    expect(vitest).toBeDefined();
    expect(vitest!.category).toBe("testing");
  });

  it("detects Flask in python project", async () => {
    const frameworks = await detectFrameworks(
      path.join(FIXTURES, "python-project")
    );

    const flask = frameworks.find((f) => f.name === "Flask");
    expect(flask).toBeDefined();
    expect(flask!.category).toBe("api");
  });

  it("detects Express in monorepo api package", async () => {
    const frameworks = await detectFrameworks(
      path.join(FIXTURES, "monorepo/packages/api")
    );

    const express = frameworks.find((f) => f.name === "Express");
    expect(express).toBeDefined();
  });

  // --- Data / ETL / MLOps / Streaming tests ---

  it("detects Dagster, Snowflake, and Great Expectations from data-etl-project", async () => {
    const frameworks = await detectFrameworks(
      path.join(FIXTURES, "data-etl-project")
    );

    const names = frameworks.map((f) => f.name);
    expect(names).toContain("Dagster");
    expect(names).toContain("Snowflake");
    expect(names).toContain("Great Expectations");
  });

  it("detects Alembic and dbt from data-etl-project", async () => {
    const frameworks = await detectFrameworks(
      path.join(FIXTURES, "data-etl-project")
    );

    const names = frameworks.map((f) => f.name);
    expect(names).toContain("Alembic");
    expect(names).toContain("dbt");
  });

  it("detects MLflow, DVC, and Weights & Biases from mlops-project", async () => {
    const frameworks = await detectFrameworks(
      path.join(FIXTURES, "mlops-project")
    );

    const names = frameworks.map((f) => f.name);
    expect(names).toContain("MLflow");
    expect(names).toContain("DVC");
    expect(names).toContain("Weights & Biases");
  });

  it("assigns 'mlops' category to MLOps frameworks", async () => {
    const frameworks = await detectFrameworks(
      path.join(FIXTURES, "mlops-project")
    );

    const mlflow = frameworks.find((f) => f.name === "MLflow");
    expect(mlflow).toBeDefined();
    expect(mlflow!.category).toBe("mlops");

    const dvc = frameworks.find((f) => f.name === "DVC");
    expect(dvc).toBeDefined();
    expect(dvc!.category).toBe("mlops");
  });

  it("detects Apache Kafka and Apache Flink from streaming-project", async () => {
    const frameworks = await detectFrameworks(
      path.join(FIXTURES, "streaming-project")
    );

    const names = frameworks.map((f) => f.name);
    expect(names).toContain("Apache Kafka");
    expect(names).toContain("Apache Flink");
  });

  it("assigns 'streaming' category to streaming frameworks", async () => {
    const frameworks = await detectFrameworks(
      path.join(FIXTURES, "streaming-project")
    );

    const kafka = frameworks.find((f) => f.name === "Apache Kafka");
    expect(kafka).toBeDefined();
    expect(kafka!.category).toBe("streaming");
  });

  it("detects Prefect, Jupyter, and Soda from streaming-project", async () => {
    const frameworks = await detectFrameworks(
      path.join(FIXTURES, "streaming-project")
    );

    const names = frameworks.map((f) => f.name);
    expect(names).toContain("Prefect");
    expect(names).toContain("Jupyter");
    expect(names).toContain("Soda");
  });

  it("detects MLflow from MLproject file and DVC from .dvc/ dir", async () => {
    const frameworks = await detectFrameworks(
      path.join(FIXTURES, "mlops-project")
    );

    // MLflow should have high confidence (both file + dep)
    const mlflow = frameworks.find((f) => f.name === "MLflow");
    expect(mlflow).toBeDefined();
    expect(mlflow!.confidence).toBeGreaterThan(0.5);

    // DVC should have high confidence (both file + dep)
    const dvc = frameworks.find((f) => f.name === "DVC");
    expect(dvc).toBeDefined();
    expect(dvc!.confidence).toBeGreaterThan(0.5);
  });
});
