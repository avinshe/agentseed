import * as path from "node:path";
import { parse } from "smol-toml";
import { fileExists, readFileSync } from "./fs";

export function parseTOML(filePath: string): Record<string, unknown> | null {
  if (!fileExists(filePath)) return null;
  try {
    return parse(readFileSync(filePath)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function loadPyprojectToml(rootDir: string): Record<string, unknown> | null {
  return parseTOML(path.join(rootDir, "pyproject.toml"));
}

export function loadSetupCfg(rootDir: string): string | null {
  const p = path.join(rootDir, "setup.cfg");
  if (!fileExists(p)) return null;
  try {
    return readFileSync(p);
  } catch {
    return null;
  }
}
