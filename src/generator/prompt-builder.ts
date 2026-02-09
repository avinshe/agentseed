import Handlebars from "handlebars";
import * as fs from "node:fs";
import * as path from "node:path";
import type { AnalysisResult } from "../analyzer/types";

const ROOT_TEMPLATE = `You are generating an AGENTS.md file for a code repository. This file helps AI coding agents understand the project.

Based on the analysis and code samples below, generate the content for each section. Be concise and practical - focus on what an AI agent needs to know to work effectively in this codebase.

## Repository Analysis

### Languages
{{#each languages}}
- {{name}}: {{percentage}}% ({{fileCount}} files)
{{/each}}

### Frameworks & Libraries
{{#each frameworks}}
- {{name}} ({{category}}, confidence: {{confidence}})
{{/each}}

### Available Commands
{{#each commands}}
- \`{{command}}\` ({{name}}, from {{source}})
{{/each}}

### Project Structure
- Total files: {{structure.totalFiles}}
- Total directories: {{structure.totalDirs}}
- Entry points: {{#each structure.entryPoints}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}

### Detected Patterns
- Naming convention: {{patterns.namingConvention}}
- File organization: {{patterns.fileOrganization}}
- Monorepo: {{patterns.hasMonorepo}}
- Config files: {{#each patterns.configFiles}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
- CI files: {{#each patterns.ciFiles}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}

{{#if sampledFiles.length}}
### Code Samples
{{#each sampledFiles}}
#### {{path}} ({{priority}})
\`\`\`
{{{content}}}
\`\`\`

{{/each}}
{{/if}}

## Instructions

Generate EXACTLY these 6 sections in markdown. Each section should be practical and actionable for an AI coding agent:

1. **Project Context** - What this project is (2-3 sentences max)
2. **Stack** - List of languages, frameworks, and key libraries with versions if detectable
3. **Commands** - Copy-pasteable commands for build, run, test, lint. Use the exact commands from analysis.
4. **Conventions** - Naming conventions, file structure patterns, import style, any coding standards
5. **Architecture** - What lives where, key directories and their purposes, how components connect
6. **Boundaries** - Rules as three sub-lists:
   - **Always**: Things to always do (e.g., "run tests before committing")
   - **Ask first**: Things that need human approval (e.g., "adding new dependencies")
   - **Never**: Things to never do (e.g., "commit secrets or .env files")

Output ONLY the markdown content. Do NOT wrap in code blocks. Start directly with the first section heading.`;

const SUBFOLDER_TEMPLATE = `You are generating a subfolder AGENTS.md file for the {{subfolderPath}} directory in a larger repository.

This file should ONLY include sections that DIFFER from the root AGENTS.md. If a section is identical to root, omit it entirely.

## Root AGENTS.md
{{{rootMarkdown}}}

## Subfolder Analysis ({{subfolderPath}})

### Languages
{{#each languages}}
- {{name}}: {{percentage}}% ({{fileCount}} files)
{{/each}}

### Frameworks & Libraries
{{#each frameworks}}
- {{name}} ({{category}})
{{/each}}

### Available Commands
{{#each commands}}
- \`{{command}}\` ({{name}})
{{/each}}

### Patterns
- Naming: {{patterns.namingConvention}}
- Organization: {{patterns.fileOrganization}}

{{#if sampledFiles.length}}
### Code Samples
{{#each sampledFiles}}
#### {{path}} ({{priority}})
\`\`\`
{{{content}}}
\`\`\`

{{/each}}
{{/if}}

## Instructions

Generate markdown with ONLY the sections that differ from the root AGENTS.md. Possible sections:
1. Project Context - only if this subfolder has a distinctly different purpose
2. Stack - only if it uses additional/different tech
3. Commands - only if subfolder has its own commands
4. Conventions - only if conventions differ from root
5. Architecture - describe what lives in this subfolder specifically
6. Boundaries - only if there are additional rules for this subfolder

Start with a one-line note: "This directory contains [purpose]. See root AGENTS.md for general project info."

Output ONLY the markdown content. Do NOT wrap in code blocks.`;

export function buildRootPrompt(analysis: AnalysisResult): string {
  const template = Handlebars.compile(ROOT_TEMPLATE);
  return template(analysis);
}

export function buildSubfolderPrompt(
  analysis: AnalysisResult,
  rootMarkdown: string,
  subfolderPath: string
): string {
  const template = Handlebars.compile(SUBFOLDER_TEMPLATE);
  return template({ ...analysis, rootMarkdown, subfolderPath });
}

export const SYSTEM_PROMPT =
  "You are an expert at analyzing codebases and generating clear, concise documentation for AI coding agents. Focus on practical, actionable information.";
