---
name: spec
description: Cria a spec de uma task (contexto, escopo, critérios de aceite testáveis, plano) no .work-state/ do repositório e para esperando a minha aprovação.
disable-model-invocation: true
---

> **Caminhos.** `KIT` = pasta `kit/` na raiz deste plugin (`../../kit/` a partir da pasta desta skill). `SAF` = skill `software-architecture-foundations` (`../software-architecture-foundations/`). Use os caminhos absolutos resolvidos a partir do diretório base desta skill.

Task: $ARGUMENTS

Leia antes, inteiros: `KIT/regras.md` e `KIT/formato.md`.

Se `$ARGUMENTS` for `aprovar <id>` ou `aprovada <id>`: é a pessoa aprovando. Mude `spec_aprovada: true` e `fase: spec-aprovada` em `tasks/<id>.md`, rode `ws.mjs event evento=spec-aprovada task=<id>` e pare. Nunca faça isso por iniciativa própria.

Caso contrário:

1. `node KIT/ws.mjs dir`; se não existir `.work-state/`, rode `ws.mjs init`.
2. Contexto vivo: siga a seção 1 de `regras.md` (context-status, refazer o resumo se velho, ler o resumo).
3. Leia a task no Azure DevOps (MCP): título, descrição, critérios já escritos, comentários, links para mãe e filhas. Sem MCP, peça a descrição à pessoa.
4. Explore o código afetado **sem alterar nada**. Identifique o subprojeto (front, back) e as regras de contexto que valem para ele.
5. Arquitetura: leia `SAF/SKILL.md` (fluxo A) e `SAF/references/spec-driven.md`; se a stack for TypeScript, Node ou React, também `SAF/references/typescript-react.md`; para requisitos não funcionais, `SAF/references/software-engineering.md`. Com isso:
   - valide o requisito (válido, consistente, completo, realista, verificável); critério vago ("rápido", "seguro") vira versão mensurável ou pergunta;
   - separe requisitos funcionais e não funcionais; identifique atores, núcleo (entidades e casos de uso), portas e fronteiras **usando a estrutura que o projeto já tem**.
6. Liste o que estiver ambíguo e **pergunte antes de escrever**. Se a pessoa não estiver presente (sessão headless), pare como em `regras.md` seção 3. Se o desenho exigir estrutura nova (camada, padrão, biblioteca, pasta), isso também é pergunta: traga a recomendação com o princípio da SAF e o trade-off (`regras.md` seção 0).
7. Onde a spec mora: se o projeto versiona specs (`specs/` ou equivalente), escreva lá no formato do projeto e grave `spec_path` na task; senão, no próprio `tasks/<id>.md`. Escreva no formato de `formato.md`, preservando log e campos já existentes:
   - `## Contexto`, `## Escopo`, `## Fora de escopo`;
   - `## Regras do contexto que se aplicam`: cada ADR ou convenção relevante, com caminho; espelhe os caminhos em `adrs`;
   - `## Desenho`: atores, núcleo, portas e adaptadores, onde ocorre a composição, direção das dependências; requisitos não funcionais e o trade-off assumido. Proporcional ao tamanho da task: numa task pequena, duas linhas bastam;
   - `## Critérios de aceite`: ids `CA-1`, `CA-2`..., cada um observável e testável (preferir Dado/quando/então), com `Verificação: teste-automatizado | revisao-humana | teste-navegador`. Para revisão humana, diga o que olhar; para navegador, o passo a passo. Os critérios automatizados são a lista de testes da implementação;
   - `## Riscos`;
   - `## Plano em passos pequenos`: passos que cabem num commit, cada um dizendo qual critério avança e se é lógica (test-first) ou cola/layout (teste de integração ou nenhum);
   - `branch: feat/<id>-<slug-curto>` se ainda não houver.
8. Marque `fase: spec`, `spec_aprovada: false`, `gate: nao-rodou`, `atualizado_em`.
9. Rode `ws.mjs event evento=spec-criada task=<id> ca_total=<n>`.
10. Pare. Mostre os critérios de aceite e os pontos de risco e diga: para aprovar, edite `spec_aprovada: true` ou rode `/spec aprovar <id>`. Nunca aprove sozinho.
