import * as fs from "node:fs";
import * as path from "node:path";

export function fileExists(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

export function dirExists(dirPath: string): boolean {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

export function readFileSync(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}

export function writeFileSync(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, "utf-8");
}

export function readJsonSync<T = unknown>(filePath: string): T {
  const content = readFileSync(filePath);
  return JSON.parse(content) as T;
}

export function resolveFromRoot(rootDir: string, ...segments: string[]): string {
  return path.resolve(rootDir, ...segments);
}
