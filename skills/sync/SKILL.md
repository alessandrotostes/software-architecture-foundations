---
name: sync
description: Busca no Azure DevOps as tasks disponíveis para o repositório ou projeto atual, pergunta quais vão ser trabalhadas, traz só essas para o .work-state/ e atualiza as que já estão lá com PRs e CI. Não decide nem altera código.
disable-model-invocation: true
---

> **Caminhos.** `KIT` = pasta `kit/` na raiz deste plugin (`../../kit/` a partir da pasta desta skill). `SAF` = skill `software-architecture-foundations` (`../software-architecture-foundations/`). Use os caminhos absolutos resolvidos a partir do diretório base desta skill.

Argumentos: $ARGUMENTS
- vazio: busca as tasks disponíveis, pergunta quais entram e atualiza as que já estão no painel;
- `atualizar`: pula a busca e a pergunta, só atualiza as que já estão no painel (é o que o `/painel` usa);
- ids (`/sync 101 102`): esses entram direto, sem perguntar.

Atualize o estado local a partir das fontes reais. Não altere código, não crie PRs, não crie work items. Alterar um work item (por exemplo, atribuí-lo a mim) só com o sim explícito da pessoa.

Leia antes: `KIT/formato.md`.

1. Rode `node KIT/ws.mjs dir`. Se o `.work-state/` não existir, rode `ws.mjs init` e avise que criou: no modo repositório ele fica só no `.git/info/exclude`; no modo projeto, na pasta do projeto, que não é versionada. Leia `.work-state/config.json`. No modo projeto (`modo: projeto`), os repositórios estão em `repos`; se apareceu repositório novo na pasta, rode `ws.mjs init` de novo.
2. Azure DevOps: o `config.json` guarda `ado_url`, `ado_projeto` e `ado_area`.
   - `ado_url` e `ado_projeto`: deduza do remote quando for `dev.azure.com` (no modo projeto, do `remote` de qualquer item de `repos` que não seja `contexto`); senão pergunte e grave. No modo projeto, valem para o projeto todo.
   - `ado_area` (Area Path do sistema) é o que define "disponível para este sistema". Se faltar, liste as áreas do projeto via MCP, pergunte qual e grave.
   - Se não houver ferramenta do Azure DevOps nesta sessão, diga isso e pule para o passo 5.
3. **Busque as tasks disponíveis** (pule com `atualizar` ou com ids nos argumentos). Via MCP do Azure DevOps (consulta WIQL ou busca de work items), traga os work items:
   - abertos: estado que, no processo do projeto, não seja de fechado, concluído ou removido;
   - dos tipos de trabalho do time (Task, Bug, User Story ou Product Backlog Item);
   - na área `ado_area`, incluindo subáreas;
   - **atribuídos a mim ou sem responsável**.
   Dê preferência à iteração atual. Se passar de 30, mostre as 30 de maior prioridade e alteração mais recente e diga quantas ficaram de fora.
4. **Pergunte quais entram** (pule com `atualizar`; com ids nos argumentos, use esses):
   - Mostre uma tabela: id, tipo, título, estado, responsável (`eu` ou `sem responsável`), repositório provável e se já está no painel. Repositório provável: pela branch ou PR já ligados ao work item; no modo projeto, qual item de `repos`; `?` quando não der para saber (a spec decide).
   - Pergunte quais ids vão ser trabalhados. Lembre que cada task escolhida pode rodar em paralelo depois, com `/dispatch`, até `max_agentes` ao mesmo tempo (padrão 2).
   - Para cada escolhida sem responsável, pergunte se pode atribuí-la a mim no Azure DevOps e só atribua com o sim (`regras.md` seção 5). Sem o sim, ela entra mesmo assim, com `- <data> sync: sem responsável no Azure DevOps` no `## Log`.
   - Crie `tasks/<id>.md` só para as escolhidas: `id`, `titulo`, `url`, `repo` (no modo projeto, `repos` com os repositórios prováveis, se souber), `fase: nova`, `atualizado_em`.
   - Sessão sem pessoa presente (headless): não pergunte e não crie task nova; siga só com as que já estão no painel.
5. Para cada task que já está em `tasks/`: atualize só `titulo`, `url`, `repo` (no modo projeto, `repos`: os repositórios onde a task tem branch ou PR) e, se a task ainda não tiver fase, `fase: nova`. **Preserve** spec, critérios, log, blocos de decisão e os demais campos. Se o work item foi fechado ou removido no Azure DevOps, anote no `## Log`; não apague o arquivo.
6. Para cada task com `branch` (ou branch remota que contenha o id):
   - GitHub (`github.com` no remote): `gh pr list --head <branch> --state all --json number,url,state,mergeable` e `gh pr checks <n>`.
   - Azure Repos: ferramentas de PR do MCP do Azure DevOps (ou `az repos pr list --source-branch <branch>` se o `az` estiver instalado).
   - Atualize `pr`, `pr_url`, `ci` (`passando`, `falhando`, `pendente`, `sem-pr`). PR mergeado: `fase: pronta-merge` só se o gate passou; se já foi mergeado, anote no log e lembre que `node KIT/ws.mjs worktree remove <id>` apaga os worktrees da task, se houver.
   - Modo projeto: faça isso em cada repositório de `repos`, rodando os comandos dentro dele (`cd <caminho> && gh pr list ...`). Grave `prs: [<caminho>#<n>, ...]` e, em `ci`, o pior estado entre os PRs.
7. Recalcule `pendencias` de cada task, mantendo as que você não sabe calcular (como `aguarda-filha-*`):
   - `sem-spec`: sem `## Critérios de aceite`;
   - `ci-falhando`: `ci: falhando`;
   - `conflito`: PR com conflito de merge;
   - `revisao-humana`, `teste-navegador`, `teste-manual`: critérios desse tipo ainda `[ ]`.
8. Atualize `atualizado_em` de cada arquivo alterado.
9. Rode `ws.mjs event evento=sync task=- total=<n>` (isso também regera o painel).
10. Responda em até cinco linhas: quantas tasks estão no painel, quais entraram agora, quais mudaram de fase, quais têm CI falhando ou conflito e, se houver, quantas disponíveis ficaram de fora. Próximo passo sugerido: `/spec <id>` para as novas.
