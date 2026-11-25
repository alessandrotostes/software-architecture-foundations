# Skill: software-architecture-foundations

[🇧🇷 Português](README.md) · 🇺🇸 English

Software architecture fundamentals for AI coding agents, distilled from four classic books:

- **Clean Architecture** — Robert C. Martin
- **Design Patterns** — Gamma, Helm, Johnson, Vlissides (GoF)
- **Test-Driven Development: By Example** — Kent Beck
- **Software Engineering, 9th ed.** — Ian Sommerville

It also covers hands-on application in **TypeScript, Node.js and React**, and integration with
**Spec-Driven Development** and **Context Engineering** (specs, ADRs and living documentation).

> The skill content is written in Brazilian Portuguese. Agents read it regardless of the
> language you prompt in, and the trigger description includes English keywords.

It follows the open **Agent Skills** format (`SKILL.md` + `references/`), supported by
Claude Code, OpenAI Codex, Cursor, GitHub Copilot, Gemini CLI, Windsurf, Cline, OpenCode,
Goose, Roo Code and others. For tools without skill support, use `AGENTS.md`.

```
software-architecture-foundations/
├── SKILL.md                      ← core rules + workflow (loaded when the skill activates)
└── references/                   ← loaded on demand
    ├── clean-architecture.md
    ├── design-patterns.md
    ├── tdd.md
    ├── software-engineering.md
    ├── review-checklist.md
    ├── typescript-react.md       ← ports, composition, boundaries and testing in TS/React
    └── spec-driven.md            ← specs, acceptance criteria, ADRs and living docs
AGENTS.md                         ← lean “always-on” version for any agent
```

## What the agent gets

- **12 always-on principles** — dependency rule, policy vs. detail, SOLID, composition over
  inheritance, test-first where there is logic, patterns only when variation is real.
- **A workflow** — understand and decide → TDD on domain logic → refactor → pre-delivery checklist.
- **A code review checklist** with a "smell → cause → remedy" table, including multi-tenant
  data isolation and resource-level authorization.
- **Stack guidance** for TypeScript/Node/React: ports as interfaces, a single composition root,
  boundaries enforced by dependency-cruiser / eslint, Humble Object with React hooks.
- **Spec-Driven flow** — acceptance criteria become the test list; architectural decisions become ADRs.

## Installation

### Option 1 — Universal installer
```bash
npx skills add alessandrotostes/software-architecture-foundations
```

### Option 2 — Copy the folder

| Tool | Project | Global |
|---|---|---|
| Claude Code | `.claude/skills/software-architecture-foundations/` | `~/.claude/skills/software-architecture-foundations/` |
| Codex, Cursor, GitHub Copilot, Gemini CLI, Cline, OpenCode, Amp | `.agents/skills/software-architecture-foundations/` | per tool |
| Windsurf | `.windsurf/skills/…` | `~/.codeium/windsurf/skills/…` |
| Goose | `.goose/skills/…` | `~/.config/goose/skills/…` |
| Continue | `.continue/skills/…` | `~/.continue/skills/…` |
| Roo Code | `.roo/skills/…` | `~/.roo/skills/…` |

### Option 3 — Tools without skill support
Copy `AGENTS.md` to the project root (or into `CLAUDE.md`, `GEMINI.md`,
`.github/copilot-instructions.md`, `.cursor/rules/`, `.windsurfrules`). It is intentionally
lean so it doesn't weigh on every session's context; keep the skill folder in the project so
the full workflow and references can be read on demand.

## Usage examples
- "Use the software-architecture-foundations skill to review this PR."
- "Propose this module's architecture following Clean Architecture and TDD."
- "Should this type-based `switch` become a design pattern? Which one and why?"
- "Implement `specs/coupons/spec.md` following the skill."

## License
Original summary and synthesis, licensed under [CC BY 4.0](LICENSE).
The referenced books belong to their authors and publishers; this material does not reproduce
extended passages — descriptions are written in original wording, with short attributed quotes.
