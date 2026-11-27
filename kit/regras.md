# Regras comuns a todas as skills do ecossistema

Leia este arquivo inteiro antes de agir. Estas regras valem para `/spec`, `/implement`, `/gate`, `/dispatch` e `/sync`.

## 0. Convivência com a skill software-architecture-foundations

As duas skills têm papéis diferentes e se completam:

| | Ecossistema de tasks (este kit) | software-architecture-foundations |
| --- | --- | --- |
| Responde | **quando** e **com que controle**: fase, aprovação, evidência, parada, painel | **como** projetar, testar e revisar o código |
| Dono de | arquivo de estado, critérios com evidência, blocos de decisão, gate | princípios, fluxos A–D, checklist de revisão, referências |
| Onde fica | `kit/` e as skills `spec`, `implement`, `gate`, `dispatch`, `sync`, `painel` deste plugin (`KIT`) | `skills/software-architecture-foundations/` deste plugin (`SAF`) |

**Ordem de precedência**, da mais forte para a mais fraca:

1. Decisão da pessoa registrada na task (resposta num bloco de decisão).
2. Contexto vivo do projeto: ADRs, `CLAUDE.md`, `CONTEXT.md`, `AGENTS.md`, convenções do subprojeto.
3. Princípios da `SAF/SKILL.md`: valem como **padrão** onde o projeto não decide.
4. Preferência do agente: não conta.

Como resolver os encontros entre as duas:

- **ADR contra princípio da SAF:** vale o ADR. Siga o ADR e, se achar que ele encarece a mudança, anote no `## Log` como observação de arquitetura. Não desvie e não pare por isso. Reabrir o ADR é decisão da pessoa.
- **Contexto silencioso:** aplique os princípios da SAF **dentro da estrutura que o projeto já tem** (nomes, pastas, camadas, bibliotecas existentes). Introduzir estrutura nova (camada, padrão adotado no repositório todo, pasta de topo, biblioteca, convenção de nomes) é inventar convenção: pare (seção 3) e traga a recomendação baseada na SAF, com o trade-off. A SAF vira o argumento da recomendação, não autorização.
- **"Feche o ciclo de contexto" (SAF `references/spec-driven.md`):** continua valendo, mas passa pela pessoa. Decisão arquitetural nova → o bloco de decisão leva um **rascunho de ADR** no modelo da SAF; o agente só grava o ADR na pasta do projeto depois do sim. Convenção nova → idem para `CONTEXT.md`/`CLAUDE.md`. Comportamento mudou → a spec volta para aprovação (`/spec`).
- **Onde mora a spec:** se o projeto já versiona specs (`specs/`, Spec Kit, Memory Bank), a spec canônica vai lá, no formato do projeto, e o `tasks/<id>.md` guarda só estado, critérios com evidência e log, com `spec_path` apontando para ela. Se não versiona, a spec fica no `tasks/<id>.md`. Nunca crie a pasta `specs/` num projeto que não a usa.
- **Test-first:** segue a SAF (princípio 9). Critério com regra de negócio ou lógica com decisão: teste antes do código, nomeado com o id do critério (`it('CA-2: deve … quando …')`). Cola, configuração e layout sem lógica: teste de integração/e2e do fluxo ou nenhum, e o motivo vai no `## Log`.
- **Proporcionalidade:** a SAF diz para não aplicar regra que não reduz custo de mudança. Ao pular uma, escreva o porquê no `## Log`: o gate cobra a justificativa, não a regra.

## 1. Contexto vivo do repositório

Antes de qualquer spec, implementação ou gate:

1. Rode `node KIT/ws.mjs context-status`.
2. Se `desatualizado` for `true`, refaça `.work-state/context-summary.md`:
   - leia cada arquivo listado em `fontes`, nesta ordem: `CLAUDE.md` da raiz e de cada subprojeto; pasta de contexto (`context/`, `docs/`, `adr/` ou equivalente): ADRs, convenções, padrões de API, regras de domínio, glossário; configurações (lint, tsconfig, scripts do `package.json`, estrutura de pastas);
   - escreva uma regra por linha, agrupada por escopo (`raiz`, `frontend/`, `backend/`...), cada uma com o arquivo de origem: `- Datas sempre em UTC na API (fonte: context/adr/0003-datas.md)`;
   - liste no fim, em `## Conflitos`, qualquer par de regras que se contradiz;
   - se nada mudou de fato, ainda assim regrave o arquivo para atualizar a data.
3. Leia `.work-state/context-summary.md` e trate cada regra como **obrigatória**.

Como aplicar:

- ADRs e convenções são obrigatórias. A spec cita quais se aplicam (campo `adrs` e seção `## Regras do contexto que se aplicam`). O gate confere o diff contra cada uma.
- Regra de subprojeto vale para os arquivos dele; regra da raiz vale para todos.
- Conflito entre regras é dúvida, não escolha: pare (seção 3).
- Nada de inventar convenção: se o contexto não cobre o caso, aplique a SAF dentro da estrutura existente; se o caso pede estrutura nova, pare (seção 0).
- O `context-summary.md` lista só regras do projeto. Os princípios da SAF não são copiados para ele: são lidos direto da skill.

