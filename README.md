# agentseed

**Seed your repo. AI agents grow smarter.**

```bash
npx agentseed init
```

One command. agentseed reads your codebase — languages, frameworks, commands, architecture, conventions — and generates a production-quality `AGENTS.md` ready for 20+ AI tools.

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
npx agentseed init --format all      # AGENTS.md + CLAUDE.md + .cursorrules + copilot + windsurf
npx agentseed init --format claude    # Just CLAUDE.md
```

| Format | File | Tools |
|--------|------|-------|
| `agents` | `AGENTS.md` | Copilot, Codex, Gemini, Cursor, Devin, 20+ (**default**) |
| `claude` | `CLAUDE.md` | Claude Code |
| `cursor` | `.cursorrules` | Cursor IDE |
| `copilot` | `.github/copilot-instructions.md` | GitHub Copilot |
| `windsurf` | `.windsurfrules` | Windsurf / Codeium |
| `all` | All of the above | Every tool at once |

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
- One LLM call per directory, ~$0.08 each

**Stays Current** — agentseed tracks git SHAs. Re-run and only changed files get regenerated. Use `--force` to refresh everything.

---

## What AI Agents Learn

Every generated file contains 6 sections:

| Section | Example |
|---------|---------|
| **Project Context** | "Flask is a lightweight WSGI web application framework for Python" |
| **Stack** | Python 3.10+, werkzeug, jinja2, pytest, mypy, ruff |
| **Commands** | `pytest`, `ruff check`, `mypy`, `sphinx-build` |
| **Conventions** | snake_case, `from __future__ import annotations`, type hints required |
| **Architecture** | `src/flask/sansio/` — I/O-independent core logic, `ctx.py` — context management |
| **Boundaries** | Always run pre-commit hooks. Never use `type: ignore` without error code. |

---

## Real Output

### Static (free, instant)

```bash
npx agentseed init
```

```markdown
## Project Context

A JavaScript project with 202 files across 64 directories.

## Stack

- JavaScript (92%), HTML (5%), CSS (3%)
- Mocha (testing)

## Commands

npm run test   # test
npm run lint   # lint
```

### LLM-enhanced (~$0.08)

```bash
npx agentseed init --provider claude
```

```markdown
## Project Context

Express is a fast, unopinionated, minimalist web framework for Node.js.
It provides routing, middleware support, template engine integration,
and HTTP utility methods. This is version 5.x, requiring Node.js 18+.

## Stack

- JavaScript (ES6+, Node.js >=18)
- Express 5.2.1, body-parser 2.2.1, router 2.2.0
- Mocha 10.7.3, Supertest 6.3.0, ESLint 8.47.0

## Commands

npm run test       # Run all tests
npm run test-ci    # Run tests with coverage (CI)
npm run lint       # Run linter

## Boundaries

### Always
- Use `Object.create(null)` for objects used as maps to avoid prototype pollution
- Return `this` from response methods to enable method chaining

### Never
- Break backward compatibility in patch/minor versions
- Use synchronous I/O in request handling paths
```

Tested on Express, Flask, dbt-core, Axum, and Fresh — **$0.85 total** for 20 AGENTS.md files across all 5 repos.

---

## Monorepo Support

```bash
npx agentseed scan
```

agentseed automatically detects sub-projects by looking for **config files** (package.json, Cargo.toml, deno.json, pyproject.toml) and **source code density**. Non-code directories (docs, tests, examples) are skipped.

```
axum/                          # Rust workspace
├── AGENTS.md                  # Root: full project overview
├── axum/AGENTS.md             # Core framework crate
├── axum-core/AGENTS.md        # Core traits and types
├── axum-extra/AGENTS.md       # Optional extractors
└── axum-macros/AGENTS.md      # Derive macros

fresh/                         # Deno monorepo
├── AGENTS.md                  # Root
├── www/AGENTS.md              # Website
├── packages/fresh/AGENTS.md   # Core framework
├── packages/init/AGENTS.md    # Project scaffolder
└── packages/plugin-vite/AGENTS.md
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
  -f, --format <name>    agents | claude | cursor | copilot | windsurf | all (default: agents)
  -d, --dry-run          Preview output without writing files
  -o, --output <path>    Override output path (single format only)
  -p, --provider <name>  claude | openai | ollama (enables LLM enhancement)
  -m, --model <name>     Override default model
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
