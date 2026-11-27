---
name: gate
description: Confere cada critério de aceite de uma task do .work-state/ com evidência real (teste rodado, comando, diff) e relata sem corrigir nada. Use ao terminar uma implementação ou antes de push e PR.
context: fork
---

> **Caminhos.** `KIT` = pasta `kit/` na raiz deste plugin (`../../kit/` a partir da pasta desta skill). `SAF` = skill `software-architecture-foundations` (`../software-architecture-foundations/`). Use os caminhos absolutos resolvidos a partir do diretório base desta skill.

Task: $ARGUMENTS

Você avalia o resultado sem a influência da conversa que escreveu o código. Não corrija nada: só confira e relate. Na dúvida, o critério **não** passa.

Leia antes, inteiros: `KIT/regras.md` e `KIT/formato.md`.

1. Estado: `node KIT/ws.mjs dir`; leia `tasks/<id>.md` e `context-summary.md` (se estiver velho segundo `ws.mjs context-status`, refaça como em `regras.md` seção 1).
2. Diff: `git diff --stat <base>...HEAD` e `git diff <base>...HEAD`, com `<base>` sendo a branch padrão (`git symbolic-ref refs/remotes/origin/HEAD`, ou `main`/`master`/`develop`). Inclua alterações não commitadas, se houver, e aponte que existem. No modo projeto, faça isso em cada repositório de `repos` (`git -C <caminho> diff <base>...HEAD`), com `<base>` vindo de `config.repos`.
3. Para cada critério de aceite:
   - `teste-automatizado`: localize o teste que cobre o critério (procure pelo id `CA-n` no nome), rode-o e leia a saída. Passa só se o teste existe, roda, passa e de fato verifica o comportamento descrito. Marque `[x]` com `Evidência: <arquivo do teste> — <comando> passou`. Sem teste, ou teste que não verifica o critério: `[ ]` com o motivo.
   - `revisao-humana`: deixe `[ ]`, garanta a pendência `revisao-humana` e escreva o que olhar (arquivos e linhas).
   - `teste-navegador`: deixe `[ ]`, garanta a pendência `teste-navegador` e escreva o passo a passo.
   Não aceite afirmação do log ou do agente como evidência.
4. Rode também lint, typecheck e a suíte de testes do subprojeto afetado (no modo projeto, de cada repositório de `repos`, rodando dentro dele). Qualquer falha reprova o gate.
5. Escopo: compare o diff com `## Escopo` e `## Fora de escopo`. Liste toda alteração fora dele, toda dependência nova, alteração de contrato de API ou migration não prevista.
6. Contexto: para cada regra em `## Regras do contexto que se aplicam` (e as do resumo que valem para os arquivos alterados), diga se o diff respeita, com o trecho que mostra isso. Violação reprova o gate.
6b. Arquitetura: revise o diff com `SAF/references/review-checklist.md` (perguntas na ordem dele, tabela cheiro → remédio, formato de achado com severidade). Use `SAF/references/typescript-react.md` se a stack for essa. Avalie só o que o diff introduz ou piora, não o legado em volta. Classifique:
   - **Bloqueante** (bug, falha de proteção, regra nova sem teste, dado de outro tenant acessível, entrada externa sem validação): reprova o gate;
   - **Importante** (violação de dependência ou fronteira que vai se espalhar, ciclo, responsabilidade misturada): não reprova, mas vira pendência `revisao-humana` com o achado;
   - **Sugestão** e **Nit**: só no `## Log`.
   Se a implementação pulou um princípio da SAF, confira se a justificativa está no `## Log`; sem justificativa, é achado Importante. Divergência de ADR do projeto continua sendo violação (passo 6), mesmo que a SAF recomende outra coisa.
7. Filhas: se alguma filha que bloqueia a mãe (`aguarda-filha-<id>`) não está `pronta-merge`, o gate não passa.
8. Resultado:
   - `passou`: todos os critérios automatizáveis com evidência, lint/typecheck/testes ok, nada fora de escopo, nenhuma violação de regra, sem filha bloqueando. Critérios de revisão humana ou navegador pendentes **não** impedem `passou`, mas ficam em `pendencias`.
   - `parcial`: nada quebrado, mas falta evidência para algum critério automatizável.
   - `falhou`: teste, lint ou typecheck falhando, violação de regra, ou alteração fora do escopo.
9. Grave no arquivo da task: checkboxes, `gate`, `pendencias`, `atualizado_em` e uma linha no `## Log` com o resumo (`gate parcial: CA1 ok, CA2 sem teste, fora do escopo: src/x.ts`).
10. Rode `ws.mjs event evento=gate task=<id> resultado=<passou|parcial|falhou> ca_ok=<n> ca_total=<n>`.
11. Responda com uma tabela curta (critério, resultado, evidência ou motivo), a lista do que está fora do escopo ou viola regra, e os achados de arquitetura Bloqueantes e Importantes no formato do checklist.
