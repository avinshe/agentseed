import { Command } from "commander";
import { initCommand } from "./commands/init";
import { scanCommand } from "./commands/scan";

const program = new Command();

program
  .name("agentseed")
  .description("The best AGENTS.md generator. Analyze your codebase, seed AI agents with context.")
  .version("0.1.0");

program
  .command("init")
  .description("Analyze current repository and generate AI context files")
  .option("-d, --dry-run", "Show analysis output without writing files")
  .option("-o, --output <path>", "Output file path (overrides format default)")
  .option("-f, --format <name>", "Output format: agents, claude, cursor, copilot, windsurf, all", "agents")
  .option("-p, --provider <name>", "LLM provider: claude, openai, ollama (enables LLM enhancement)")
  .option("-m, --model <name>", "LLM model to use (overrides default)")
  .option("--force", "Regenerate all files even if unchanged")
  .option("-v, --verbose", "Enable verbose logging")
  .action(initCommand);

program
  .command("scan")
  .description("Scan for subfolders and generate scoped AI context files")
  .argument("[path]", "Root path to scan", ".")
  .option("-d, --dry-run", "Show detected subfolders without writing files")
  .option("-f, --format <name>", "Output format: agents, claude, cursor, copilot, windsurf, all", "agents")
  .option("-p, --provider <name>", "LLM provider: claude, openai, ollama (enables LLM enhancement)")
  .option("-m, --model <name>", "LLM model to use (overrides default)")
  .option("--force", "Regenerate all files even if unchanged")
  .option("-v, --verbose", "Enable verbose logging")
  .action(scanCommand);

program.parse();
