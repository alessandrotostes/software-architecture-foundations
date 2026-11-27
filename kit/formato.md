# Formato do estado por repositório

Todo o estado vive em `<raiz-do-repositorio-principal>/.work-state/`, excluído do git por `.git/info/exclude` (nunca pelo `.gitignore` do time). Worktrees usam o mesmo `.work-state/` da raiz principal: descubra o caminho com

```
node KIT/ws.mjs dir
```

```
.work-state/
  config.json           # repo, ado_url, ado_projeto, ado_area, max_agentes
  tasks/<id>.md         # estado e spec de cada task (frontmatter + corpo)
  events.log            # um evento por linha (só acrescentar, nunca reescrever)
  context-summary.md    # regras do contexto vivo, cada uma com o arquivo de origem
  index.json            # GERADO pelo ws.mjs render: não editar à mão
  dashboard.html        # GERADO pelo ws.mjs render: não editar à mão
```

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
repo: nome-do-repositorio
branch: feat/1234-filtro-periodo
worktree: C:/Users/voce/worktrees/nome-do-repositorio-1234
fase: implementando   # nova | spec | spec-aprovada | implementando | gate | revisao | teste-manual | pronta-merge | bloqueada | aguardando-decisao
fase_anterior:        # preenchida ao entrar em aguardando-decisao, para retomar depois
spec_aprovada: false  # SÓ a pessoa muda para true
agente: wt-1234
iniciado_em:
pr: 87
pr_url:
ci: pendente          # passando | falhando | pendente | sem-pr
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

`task` e `agente` são deduzidos da branch e do worktree quando omitidos. O comando também regera o painel. Eventos usados: `sync`, `spec-criada`, `spec-aprovada`, `passo-concluido`, `teste`, `criterio-cumprido`, `gate`, `commit`, `push`, `pr-aberto`, `decisao-necessaria`, `trabalho-novo`, `retomada`, `agente-iniciado`, `agente-parado`, `agente-finalizado`. Os hooks já gravam `commit`, `push`, `pr-aberto`, `teste`, `task-atualizada`, `agente-parado` e `subagente-finalizado` sozinhos. O `teste` sai com `resultado=ok`, `falhou` ou `interrompido`; commit, push e PR cujo comando falhou não são gravados.
