# software-architecture-foundations

🇧🇷 Português · [🇺🇸 English](README.en.md)

Duas coisas num só pacote, para agentes de código:

1. **A skill de arquitetura**: fundamentos de arquitetura de software destilados de quatro livros,
   com aplicação em **TypeScript, Node.js e React** e integração com **Spec-Driven Development**:
   - **Clean Architecture**, de Robert C. Martin
   - **Padrões de Projeto**, de Gamma, Helm, Johnson e Vlissides (GoF)
   - **TDD: Desenvolvimento Guiado por Testes**, de Kent Beck
   - **Engenharia de Software, 9ª ed.**, de Ian Sommerville
2. **O fluxo de trabalho com agentes** (plugin do Claude Code): spec com critérios de aceite →
   sua aprovação → implementação com TDD → gate que só aceita evidência → revisão e merge.
   Vários agentes rodam em paralelo, cada um no seu worktree, e um painel por repositório
   mostra em tempo real o que falta em cada task.

A skill de arquitetura diz **como** projetar, testar e revisar. O fluxo diz **quando** e
**com que controle**: fase, aprovação, evidência, parada para decisão humana. Quando os dois se
encontram, vale esta ordem: decisão sua > ADRs e convenções do projeto > princípios da skill
(detalhes em [`kit/regras.md`](kit/regras.md), seção 0).

```
.claude-plugin/
  plugin.json                     ← manifesto do plugin
  marketplace.json                ← permite instalar direto deste repositório
skills/
  software-architecture-foundations/   ← a skill de arquitetura (formato aberto Agent Skills)
    SKILL.md
    references/                   ← clean-architecture, design-patterns, tdd, software-engineering,
                                    review-checklist, typescript-react, spec-driven
  spec/  implement/  gate/  dispatch/  sync/  painel/   ← o fluxo (Claude Code)
kit/
  regras.md                       ← regras comuns: precedência, contexto vivo, quando parar, trabalho novo
  formato.md                      ← formato do estado por task
  ws.mjs                          ← script sem dependências: estado, eventos, painel, servidor, hooks
  dashboard.template.html         ← painel
hooks/hooks.json                  ← registra eventos e bloqueia push sem gate
AGENTS.md                         ← versão enxuta da skill de arquitetura para qualquer agente
```

## Instalação

### Claude Code: plugin completo (arquitetura + fluxo)

```
/plugin marketplace add alessandrotostes/software-architecture-foundations
/plugin install software-architecture-foundations@alessandrotostes
```

Para testar a partir de uma cópia local, troque o primeiro comando por
`/plugin marketplace add <caminho-da-pasta>`. Requer Node.js (para o `kit/ws.mjs`) e git.

### Outros agentes: só a skill de arquitetura

O fluxo usa recursos do Claude Code (hooks, `context: fork`, `claude -p`). A skill de
arquitetura funciona em qualquer agente compatível com Agent Skills.

**Instalador universal**, no seu projeto:
```bash
npx skills add alessandrotostes/software-architecture-foundations --skill software-architecture-foundations
```

**Copiando a pasta** `skills/software-architecture-foundations/`:

| Ferramenta | No projeto | Global (todas as pastas) |
|---|---|---|
| Claude Code | `.claude/skills/software-architecture-foundations/` | `~/.claude/skills/software-architecture-foundations/` |
| Codex, Cursor, GitHub Copilot, Gemini CLI, Cline, OpenCode, Amp | `.agents/skills/software-architecture-foundations/` | conforme a ferramenta |
| Windsurf | `.windsurf/skills/…` | `~/.codeium/windsurf/skills/…` |
| Goose | `.goose/skills/…` | `~/.config/goose/skills/…` |
| Continue | `.continue/skills/…` | `~/.continue/skills/…` |
| Roo Code | `.roo/skills/…` | `~/.roo/skills/…` |

```bash
mkdir -p .agents/skills .claude/skills
cp -r skills/software-architecture-foundations .agents/skills/
cp -r skills/software-architecture-foundations .claude/skills/
```

