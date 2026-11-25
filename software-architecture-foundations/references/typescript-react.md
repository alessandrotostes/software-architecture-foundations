# Aplicação em TypeScript, Node.js e React

Como levar os princípios da skill para uma stack TS/JS, onde classes abstratas, `internal` e
ArchUnit não existem ou não são o caminho natural. Use junto com `clean-architecture.md`.

## 1. Tradução dos conceitos

| Conceito | Em TypeScript |
|---|---|
| Porta (interface do núcleo) | `interface` ou `type` declarado **no módulo de domínio/caso de uso**, nunca no adaptador |
| Adaptador | Classe ou objeto/função que implementa a porta, em `infra/` (Postgres, HTTP, SDK de nuvem) |
| Caso de uso / interactor | Função ou classe que recebe as portas por parâmetro: `makeApplyCoupon({ coupons, orders })` |
| Main / composição | Um único `main.ts` (ou `container.ts`) que instancia adaptadores e injeta nos casos de uso |
| Injeção de dependência | Parâmetros de função ou construtor. Framework de DI só se o projeto já usa (ex.: NestJS) |
| DTO na fronteira | `type` simples (sem métodos), validado na borda com Zod/Valibot |
| Entidade | Tipo + funções puras, ou classe sem dependência de ORM; nada de decorators do TypeORM no núcleo |
| Visibilidade (`internal`) | Exportar só pelo `index.ts` do módulo (API pública) e proibir import profundo por lint |

**Métrica A = Na/Nc:** em TS, conte como "abstratos" os arquivos que só exportam `interface`/`type`
(portas e contratos) e como "concretos" os que exportam implementação. A leitura da métrica é a
mesma: módulos muito usados devem ser majoritariamente contratos.

## 2. Estrutura de pastas que "grita" o domínio

```
src/
  coupons/                 ← módulo de domínio (por funcionalidade)
    domain/                ← entidades, regras puras, portas (interfaces)
    application/           ← casos de uso; dependem só de domain/
    infra/                 ← adaptadores: repositório Postgres, cliente HTTP
    index.ts               ← API pública do módulo
  orders/
  shared/                  ← só o que é realmente transversal e estável
  main.ts                  ← composição: único lugar que conhece todos os concretos
```

## 3. Impor as fronteiras com ferramenta

Camadas que só existem em convenção se degradam. Imponha no CI:

- **dependency-cruiser:** regras do tipo "`domain/` não pode importar `infra/`, `react`, `pg`,
  `express`, SDKs de nuvem"; "proibido ciclo entre módulos".
- **eslint-plugin-boundaries** ou `no-restricted-imports`: bloqueia import profundo
  (`coupons/infra/...` fora do próprio módulo) e direção errada entre camadas.
- **Project references / workspaces** (monorepo): separar o núcleo em pacote próprio faz o
  compilador recusar import de infraestrutura — o equivalente a "módulos separados por compilação".

## 4. Node.js (back-end)

- Controller/handler (Express, Fastify, Next.js route handler) só traduz: valida a entrada,
  chama o caso de uso, mapeia o resultado para HTTP. Regra de negócio fora dele.
- Repositório como porta: `interface CouponRepository { findByCode(tenantId, code) }` no domínio;
  implementação com Prisma/Drizzle/`pg` em `infra/`. Objetos do ORM não saem do adaptador.
- Chamadas externas (pagamento, frete, LLM) atrás de um Adapter com timeout, retry limitado e
  erro de domínio próprio. Nunca espalhe o SDK pelo código.
- Segredos e configuração lidos uma vez no `main.ts` e injetados; nada de `process.env` no núcleo.

## 5. React (front-end)

- **Humble Object no React:** componente de apresentação "burro" (recebe props, renderiza) +
  hook ou função que concentra a lógica de tela (estado derivado, validação, formatação).
  Teste o hook/função; o componente fica com teste mínimo ou nenhum.
- Regra de negócio não mora em componente nem em `useEffect`. Se precisa existir no cliente,
  vira função pura em `domain/` compartilhável e testável.
- Acesso a API atrás de uma camada (`api/` ou serviço) — componentes não chamam `fetch` direto.
  Estado de servidor com TanStack Query ou equivalente; estado de UI local no componente.
- Strategy/Composite aparecem naturalmente como mapa de componentes por tipo
  (`const renderers: Record<Tipo, FC>`) no lugar de `switch` repetido em JSX.

## 6. Testes na stack

| Alvo | Ferramenta típica | Observação |
|---|---|---|
| Entidades e casos de uso | Vitest/Jest, portas com dublês em memória | Rápidos, sem rede nem banco: é aqui que o TDD rende |
| Adaptadores de banco | Vitest + banco real em container (Testcontainers) | Poucos; verificam o mapeamento, não a regra |
| Hooks e lógica de tela | Vitest + React Testing Library (`renderHook`) | Teste comportamento observável, não estado interno |
| Fluxos de ponta a ponta | Playwright | Poucos e nos caminhos críticos (login, checkout, pagamento) |

Nomeie testes no idioma do projeto: `it('deve recusar o cupom quando expirado')`.

## 7. Checklist rápido TS/React

- [ ] `domain/` e `application/` não importam React, Express, ORM, SDK nem `process.env`?
- [ ] Portas declaradas no núcleo e implementadas em `infra/`?
- [ ] `main.ts` é o único lugar com `new` de adaptadores concretos?
- [ ] dependency-cruiser/eslint impedem import na direção errada e ciclos, rodando no CI?
- [ ] Entrada externa validada na borda (Zod/Valibot) e convertida em DTO simples?
- [ ] Componentes sem regra de negócio; lógica de tela em hooks/funções testadas?
