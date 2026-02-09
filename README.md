# agentseed

**Seed your repo. AI agents grow smarter.**

```bash
npx agentseed init
```

One command. agentseed reads your codebase — languages, frameworks, commands, architecture, conventions — and generates a production-quality `AGENTS.md` ready for 20+ AI tools.

```
your-repo/
├── AGENTS.md          # Works with Copilot, Codex, Cursor, Gemini, Windsurf, Devin...
├── CLAUDE.md          # Claude Code
├── .cursorrules       # Cursor IDE
└── .windsurfrules     # Windsurf
```

Free. Instant. No API key required.

---

## What is AGENTS.md?

[AGENTS.md](https://agents.md) is the open standard for AI coding agent instructions — backed by the Agentic AI Foundation (Linux Foundation + OpenAI) and adopted by **60,000+ repositories**.

When your repo has a great AGENTS.md, every AI tool that touches your code knows your stack, respects your conventions, and runs the right commands. agentseed generates that file by actually understanding your project.

---

## Quick Start

```bash
# Instant, free — works out of the box
npx agentseed init

# Enhanced with LLM (bring your own key)
export ANTHROPIC_API_KEY=sk-ant-...
npx agentseed init --provider claude

# Or use OpenAI / Ollama
npx agentseed init --provider openai
npx agentseed init --provider ollama   # local, free
```

### Output Formats

agentseed generates `AGENTS.md` by default. Need files for specific tools too?

```bash
npx agentseed init --format all     # AGENTS.md + CLAUDE.md + .cursorrules + copilot + windsurf
npx agentseed init --format claude   # Just CLAUDE.md
```

| Format | File | Tools |
|--------|------|-------|
| `agents` | `AGENTS.md` | Copilot, Codex, Gemini, Cursor, Devin, 20+ |
| `claude` | `CLAUDE.md` | Claude Code |
| `cursor` | `.cursorrules` | Cursor IDE |
| `copilot` | `.github/copilot-instructions.md` | GitHub Copilot |
| `windsurf` | `.windsurfrules` | Windsurf / Codeium |
| `all` | All of the above | **Default** |

---

## How It Works

**Pass 1 — Static Analysis** (free, instant)
- Detects languages, frameworks, and dependencies
- Extracts build/test/lint commands from package.json, Makefile, Cargo.toml, dbt_project.yml
- Maps directory structure, entry points, naming conventions
- Detects monorepo patterns and CI/CD pipelines

**Pass 2 — LLM Enhancement** (optional, bring your own key)
- Smart-samples key files (entry points, configs, architecture)
- Sends to Claude, GPT, or Ollama for richer project descriptions
- One LLM call, rendered to all formats

**Stays Current** — agentseed tracks git SHAs. Re-run and only changed files get regenerated. Use `--force` to refresh everything.

---

## What AI Agents Learn

Every generated file contains 6 sections:

| Section | Example |
|---------|---------|
| **Project Context** | "Hono is a lightweight web framework for multiple JS runtimes" |
| **Stack** | TypeScript 97%, Vitest, esbuild |
| **Commands** | `bun run test`, `bun run build`, `bun run lint` |
| **Conventions** | kebab-case naming, module-based file organization |
| **Architecture** | `src/` — core framework, `runtime-tests/` — per-runtime test suites |
| **Boundaries** | Always run tests before committing. Never force-push to main. |

---

## Real Output

Running `agentseed init --provider claude` on [Hono](https://github.com/honojs/hono) (400+ files):

```markdown
## Project Context

Hono is a lightweight web framework built on Web Standards that runs on
multiple JavaScript runtimes (Cloudflare Workers, Deno, Bun, Node.js).

## Commands

bun run test       # Run all tests
bun run build      # Build the project
bun run lint       # Run ESLint

## Boundaries

### Always
- Run `bun run test` before committing
- Follow kebab-case naming convention

### Never
- Use runtime-specific APIs in core framework code
- Break backward compatibility without major version bump
```

8 seconds. ~$0.08. All 5 output files generated simultaneously.

---

## Monorepo Support

```bash
agentseed scan
```

```
my-monorepo/
├── AGENTS.md                    # Root: full project overview
├── packages/
│   ├── api/
│   │   └── AGENTS.md           # Scoped: only what differs from root
│   └── web/
│       └── AGENTS.md
```

Subfolder files only include sections that **differ** from root — clean, no duplication. Each subfolder tracks its own git SHA for incremental updates.

---

## Supported Ecosystems

| Ecosystem | Frameworks & Tools |
|-----------|-------------------|
| **Frontend** | React, Next.js, Vue, Nuxt, Svelte, Angular, Astro |
| **Backend** | Express, Fastify, NestJS, Hono, Flask, Django, FastAPI, Spring Boot |
| **Data / ETL** | dbt, Airflow, Dagster, Prefect, Spark, Pandas, Polars |
| **Databases** | Prisma, Drizzle, SQLAlchemy, TypeORM, Alembic, Flyway |
| **Testing** | Vitest, Jest, Playwright, Cypress, pytest |
| **Infra** | Docker, Terraform, GitHub Actions, GitLab CI |
| **Languages** | TypeScript, JavaScript, Python, Rust, Go, Java, SQL, and 20+ more |

---

## CLI Reference

### `agentseed init`

```bash
agentseed init [options]

Options:
  -f, --format <name>    agents | claude | cursor | copilot | windsurf | all (default: all)
  -d, --dry-run          Preview output without writing files
  -o, --output <path>    Override output path (single format only)
  -p, --provider <name>  claude | openai | ollama
  -m, --model <name>     Override default model
  --no-llm               Static analysis only (free, default)
  --force                Regenerate even if files are up to date
  -v, --verbose          Debug output
```

### `agentseed scan`

Generate scoped AGENTS.md for monorepos and multi-package projects.

```bash
agentseed scan [path] [options]
# Same options as init, plus automatic subfolder detection
```

---

## Configuration

Optional `.agentseedrc` in your project root:

```yaml
provider: claude
model: claude-sonnet-4-5-20250929
maxFiles: 15
maxTokenBudget: 65536
ignore:
  - node_modules
  - dist
  - .git
```

**Commit the generated files** (`AGENTS.md`, `CLAUDE.md`, etc.) — they're project documentation.
**Gitignore `.agentseedrc`** if it contains API keys.

---

## Contributing

```bash
git clone https://github.com/avinshe/agentseed.git
cd agentseed
npm install
npm run build
npm test

# Try it locally
node bin/agentseed.js init --dry-run
```

## License

MIT
