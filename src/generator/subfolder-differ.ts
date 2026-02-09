import type { AnalysisResult } from "../analyzer/types";

/**
 * Computes the delta between root analysis and subfolder analysis.
 * Returns a modified AnalysisResult that only contains sections that differ.
 */
export function computeSubfolderDelta(
  root: AnalysisResult,
  subfolder: AnalysisResult
): AnalysisResult {
  const rootLangs = new Set(root.languages.map((l) => l.name));
  const rootFws = new Set(root.frameworks.map((f) => f.name));
  const rootCmds = new Set(root.commands.map((c) => c.command));

  // Only include languages not dominant in root
  const diffLanguages = subfolder.languages.filter(
    (l) => !rootLangs.has(l.name) || l.percentage > 50
  );

  // Only include frameworks not already in root
  const diffFrameworks = subfolder.frameworks.filter(
    (f) => !rootFws.has(f.name)
  );

  // Only include commands not in root
  const diffCommands = subfolder.commands.filter(
    (c) => !rootCmds.has(c.command)
  );

  return {
    languages: diffLanguages.length > 0 ? diffLanguages : subfolder.languages,
    frameworks: diffFrameworks,
    commands: diffCommands,
    structure: subfolder.structure,
    patterns: subfolder.patterns,
    sampledFiles: subfolder.sampledFiles,
  };
}
