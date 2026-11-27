# Formato do estado

Todo o estado vive numa pasta `.work-state/`, em um de dois modos, que o `ws.mjs init` escolhe sozinho:

- **Modo repositório:** a pasta atual é um repositório git. O estado fica em `<raiz-do-repositorio-principal>/.work-state/`, excluído do git por `.git/info/exclude` (nunca pelo `.gitignore` do time).
- **Modo projeto:** a pasta atual não é um repositório git, mas tem repositórios dentro (por exemplo `minha-app/` com `backend/`, `frontend/` e um repositório de contexto). O estado fica em `<pasta-do-projeto>/.work-state/`: um painel para o projeto todo, e uma task pode tocar mais de um repositório. A pasta do projeto não é versionada, então nada vai para o time.

O `ws.mjs` acha o estado subindo a partir da pasta atual, como o git acha o `.git`: funciona na raiz do projeto, dentro de qualquer repositório dele e em worktrees, que gravam no estado do repositório principal. Descubra o caminho com

```
node KIT/ws.mjs dir
```

```
.work-state/
  config.json           # repositório: repo, remote, ado_*, max_agentes · projeto: modo, projeto, repos, ado_*, max_agentes
  tasks/<id>.md         # estado e spec de cada task (frontmatter + corpo)
  events.log            # um evento por linha (só acrescentar, nunca reescrever)
  context-summary.md    # regras do contexto vivo, cada uma com o arquivo de origem
  index.json            # GERADO pelo ws.mjs render: não editar à mão
  dashboard.html        # GERADO pelo ws.mjs render: não editar à mão
```

## config.json no modo projeto

```json
{
  "modo": "projeto",
  "projeto": "minha-app",
  "repos": [
    { "caminho": "backend", "remote": "https://example.com/org/backend.git", "base": "main" },
    { "caminho": "context", "remote": "https://example.com/org/context.git", "base": "main", "contexto": true },
    { "caminho": "frontend", "remote": "https://example.com/org/frontend.git", "base": "main" }
  ],
  "ado_url": "",
  "ado_projeto": "",
  "ado_area": "",
  "max_agentes": 2
}
```

- `caminho`: relativo à pasta do projeto. É o nome do repositório nas tasks (`repos`, `prs`) e nos eventos (`repo=`).
- `base`: branch de onde saem as branches das tasks e contra a qual o gate compara o diff. O `init` copia do `origin/HEAD` (ou `main`, `master`, `develop`); se o projeto usa outra base, corrija aqui.
- `contexto: true`: repositório só de contexto (ADRs, convenções, regras). Entra no resumo de contexto, não recebe task nem PR. O `init` marca os que começam com `context`; ajuste à mão se precisar.
- Rodar `init` de novo acrescenta repositórios novos e preserva o resto. Nos dois modos, o remote é gravado sem usuário nem token.

## Regra de escrita

- Cada agente escreve **só** no `tasks/<id>.md` da própria task e acrescenta linhas ao `events.log` (via `ws.mjs event`).
- Só o `ws.mjs render` grava `index.json` e `dashboard.html`. Nunca edite esses dois.
- Ao editar o arquivo da task, preserve o que não é seu: spec, log e decisões já escritas.

## tasks/<id>.md

```markdown
---
id: 1234
titulo: Filtro por período na tela de relatórios
url: https://dev.azure.com/org/projeto/_workitems/edit/1234
repo: nome-do-repositorio      # modo repositório
repos: [backend, frontend]     # modo projeto: caminhos de config.repos que a task toca
branch: feat/1234-filtro-periodo   # modo projeto: o mesmo nome em cada repositório de repos
worktree: C:/Users/voce/worktrees/nome-do-repositorio-1234
fase: implementando   # nova | spec | spec-aprovada | implementando | gate | revisao | teste-manual | pronta-merge | bloqueada | aguardando-decisao
fase_anterior:        # preenchida ao entrar em aguardando-decisao, para retomar depois
spec_aprovada: false  # SÓ a pessoa muda para true
agente: wt-1234
iniciado_em:
pr: 87
pr_url:
prs: [backend#87, frontend#45]   # modo projeto: um PR por repositório
ci: pendente          # passando | falhando | pendente | sem-pr (modo projeto: o pior entre os PRs)
gate: nao-rodou       # nao-rodou | parcial | passou | falhou
mae:                  # id da task mãe, se for filha
filhas: []            # ids das filhas
pendencias:           # revisao-humana | teste-manual | teste-navegador | conflito | ci-falhando | sem-spec | aguarda-filha-<id>
  - revisao-humana
adrs: []              # ADRs e convenções que se aplicam (caminhos)
spec_path:            # spec versionada do projeto (specs/...), se o projeto usa; senão a spec fica neste arquivo
atualizado_em: 2026-11-27T09:10:00-03:00
---

## Contexto
## Escopo
## Fora de escopo
## Regras do contexto que se aplicam
- <regra> (fonte: context/adr/0007-paginacao.md)
## Desenho
- Atores, núcleo, portas/adaptadores, composição, direção das dependências
- Requisitos não funcionais e trade-off assumido
## Critérios de aceite
- [ ] CA-1: Dado <...>, quando <...>, então <...>. Verificação: teste-automatizado. Evidência: pendente
- [ ] CA-2: <...>. Verificação: revisao-humana. O que olhar: <...>
- [ ] CA-3: <...>. Verificação: teste-navegador. Passo a passo: <...>
## Riscos
## Plano em passos pequenos
1. ...
## Log
- 2026-11-27 09:10 gate: CA1 ok (filtro.spec.ts), CA2 sem evidência.
```

Campos de `fase` e `gate` usam exatamente os valores listados: o painel depende deles. Datas em ISO com fuso (`2026-11-27T09:10:00-03:00`). Sempre atualize `atualizado_em` quando mexer no arquivo.

## Blocos de parada (no corpo da task)

`## Decisão necessária` e `## Trabalho novo descoberto`: formato em `regras.md`. O painel mostra a linha "O que é" de cada um no topo.

Quando a pessoa responde, ela escreve abaixo do bloco uma linha `- Resposta: ...`. Ao retomar, o agente move o bloco inteiro (com a resposta) para o `## Log`, como `- <data> decisão: <resumo> → <resposta>`, e volta a `fase` para o valor de `fase_anterior`.

## events.log

```
node KIT/ws.mjs event evento=<nome> [task=<id>] [resultado=<x>] [chave=valor ...]
```

`task` e `agente` são deduzidos da branch e do worktree quando omitidos. O comando também regera o painel. Eventos usados: `sync`, `spec-criada`, `spec-aprovada`, `passo-concluido`, `teste`, `criterio-cumprido`, `gate`, `commit`, `push`, `pr-aberto`, `decisao-necessaria`, `trabalho-novo`, `retomada`, `agente-iniciado`, `agente-parado`, `agente-finalizado`. Os hooks já gravam `commit`, `push`, `pr-aberto`, `teste`, `task-atualizada`, `agente-parado` e `subagente-finalizado` sozinhos. O `teste` sai com `resultado=ok`, `falhou` ou `interrompido`; commit, push e PR cujo comando falhou não são gravados. No modo projeto, os hooks entendem `cd <repo> && ...` e `git -C <repo> ...`, deduzem a task pela branch daquele repositório e acrescentam `repo=<caminho>` em `commit`, `push`, `pr-aberto` e `teste`.
