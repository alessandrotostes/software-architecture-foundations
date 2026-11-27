# Spec-Driven Development e Context Engineering

Como esta skill se encaixa num fluxo em que cada funcionalidade parte de uma especificação
escrita e o projeto mantém documentação viva para agentes de IA.

## 1. Ideia central

- **Spec-Driven Development (SDD):** o requisito é escrito antes do código, num formato que
  humano e agente leem igual. A spec é a fonte da verdade; o código é a implementação dela.
- **Context Engineering:** o projeto mantém, versionado junto do código, o contexto que um
  agente precisa para trabalhar bem — visão do sistema, convenções, decisões e glossário —
  em vez de depender do que cabe numa conversa.
- Os dois reforçam os livros desta skill: Sommerville pede requisitos verificáveis e
  rastreáveis; Beck pede uma lista de testes antes de codar; Martin pede decisões de
  arquitetura explícitas e adiáveis.

## 2. Estrutura sugerida (adapte ao projeto)

```
CONTEXT.md                 ← visão do sistema, stack, convenções, glossário do domínio
docs/
  adr/                     ← decisões arquiteturais (uma por arquivo, numeradas)
    0007-cupons-validados-no-servidor.md
specs/
  cupons/
    spec.md                ← o quê e por quê: requisitos e critérios de aceite
    plan.md                ← como: fronteiras, portas, tarefas (opcional)
```

Se o projeto usa outra convenção (Spec Kit, Memory Bank, vault no Obsidian), siga a dele.

## 3. Fluxo do agente

1. **Antes de tudo, carregue o contexto:** `CONTEXT.md`, a spec da tarefa e os ADRs que tocam
   o módulo. Não reabra decisão registrada em ADR sem dizer explicitamente que está propondo mudá-la.
2. **Valide a spec** com os critérios de Sommerville: válida, consistente, completa, realista,
   verificável. Critério de aceite vago ("rápido", "seguro") → proponha versão mensurável ou pergunte.
3. **Critérios de aceite → lista de testes.** Cada critério vira ao menos um teste nomeado de
   forma rastreável (ex.: `it('CA-3: deve recusar cupom expirado')`).
4. **Plano antes do código:** identifique atores, núcleo, portas e fronteiras (fluxo A do SKILL.md)
   e registre no `plan.md` ou no PR.
5. **Implemente com TDD** nos casos de uso e regras (fluxo B).
6. **Feche o ciclo de contexto:**
   - decisão arquitetural nova ou alterada → novo ADR;
   - convenção nova (pasta, padrão de nome, biblioteca adotada) → atualizar `CONTEXT.md`;
   - comportamento mudou → atualizar a spec. Spec e código desalinhados são defeito.

## 4. Modelo de ADR (curto)

```markdown
# ADR 0007 — Cupons validados apenas no servidor

- Status: aceito · Data: 2026-11-25
- Contexto: o cliente disparava várias validações por digitação, gerando custo e risco de fraude.
- Decisão: validação e cálculo do desconto ficam no caso de uso `applyCoupon`; o front só exibe.
- Consequências: + regra única e testável; − uma chamada a mais no checkout (mitigada com cache por hash).
- Alternativas descartadas: validar no cliente (inseguro); validar nos dois (duplicação acidental).
```

## 5. Modelo de critério de aceite

```markdown
CA-3 — Dado um cupom com data de validade passada,
       quando o cliente aplica o cupom no checkout,
       então o desconto não é aplicado e a mensagem "Cupom expirado" é exibida.
```

## 6. Sinais de problema

- Código mergeado sem a spec correspondente atualizada.
- ADR que ninguém lê porque `CONTEXT.md` não aponta para eles.
- Documentação viva longa demais para caber no contexto do agente: resuma e aponte para detalhes,
  em vez de colar tudo (a mesma divulgação progressiva que esta skill usa).
- Critérios de aceite sem teste correspondente.
