# Changelog

## 2.2.0 — 2026-11-27

### Alterado
- `/sync` busca as tasks disponíveis no Azure DevOps (abertas, na área do sistema, `ado_area`,
  atribuídas a mim ou sem responsável), mostra uma tabela e pergunta quais vão ser trabalhadas; só
  essas entram no `.work-state/`. Atribuir uma task sem responsável só com o sim da pessoa.
  `/sync atualizar` só atualiza as que já estão no painel (é o que o `/painel` usa); `/sync <ids>`
  traz essas direto.
- `/dispatch` funciona no modo projeto e passa a criar os worktrees **dentro** da pasta da sessão
  (`.worktrees/<id>/<caminho>`; no modo repositório, `.worktrees/<id>`, excluído do git), para
  funcionar em sandbox que só expõe essa pasta. Antes eles iam para `../<repo>-wt/<id>`.
- `/dispatch` pula tasks com migration de banco quando outra task ativa também tem.

### Adicionado
- `ws.mjs worktree add <id>`: cria ou reaproveita um worktree por repositório da task, na branch da
  task a partir da `base`, e copia os `arquivos_locais`; recusa se a branch estiver em uso na cópia
  principal, sem deixar a task pela metade. `ws.mjs worktree remove <id>`: apaga os worktrees limpos.
- `config.json`: `arquivos_locais` por repositório (o `init` preenche com os `.env*` que o git ignora).
  Se a branch da task não ignora um arquivo copiado, ele é marcado no `info/exclude` do repositório,
  para um `git add -A` do agente não commitar segredos.
- Hooks dentro de um worktree gravam `agente=wt-<id>` e deduzem a task pela pasta `.worktrees/<id>`.

### Ainda não
- Portas por agente e teste no navegador pelos agentes em paralelo.

## 2.1.0 — 2026-11-27

### Adicionado
- **Modo projeto:** o fluxo funciona numa pasta que não é repositório git mas contém repositórios
  (ex.: `backend/`, `frontend/` e um repositório de contexto). O `.work-state/` fica na pasta do
  projeto, com um painel só; o `config.json` lista os repositórios (`repos`, com `base` e
  `contexto`) e uma task pode tocar vários (`repos`, `prs`). `init` de novo acrescenta repositórios.
- O `ws.mjs` acha o estado subindo pelas pastas, como o git acha o `.git`: funciona na raiz do
  projeto, dentro de um repositório dele e em worktrees criados fora da pasta.
- Hooks entendem `cd <repo> && ...` e `git -C <repo> ...`: deduzem a task pela branch daquele
  repositório, gravam `repo=<caminho>` e aplicam o bloqueio de push ao repositório certo. Na raiz do
  projeto, a task é a única branch que tem arquivo de task.
- Contexto: lê pastas ocultas (`.context/`) e regras de agente (`.claude/rules/`, `.kiro/steering/`);
  ignora changelogs, planos, arquivo morto e worktrees; limite de fontes de 400 para 1000. Pasta de
  contexto grande com índice próprio é lida a partir do índice (`kit/regras.md`).

### Corrigido
- `git -C <pasta> push` passava pelo bloqueio de push sem gate, e `git -C <pasta> commit` não era
  registrado.
- O `config.json` guardava o remote com usuário e token quando a URL os tinha.

### Documentação
- README: como usar o plugin com o Claude Code dentro de um sandbox que só expõe a pasta da sessão
  (instalar de marketplace git, abrir na raiz do projeto, `node` visível) e como testar uma branch.

### Ainda não
- `/dispatch` no modo projeto (worktree por repositório): recusa e sugere `/implement`.

## 2.0.1 — 2026-11-27

### Corrigido
- Hooks: teste que falhava não aparecia no painel. O Claude Code manda comando com saída diferente
  de zero para `PostToolUseFailure`, que o `hooks/hooks.json` não registrava. Agora registra (só para
  Bash e PowerShell) e o `ws.mjs` grava `teste` com `resultado=falhou`, ou `interrompido` quando a
  pessoa interrompe.
- Hooks: teste que passava era gravado sem `resultado`, porque a resposta do `PostToolUse` não traz
  `exitCode`. Agora sai com `resultado=ok`.
- Hooks: commit, push e PR cujo comando falhou não são mais gravados como se tivessem acontecido.

### Adicionado
- `test/ws.test.mjs`: testes do `ws.mjs hook` com os payloads reais do Claude Code, sem dependências.
  Rode com `node --test`.

## 2.0.0 — 2026-11-27

### Adicionado
- O repositório vira um **plugin do Claude Code** (`.claude-plugin/plugin.json` e `marketplace.json`),
  com a skill de arquitetura e um fluxo de trabalho com agentes no mesmo pacote.
- Skills do fluxo: `spec`, `implement`, `gate`, `dispatch`, `sync` e `painel`.
- `kit/`: regras comuns (precedência entre projeto e skill, contexto vivo, parada para decisão humana,
  trabalho novo e tasks filhas), formato do estado por task e `ws.mjs` (estado, eventos, painel em
  tempo real, servidor local e hooks, sem dependências).
- `hooks/hooks.json`: registro automático de eventos no painel e bloqueio de `git push` sem gate.
- O fluxo usa a skill de arquitetura em cada etapa: fluxo A na spec, TDD e checklist D na
  implementação, checklist de revisão com severidades no gate, rascunho de ADR nas decisões arquiteturais.

### Alterado
- **Quebra de caminho:** a skill de arquitetura saiu da raiz para `skills/software-architecture-foundations/`.
  Quem copia a pasta manualmente deve usar o novo caminho; o conteúdo da skill não mudou.
- READMEs reescritos para as duas partes.

## 1.1.0 — 2026-11-25

### Adicionado
- `references/typescript-react.md`: como aplicar portas, adaptadores, composição, fronteiras
  (dependency-cruiser / eslint-plugin-boundaries) e testes em TypeScript, Node.js e React.
- `references/spec-driven.md`: integração com Spec-Driven Development e Context Engineering —
  critérios de aceite como lista de testes, ADRs e documentação viva.
- Checklist de revisão: isolamento multi-tenant e autorização por recurso.
- README em inglês (`README.en.md`), `LICENSE` (CC BY 4.0) e este changelog.
- Palavras-chave em inglês na `description` e `metadata` (autor e versão) no frontmatter.

### Alterado
- Test-first passa a valer para regra de negócio e lógica com decisão; cola, configuração e
  layout sem lógica podem ter só testes de integração/e2e (antes a regra era absoluta).
- Nome de teste independente de linguagem (`it('deve … quando …')`, pytest, JUnit).
- `AGENTS.md` reduzido a princípios, checklist e ponteiros para não pesar no contexto de toda sessão.
- Coluna "Intenção" dos 23 padrões GoF reescrita com palavras próprias.
- `license` do frontmatter agora usa o identificador SPDX `CC-BY-4.0`.

### Corrigido
- Quebra de linha no meio de "generalidade especulativa" em `software-engineering.md`.

## 1.0.0
- Versão inicial: SKILL.md, AGENTS.md e referências de Clean Architecture, Padrões de Projeto,
  TDD, Engenharia de Software e checklist de revisão.
