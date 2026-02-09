import type { AnalysisResult } from "../analyzer/types";
import type { OutputFormat } from "./formats";
import { buildMetaTag, type FileMeta } from "../utils/git";

/**
 * Renders LLM-generated or static content into tool-specific formats.
 * Each format wraps the same core content with tool-specific conventions.
 * Optionally embeds a metadata tag for incremental update tracking.
 */
export function renderForFormat(
  format: Exclude<OutputFormat, "all">,
  analysis: AnalysisResult,
  coreContent: string,
  subfolderPath?: string,
  meta?: FileMeta
): string {
  let output: string;
  switch (format) {
    case "agents":
      output = renderAgentsMd(coreContent, subfolderPath);
      break;
    case "claude":
      output = renderClaudeMd(coreContent, analysis, subfolderPath);
      break;
    case "cursor":
      output = renderCursorRules(coreContent, analysis);
      break;
    case "copilot":
      output = renderCopilotInstructions(coreContent, analysis);
      break;
    case "windsurf":
      output = renderWindsurfRules(coreContent, analysis);
      break;
  }

  // Append metadata tag for incremental update tracking
  if (meta) {
    output = output.trimEnd() + "\n\n" + buildMetaTag(meta) + "\n";
  }

  return output;
}

// --- AGENTS.md (universal) ---
function renderAgentsMd(content: string, subfolderPath?: string): string {
  const lines: string[] = [];
  if (subfolderPath) {
    lines.push(`> Scoped context for \`${subfolderPath}\`. See root AGENTS.md for general project info.`);
    lines.push("");
  }
  lines.push(content.trim());
  lines.push("");
  return lines.join("\n");
}

// --- CLAUDE.md ---
// Claude Code reads CLAUDE.md automatically. Supports full markdown.
// Best practices: keep under 300 lines, be specific, use code blocks for commands.
function renderClaudeMd(
  content: string,
  analysis: AnalysisResult,
  subfolderPath?: string
): string {
  const lines: string[] = [];

  if (subfolderPath) {
    lines.push(`> Context for \`${subfolderPath}\`. See root CLAUDE.md for general rules.`);
    lines.push("");
  }

  lines.push(content.trim());
  lines.push("");

  // Claude Code benefits from explicit command blocks
  if (analysis.commands.length > 0) {
    // Check if Commands section already exists in content
    if (!content.includes("## Commands")) {
      lines.push("## Quick Reference Commands");
      lines.push("");
      lines.push("```bash");
      for (const cmd of analysis.commands.slice(0, 8)) {
        lines.push(`${cmd.command}  # ${cmd.name}`);
      }
      lines.push("```");
      lines.push("");
    }
  }

  return lines.join("\n");
}

// --- .cursorrules ---
// Cursor: plain text instructions. Concise rules format.
// Focus on do/don't rules, conventions, and preferences.
function renderCursorRules(
  content: string,
  analysis: AnalysisResult
): string {
  const lines: string[] = [];

  lines.push("# Project Rules");
  lines.push("");

  // Extract and reformat for Cursor's rule-oriented style
  lines.push(content.trim());
  lines.push("");

  // Add explicit technology context that Cursor uses for completions
  if (analysis.frameworks.length > 0) {
    const techList = analysis.frameworks.map((f) => f.name).join(", ");
    if (!content.includes("## Stack") && !content.includes("## Tech")) {
      lines.push("## Tech Stack Context");
      lines.push("");
      lines.push(`This project uses: ${techList}`);
      lines.push("");
    }
  }

  return lines.join("\n");
}

// --- .github/copilot-instructions.md ---
// GitHub Copilot: markdown, max ~4000 chars recommended.
// Each instruction should be a self-contained statement.
function renderCopilotInstructions(
  content: string,
  analysis: AnalysisResult
): string {
  const lines: string[] = [];

  lines.push("<!-- GitHub Copilot Custom Instructions -->");
  lines.push("<!-- See: https://docs.github.com/copilot/customizing-copilot -->");
  lines.push("");
  lines.push(content.trim());
  lines.push("");

  return lines.join("\n");
}

// --- .windsurfrules ---
// Windsurf: plain markdown, max 12,000 chars.
// Supports XML-style tags for grouping.
function renderWindsurfRules(
  content: string,
  analysis: AnalysisResult
): string {
  const lines: string[] = [];

  lines.push(content.trim());
  lines.push("");

  return lines.join("\n");
}
