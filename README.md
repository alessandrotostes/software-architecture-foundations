# Skill: software-architecture-foundations

🇧🇷 Português · [🇺🇸 English](README.en.md)

Fundamentos de arquitetura de software para agentes de código, destilados de quatro livros:

- **Clean Architecture** — Robert C. Martin
- **Padrões de Projeto** — Gamma, Helm, Johnson, Vlissides (GoF)
- **TDD: Desenvolvimento Guiado por Testes** — Kent Beck
- **Engenharia de Software, 9ª ed.** — Ian Sommerville

Inclui aplicação prática em **TypeScript, Node.js e React** e integração com
**Spec-Driven Development** e **Context Engineering** (specs, ADRs e documentação viva).

O formato segue o padrão aberto **Agent Skills** (`SKILL.md` + `references/`), lido por
Claude Code, OpenAI Codex, Cursor, GitHub Copilot, Gemini CLI, Windsurf, Cline, OpenCode,
Goose, Roo Code e outros. Para ferramentas sem suporte a skills há o arquivo `AGENTS.md`.

```
software-architecture-foundations/
├── SKILL.md                      ← regras centrais + fluxo de trabalho (carregado quando a skill ativa)
└── references/                   ← carregados sob demanda
    ├── clean-architecture.md
    ├── design-patterns.md
    ├── tdd.md
    ├── software-engineering.md
    ├── review-checklist.md
    ├── typescript-react.md       ← portas, composição, fronteiras e testes em TS/React
    └── spec-driven.md            ← specs, critérios de aceite, ADRs e documentação viva
AGENTS.md                         ← versão enxuta “sempre ativa” para qualquer agente
```

## Instalação

### Opção 1 — Instalador universal (detecta os agentes instalados)
No seu projeto:
```bash
npx skills add alessandrotostes/software-architecture-foundations
```

### Opção 2 — Copiar a pasta manualmente

| Ferramenta | No projeto | Global (todas as pastas) |
|---|---|---|
| Claude Code | `.claude/skills/software-architecture-foundations/` | `~/.claude/skills/software-architecture-foundations/` |
| Codex, Cursor, GitHub Copilot, Gemini CLI, Cline, OpenCode, Amp | `.agents/skills/software-architecture-foundations/` | conforme a ferramenta |
| Windsurf | `.windsurf/skills/…` | `~/.codeium/windsurf/skills/…` |
| Goose | `.goose/skills/…` | `~/.config/goose/skills/…` |
| Continue | `.continue/skills/…` | `~/.continue/skills/…` |
| Roo Code | `.roo/skills/…` | `~/.roo/skills/…` |

Exemplo (macOS/Linux):
```bash
mkdir -p .agents/skills .claude/skills
cp -r software-architecture-foundations .agents/skills/
cp -r software-architecture-foundations .claude/skills/
```

### Opção 3 — Ferramentas sem suporte a skills
Copie `AGENTS.md` para a raiz do projeto (lido por Codex, Cursor, Copilot, Jules, Aider e
outros). Se a ferramenta usar outro nome, copie o mesmo conteúdo para:
`CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, `.cursor/rules/arquitetura.mdc`
ou `.windsurfrules`. O `AGENTS.md` é enxuto de propósito (princípios + checklist + ponteiros)
para não pesar no contexto de toda sessão; mantenha a pasta da skill no projeto para que o
fluxo completo e as referências possam ser lidos sob demanda.

## Como usar
A skill ativa sozinha quando a tarefa envolve projetar, implementar, refatorar ou revisar
código. Você também pode pedir explicitamente, por exemplo:
- "Use a skill software-architecture-foundations para revisar este PR."
- "Proponha a arquitetura deste módulo seguindo Clean Architecture e TDD."
- "Este `switch` por tipo deveria virar um padrão de projeto? Qual e por quê?"
- "Implemente a spec `specs/cupons/spec.md` seguindo a skill."

## Personalização
Acrescente ao fim do `SKILL.md` uma seção **"Convenções do projeto"** (linguagem, framework,
estrutura de pastas, ferramenta de testes, regras de importação). Regras locais explícitas
têm prioridade sobre as gerais.

## Licença
Texto original de resumo e síntese, licenciado sob [CC BY 4.0](LICENSE).
Os livros citados pertencem aos seus autores e editoras; este material não reproduz trechos
extensos das obras — as descrições foram escritas com palavras próprias, com citações curtas
e atribuídas.
