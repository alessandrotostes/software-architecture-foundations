---
name: sync
description: Atualiza o .work-state/ do repositório atual com as tasks do Azure DevOps, os PRs e o CI. Só coleta, não decide nem altera código.
disable-model-invocation: true
---

> **Caminhos.** `KIT` = pasta `kit/` na raiz deste plugin (`../../kit/` a partir da pasta desta skill). `SAF` = skill `software-architecture-foundations` (`../software-architecture-foundations/`). Use os caminhos absolutos resolvidos a partir do diretório base desta skill.

Atualize o estado local do repositório atual a partir das fontes reais. Não altere código, não crie PRs, não crie nem edite work items.

Leia antes: `KIT/formato.md`.

1. Rode `node KIT/ws.mjs dir`. Se o `.work-state/` não existir, rode `ws.mjs init` e avise que criou (e que ele ficou só no `.git/info/exclude`). Leia `.work-state/config.json`.
2. Identifique o repositório pelo `git remote get-url origin`. Se `config.json` não tiver `ado_url`, `ado_projeto` ou o nome do repositório no Azure DevOps, deduza do remote quando for `dev.azure.com` e grave; senão pergunte e grave a resposta.
3. Via MCP do Azure DevOps, liste os work items **atribuídos a mim** e em andamento (não fechados nem removidos) **ligados a este repositório**: por branch ou PR vinculado, pela área configurada em `ado_area` ou, sem isso, pelos que já têm arquivo em `tasks/`. Se não houver ferramenta do Azure DevOps disponível nesta sessão, diga isso e siga só com PRs e CI.
4. Para cada task, crie ou atualize `tasks/<id>.md`: atualize só `titulo`, `url`, `repo` e, se a task ainda não tiver fase, `fase: nova`. **Preserve** spec, critérios, log, blocos de decisão e os demais campos.
5. Para cada task com `branch` (ou branch remota que contenha o id):
   - GitHub (`github.com` no remote): `gh pr list --head <branch> --state all --json number,url,state,mergeable` e `gh pr checks <n>`.
   - Azure Repos: ferramentas de PR do MCP do Azure DevOps (ou `az repos pr list --source-branch <branch>` se o `az` estiver instalado).
   - Atualize `pr`, `pr_url`, `ci` (`passando`, `falhando`, `pendente`, `sem-pr`). PR mergeado: `fase: pronta-merge` só se o gate passou; se já foi mergeado, anote no log.
6. Recalcule `pendencias` de cada task, mantendo as que você não sabe calcular (como `aguarda-filha-*`):
   - `sem-spec`: sem `## Critérios de aceite`;
   - `ci-falhando`: `ci: falhando`;
   - `conflito`: PR com conflito de merge;
   - `revisao-humana`, `teste-navegador`, `teste-manual`: critérios desse tipo ainda `[ ]`.
7. Atualize `atualizado_em` de cada arquivo alterado.
8. Rode `ws.mjs event evento=sync task=- total=<n>` (isso também regera o painel).
9. Responda em até cinco linhas: quantas tasks, quais mudaram de fase, quais têm CI falhando ou conflito.
