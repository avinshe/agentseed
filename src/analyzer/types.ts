export interface LanguageInfo {
  name: string;
  percentage: number;
  fileCount: number;
}

export interface FrameworkInfo {
  name: string;
  category: "web" | "api" | "testing" | "build" | "orm" | "data" | "etl" | "other";
  confidence: number;
}

export interface CommandInfo {
  name: string;
  command: string;
  source: string; // e.g. "package.json scripts", "Makefile"
}

export interface DirectoryEntry {
  path: string;
  type: "file" | "directory";
  depth: number;
}

export interface StructureInfo {
  totalFiles: number;
  totalDirs: number;
  tree: DirectoryEntry[];
  entryPoints: string[];
}

export interface PatternInfo {
  namingConvention: "camelCase" | "snake_case" | "kebab-case" | "PascalCase" | "mixed";
  fileOrganization: string; // e.g. "feature-based", "layer-based"
  hasMonorepo: boolean;
  configFiles: string[];
  ciFiles: string[];
}

export interface SampledFile {
  path: string;
  content: string;
  priority: "entry" | "config" | "source" | "test";
  sizeBytes: number;
}

export interface AnalysisResult {
  languages: LanguageInfo[];
  frameworks: FrameworkInfo[];
  commands: CommandInfo[];
  structure: StructureInfo;
  patterns: PatternInfo;
  sampledFiles: SampledFile[];
}
