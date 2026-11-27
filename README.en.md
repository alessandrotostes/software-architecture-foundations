# software-architecture-foundations

[🇧🇷 Português](README.md) · 🇺🇸 English

Two things in one package for AI coding agents:

1. **The architecture skill**: software architecture fundamentals distilled from four classic
   books, with hands-on guidance for **TypeScript, Node.js and React** and integration with
   **Spec-Driven Development**:
   - **Clean Architecture** by Robert C. Martin
   - **Design Patterns** by Gamma, Helm, Johnson and Vlissides (GoF)
   - **Test-Driven Development: By Example** by Kent Beck
   - **Software Engineering, 9th ed.** by Ian Sommerville
2. **The agent workflow** (a Claude Code plugin): spec with acceptance criteria → your approval →
   implementation with TDD → a gate that accepts only evidence → review and merge. Several
   agents run in parallel, each in its own worktree, and a per-repository dashboard shows
   live what is missing in each task.

The architecture skill says **how** to design, test and review. The workflow says **when** and
**under what control**: phase, approval, evidence, stopping for a human decision. Where they
meet, this order applies: your decision > the project's ADRs and conventions > the skill's
principles (see [`kit/regras.md`](kit/regras.md), section 0).

> The content is written in Brazilian Portuguese. Agents read it regardless of the language you
> prompt in, and the trigger description includes English keywords.

```
.claude-plugin/
  plugin.json                     ← plugin manifest
  marketplace.json                ← lets you install straight from this repository
skills/
  software-architecture-foundations/   ← the architecture skill (open Agent Skills format)
    SKILL.md
    references/                   ← clean-architecture, design-patterns, tdd, software-engineering,
                                    review-checklist, typescript-react, spec-driven
  spec/  implement/  gate/  dispatch/  sync/  painel/   ← the workflow (Claude Code)
kit/
  regras.md                       ← shared rules: precedence, living context, when to stop, new work
  formato.md                      ← per-task state format
  ws.mjs                          ← dependency-free script: state, events, dashboard, server, hooks
  dashboard.template.html         ← dashboard
hooks/hooks.json                  ← logs events and blocks push without a passing gate
AGENTS.md                         ← lean version of the architecture skill for any agent
```

## Installation

### Claude Code: full plugin (architecture + workflow)

```
/plugin marketplace add alessandrotostes/software-architecture-foundations
/plugin install software-architecture-foundations@alessandrotostes
```

To try a local copy, replace the first command with `/plugin marketplace add <folder-path>`.
To try a branch, use
`/plugin marketplace add https://github.com/alessandrotostes/software-architecture-foundations.git#<branch>`.
Requires Node.js (for `kit/ws.mjs`) and git.

**Claude Code inside a sandbox** (ai-jail, bubblewrap, a container) that only exposes the folder the
session was opened in plus `~/.claude`:
- Install from a git marketplace (GitHub or URL), not from a local folder. From git, the plugin is
  copied into `~/.claude/plugins`, which the sandbox exposes; from a local folder it is read in place,
  the sandbox hides that folder, and `/plugin` shows "couldn't load".
- Open the session at the project root (in project mode, the folder that holds the repositories) so
  `.work-state/` and every repository are visible.
- The hooks run `node`, so it must live on a path the sandbox exposes (e.g. `/usr/bin`). A Node
  installed only under your home (nvm) is hidden and the hooks, including the push block, do not run.

### Other agents: the architecture skill only

The workflow relies on Claude Code features (hooks, `context: fork`, `claude -p`). The
architecture skill works in any agent that supports Agent Skills.

**Universal installer**, in your project:
```bash
npx skills add alessandrotostes/software-architecture-foundations --skill software-architecture-foundations
```

**Copy the folder** `skills/software-architecture-foundations/`:

| Tool | Project | Global |
|---|---|---|
| Claude Code | `.claude/skills/software-architecture-foundations/` | `~/.claude/skills/software-architecture-foundations/` |
| Codex, Cursor, GitHub Copilot, Gemini CLI, Cline, OpenCode, Amp | `.agents/skills/software-architecture-foundations/` | per tool |
| Windsurf | `.windsurf/skills/…` | `~/.codeium/windsurf/skills/…` |
| Goose | `.goose/skills/…` | `~/.config/goose/skills/…` |
| Continue | `.continue/skills/…` | `~/.continue/skills/…` |
| Roo Code | `.roo/skills/…` | `~/.roo/skills/…` |

**Tools without skill support:** copy `AGENTS.md` to the project root (or into `CLAUDE.md`,
`GEMINI.md`, `.github/copilot-instructions.md`, `.cursor/rules/`, `.windsurfrules`).

## Using the architecture skill

It activates on its own when a task involves designing, implementing, refactoring or reviewing
code. You can also ask:
- "Use the software-architecture-foundations skill to review this PR."
- "Propose this module's architecture following Clean Architecture and TDD."
- "Should this type-based `switch` become a design pattern? Which one and why?"

## Using the workflow

Commands run only when you call them. Inside the plugin they also answer to their full name,
e.g. `/software-architecture-foundations:spec`.

| Command | What it does |
|---|---|
| `/sync` | Updates the current repository's state from tasks (Azure DevOps via MCP), PRs and CI |
| `/painel` | Runs sync and opens the repository's self-refreshing dashboard |
| `/spec <id>` | Writes the spec with design, testable acceptance criteria and plan; stops for your approval (`/spec aprovar <id>`) |
| `/implement <id>` | Implements the approved spec in small steps, test-first on logic, then runs the gate |
| `/gate <id>` | Checks each criterion against evidence and reviews the diff with the architecture checklist, in an isolated context; fixes nothing |
| `/dispatch <id> <id>` | Starts one headless agent per task, each in its own worktree, all on the same dashboard |

State lives in `<repository>/.work-state/`, excluded from git only locally
(`.git/info/exclude`). Agents stop and ask when requirements are ambiguous, a solution would
break an ADR, context is missing or calls for new structure, an error repeats after two
different fixes, or a contract change, migration, new dependency or out-of-scope work comes
up. The hooks do nothing in repositories without `.work-state/`; elsewhere they log events to
the dashboard and block `git push` while the current branch's task gate has not passed
(set `WS_ALLOW_PUSH=1` to allow once).

**Project mode.** If you open Claude Code in a folder that is not a git repository but contains
repositories (for example `my-app/` with `backend/`, `frontend/` and a context repository), state
lives in `my-app/.work-state/`: one dashboard for the whole project, and a task can touch more
than one repository, with the same branch and one PR in each. Context (CLAUDE.md, ADRs, rules) is
read from every repository, including the context one. The hooks understand
`cd backend && npm test` and `git -C frontend push`. `/dispatch` does not support this mode yet.

## License
Original summary and synthesis, licensed under [CC BY 4.0](LICENSE).
The referenced books belong to their authors and publishers; this material does not reproduce
extended passages — descriptions are written in original wording, with short attributed quotes.