## 2. Evidência, não declaração

Um critério só fica `[x]` com evidência apontada: teste que rodou e passou (com o nome), comando e saída, ou resposta da pessoa. Nunca porque o agente afirmou. Nenhuma skill muda `spec_aprovada` para `true`: só a pessoa.

## 3. Quando parar para decisão humana

Pare se acontecer qualquer um destes:

- requisito ambíguo ou critério de aceite que não dá para testar;
- a solução exigiria contrariar uma ADR ou convenção;
- contexto ausente ou contraditório para a decisão em jogo;
- o mesmo erro após duas tentativas de correção **diferentes**;
- mudança fora do escopo da spec, alteração de contrato de API, migration de banco ou dependência nova.

Como parar:

1. Copie o valor atual de `fase` para `fase_anterior` e mude `fase` para `aguardando-decisao`. Atualize `atualizado_em`.
2. Acrescente ao arquivo da task:

```markdown
## Decisão necessária
- O que é: <a decisão, em uma frase>
- Por que parei: <qual regra de parada foi acionada>
- Como cheguei aqui: <passos feitos e o que foi tentado>
- Causa do erro (se houver): <mensagem e análise>
- Contexto envolvido: <ADRs e convenções, com caminho do arquivo>
- Opções: <A e B, com prós, contras e impacto de cada uma>
- Recomendação: <qual e por quê, sem aplicar>
```

3. Rode `ws.mjs event evento=decisao-necessaria motivo="<regra acionada>"`.
4. Encerre o trabalho e diga, na resposta, a decisão em uma frase e onde está o bloco. Não continue em outra parte da task "enquanto isso".

Se a decisão for arquitetural (fronteira, camada, padrão, biblioteca, contrato), acrescente ao bloco um `- Rascunho de ADR:` no modelo de `SAF/references/spec-driven.md` (Status: proposto). As opções e a recomendação citam o princípio da SAF em jogo e o trade-off.

Só retome quando houver `- Resposta:` abaixo do bloco (ou a pessoa responder no chat; nesse caso, escreva a resposta no bloco antes). Ao retomar: mova o bloco com a resposta para o `## Log`, volte `fase` para `fase_anterior`, rode `ws.mjs event evento=retomada`. Se a resposta aprovar o rascunho de ADR, grave-o na pasta de ADRs do projeto (numeração e formato do projeto, Status: aceito) e inclua o caminho em `adrs` da task. Sem rascunho aprovado, não crie ADR.

## 4. Trabalho novo descoberto no meio da task

Não amplie a task por conta própria. Conta como trabalho novo: algo necessário fora do escopo e dos critérios; bug ou dívida técnica no caminho, mesmo pequeno; mudança que afeta outro módulo, outro subprojeto ou contrato de API; qualquer coisa que aumente visivelmente tamanho ou risco.

Pare como na seção 3 (fase `aguardando-decisao`, `fase_anterior` preenchida, evento `trabalho-novo`), com este bloco:

```markdown
## Trabalho novo descoberto
- O que é: <descrição em uma frase>
- Como foi descoberto: <o que estava fazendo quando encontrou>
- Bloqueia a task mãe? <sim ou não, e por quê>
- Impacto se ficar para depois: <risco>
- Tamanho estimado: <pequeno, médio ou grande>
- Proposta: criar task filha? <sim ou não>
- Respostas possíveis: 1) criar task filha  2) incluir na task atual  3) ignorar por agora
```

Conforme a resposta:

1. **Criar task filha**: crie o work item no Azure DevOps (via MCP) ligado à mãe, **só com o sim explícito da pessoa**. Crie `tasks/<id-filha>.md` com `mae: <id-mae>`, `fase: spec`, `spec_aprovada: false` e um rascunho de spec. Acrescente o id em `filhas` da mãe. Se a mãe depende da filha: mãe com `fase: bloqueada` e pendência `aguarda-filha-<id>`; senão a mãe continua.
2. **Incluir na task atual**: atualize escopo e critérios da mãe, mude `spec_aprovada: false` e `fase: spec`, e pare para nova aprovação.
3. **Ignorar por agora**: registre no `## Log` da mãe como pendência conhecida e continue.

O gate da mãe não passa enquanto houver filha que a bloqueia ainda aberta.

## 5. Coisas que nenhuma skill faz sem o sim da pessoa

Aprovar spec; criar ou alterar work item no Azure DevOps; abrir PR com gate diferente de `passou`; fazer merge; adicionar dependência; mexer em contrato de API ou migration; criar ADR. E nada interno da empresa sai do `.work-state/` para lugar público.