**Ferramentas sem suporte a skills:** copie `AGENTS.md` para a raiz do projeto (lido por Codex,
Cursor, Copilot, Jules, Aider e outros) ou para `CLAUDE.md`, `GEMINI.md`,
`.github/copilot-instructions.md`, `.cursor/rules/arquitetura.mdc` ou `.windsurfrules`.

## Como usar a skill de arquitetura

Ela ativa sozinha quando a tarefa envolve projetar, implementar, refatorar ou revisar código.
Você também pode pedir:
- "Use a skill software-architecture-foundations para revisar este PR."
- "Proponha a arquitetura deste módulo seguindo Clean Architecture e TDD."
- "Este `switch` por tipo deveria virar um padrão de projeto? Qual e por quê?"

## Como usar o fluxo

Os comandos só rodam quando você os chama. Dentro do plugin eles também respondem pelo nome
completo, por exemplo `/software-architecture-foundations:spec`.

| Comando | O que faz |
|---|---|
| `/sync` | Atualiza o estado do repositório atual com as tasks (Azure DevOps via MCP), PRs e CI |
| `/painel` | Roda o sync e abre o painel do repositório, que se atualiza sozinho |
| `/spec <id>` | Escreve a spec com desenho, critérios de aceite testáveis e plano; para e espera você aprovar (`/spec aprovar <id>`) |
| `/implement <id>` | Implementa a spec aprovada em passos pequenos, test-first na lógica, e roda o gate |
| `/gate <id>` | Confere cada critério com evidência e revisa o diff com o checklist de arquitetura, em contexto isolado; não corrige nada |
| `/dispatch <id> <id>` | Dispara um agente headless por task, cada um no seu worktree, todos no mesmo painel |

Fluxo do dia: `/painel` de manhã → `/spec` → você aprova → `/dispatch` → os agentes rodam
`/implement` e `/gate` → você revisa e faz o merge.

**Onde fica o estado.** Em `<repositório>/.work-state/`, excluído do git só localmente
(`.git/info/exclude`), então nada pessoal vai para o repositório do time. Os worktrees gravam
no `.work-state/` do repositório principal. Formato em [`kit/formato.md`](kit/formato.md).

**Modo projeto.** Se você abre o Claude Code numa pasta que não é repositório git, mas que tem
repositórios dentro (por exemplo `minha-app/` com `backend/`, `frontend/` e um repositório de
contexto), o estado fica em `minha-app/.work-state/`: um painel para o projeto todo, e uma task
pode tocar mais de um repositório, com a mesma branch e um PR em cada. O contexto (CLAUDE.md,
ADRs, regras) é lido de todos os repositórios, inclusive o de contexto. Os hooks entendem
`cd backend && npm test` e `git -C frontend push`. O `/dispatch` ainda não funciona nesse modo.

**O agente para e pergunta** quando o requisito é ambíguo, a solução contraria um ADR, o
contexto não cobre o caso ou pede estrutura nova, um erro se repete após duas correções
diferentes, ou aparece mudança de contrato, migration, dependência nova ou trabalho fora do
escopo. A task vai para o topo do painel com a decisão, as opções e a recomendação (e um
rascunho de ADR quando a decisão é arquitetural). Regras em [`kit/regras.md`](kit/regras.md).

**Hooks.** Instalados com o plugin. Não fazem nada em repositórios sem `.work-state/`. Nos
demais, registram commits, pushes, PRs, testes e paradas de agente no painel, e bloqueiam
`git push` quando o gate da task da branch atual não passou (para liberar uma vez, defina
`WS_ALLOW_PUSH=1`).

## Personalização

Regras do projeto vencem as da skill. Coloque-as onde o projeto já guarda contexto
(`CLAUDE.md`, `CONTEXT.md`, `docs/adr/`): o fluxo as lê antes de cada spec, implementação e
gate. Sem fluxo, acrescente ao fim do `SKILL.md` uma seção **"Convenções do projeto"**.

## Licença
Texto original de resumo e síntese, licenciado sob [CC BY 4.0](LICENSE).
Os livros citados pertencem aos seus autores e editoras; este material não reproduz trechos
extensos das obras — as descrições foram escritas com palavras próprias, com citações curtas
e atribuídas.
