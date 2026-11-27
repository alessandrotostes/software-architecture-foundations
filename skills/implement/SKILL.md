---
name: implement
description: Implementa uma task a partir da spec aprovada no .work-state/, em passos pequenos com teste primeiro, parando para decisão humana quando as regras mandam.
disable-model-invocation: true
---

> **Caminhos.** `KIT` = pasta `kit/` na raiz deste plugin (`../../kit/` a partir da pasta desta skill). `SAF` = skill `software-architecture-foundations` (`../software-architecture-foundations/`). Use os caminhos absolutos resolvidos a partir do diretório base desta skill.

Task: $ARGUMENTS

Leia antes, inteiros: `KIT/regras.md` e `KIT/formato.md`.

O caminho do estado é `node KIT/ws.mjs dir` (num worktree ele aponta para o `.work-state/` do repositório principal; no modo projeto, para o da pasta do projeto; se a variável `WORK_STATE_DIR` estiver definida, ela manda).

Num agente do `/dispatch`, a pasta de trabalho é o `worktree` da task. No modo projeto ela é `.worktrees/<id>/`, com a mesma estrutura da pasta do projeto, então os caminhos de `repos` (`backend`, `frontend`...) valem igual nos dois casos.

1. Leia `tasks/<id>.md`.
   - Se `spec_aprovada` não for `true`: pare e avise.
   - Se `fase` for `aguardando-decisao`: só continue se houver `- Resposta:` no bloco; então retome como em `regras.md` seção 3. Senão, pare e repita qual decisão falta.
   - Se `fase` for `bloqueada`: pare e diga o que bloqueia.
2. Contexto vivo: seção 1 de `regras.md`. Releia as regras listadas na spec (e a spec em `spec_path`, se houver). Arquitetura: leia `SAF/SKILL.md` (fluxos B, C e D) e `SAF/references/tdd.md`; para TypeScript, Node ou React, `SAF/references/typescript-react.md`; ao considerar um padrão de projeto, `SAF/references/design-patterns.md`. A precedência entre projeto e SAF está em `regras.md` seção 0.
3. Confirme que está na branch da task (`branch`). Se não estiver e não houver alterações locais, crie ou troque para ela; se houver alterações de outra coisa, pare e avise. No modo projeto, faça isso em cada repositório de `repos` (`git -C <caminho> ...`), criando a branch a partir da `base` daquele repositório em `config.repos`. Num worktree do `/dispatch` a branch já está certa; se ele é novo, instale as dependências de cada repositório com o comando do projeto (o do `package.json` ou equivalente) antes do primeiro teste.
4. Marque `fase: implementando`, `agente` (se vazio), `atualizado_em`. Rode `ws.mjs event evento=agente-iniciado`.
5. Para cada passo do plano, em ordem:
   1. se o passo é lógica (regra de negócio, caso de uso, decisão): escreva antes o teste do critério, nomeado com o id (`it('CA-2: deve … quando …')`), e confirme que ele falha. Se é cola, configuração ou layout sem lógica: teste de integração/e2e do fluxo ou nenhum, com o motivo no `## Log`;
   2. implemente o mínimo para passar (Vermelho → Verde), respeitando as regras do contexto do subprojeto e a Regra da Dependência; depois refatore com os testes verdes;
   3. rode lint, typecheck e testes do subprojeto (use os scripts do projeto; no modo projeto, de cada repositório que o passo tocou, rodando dentro dele: `cd <caminho> && ...`). Bug encontrado no caminho e dentro do escopo: teste de regressão antes da correção; fora do escopo: trabalho novo (`regras.md` seção 4);
   4. faça um commit pequeno com mensagem que cite a task (no modo projeto, um em cada repositório que o passo tocou);
   5. acrescente ao `## Log` o que fez, e rode `ws.mjs event evento=passo-concluido passo=<n>`.
   A cada passo, confira as regras de parada (`regras.md` seções 3 e 4): ambiguidade, contrariar ADR, contexto ausente, erro repetido após duas correções diferentes, mudança fora do escopo, contrato de API, migration, dependência nova, trabalho novo. Se alguma disparar, pare do jeito descrito lá e encerre.
6. Ao terminar o plano, passe pelo checklist "D. Antes de entregar" da SAF e corrija o que for do escopo. Se o comportamento implementado divergiu da spec, pare: spec e código desalinhados são defeito e a spec volta para aprovação. Depois marque `fase: gate` e rode a skill `/gate <id>`.
7. Depois do gate:
   - `gate: passou` e nenhum critério automatizável pendente: pode fazer push e abrir o PR (o hook bloqueia push sem gate). Grave `pr`, `pr_url`. No modo projeto, um push e um PR em cada repositório com commits da task; grave `prs`. Se ainda há revisão humana ou teste no navegador, `fase: revisao` ou `teste-manual`; senão `pronta-merge`.
   - `gate` diferente de `passou`: não faça push. Se a falha for corrigível dentro do escopo, corrija e rode o gate de novo (no máximo duas vezes); senão pare como em `regras.md` seção 3.
8. Registre no `## Log` o que foi feito e o que ficou pendente. Rode `ws.mjs event evento=agente-finalizado resultado=<fase final>`.
9. Nunca faça merge.
