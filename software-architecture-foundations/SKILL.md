---
name: software-architecture-foundations
description: Fundamentos de arquitetura e design de software destilados de Clean Architecture (Robert C. Martin), Padrões de Projeto (GoF), TDD (Kent Beck) e Engenharia de Software (Sommerville), com aplicação em TypeScript/React e integração com Spec-Driven Development. Use ao projetar, implementar, refatorar ou revisar código e sistemas — definir camadas, fronteiras e módulos, aplicar SOLID, escolher (ou rejeitar) um padrão de projeto, escrever testes primeiro, reduzir acoplamento, tratar requisitos não funcionais, ou revisar PRs quanto à qualidade arquitetural. Also use for software architecture, clean architecture, design patterns, TDD, refactoring and code review tasks.
license: CC-BY-4.0
metadata:
  author: Alessandro Tostes
  version: "1.1.0"
---

# Fundamentos de Arquitetura de Software

Esta skill transforma quatro livros clássicos em regras de trabalho para um agente de código.
Ela não substitui o julgamento: cada regra existe para **reduzir o custo de mudar o software**.
Quando uma regra não reduzir esse custo no contexto atual, não a aplique e diga por quê.

> **Meta (Martin):** "O objetivo da arquitetura de software é minimizar os recursos humanos
> necessários para construir e manter o sistema exigido."
> **Meta (Beck):** "Código limpo que funciona."
> **Meta (Sommerville):** software manutenível, confiável, protegido, eficiente e aceitável.
> **Meta (GoF):** projetar para mudança — permitir que um aspecto varie sem reprojetar o resto.

## Quando consultar os arquivos de referência

Carregue só o que a tarefa pede (divulgação progressiva):

| Situação | Arquivo |
|---|---|
| Camadas, fronteiras, regra de dependência, SOLID, componentes, métricas de acoplamento, "o banco/web/framework é detalhe" | `references/clean-architecture.md` |
| Escolher, aplicar ou remover um padrão de projeto; problema de criação, estrutura ou comportamento de objetos | `references/design-patterns.md` |
| Escrever código novo, corrigir bug, refatorar com segurança, desenhar testes | `references/tdd.md` |
| Requisitos, requisitos não funcionais, estilos arquiteturais, sistemas distribuídos, serviços, confiabilidade, segurança, evolução de legado, gestão de configuração | `references/software-engineering.md` |
| Revisar código/PR, diagnosticar "cheiros" e propor remédios | `references/review-checklist.md` |
| Projeto em TypeScript, Node.js ou React: como mapear portas, adaptadores, composição, testes e fronteiras para essa stack | `references/typescript-react.md` |
| Projeto com specs, ADRs ou documentação viva para agentes (Spec-Driven Development, Context Engineering) | `references/spec-driven.md` |

## Os 12 princípios centrais (sempre ativos)

1. **Comportamento e estrutura são dois valores; a estrutura vale mais.** Código que funciona mas
   não pode mudar perde valor a cada requisito novo. Defenda a arquitetura mesmo sob pressão
   de prazo (o urgente raramente é o importante).
2. **Regra da Dependência.** Dependências de código-fonte apontam apenas para dentro, rumo às
   políticas de mais alto nível. Regras de negócio não conhecem UI, banco, framework, rede ou
   dispositivo. Nomes declarados num círculo externo não aparecem num círculo interno.
3. **Política vs. detalhe.** Banco de dados, web, frameworks, filas e serviços externos são
   detalhes. Mantenha as opções abertas o máximo possível; adie decisões de detalhe.
4. **Programe para uma interface, não para uma implementação** (GoF). Dependa de abstrações
   estáveis; instancie concretos em um único lugar (Main / composição / fábricas).
5. **Prefira composição de objetos à herança de classe** (GoF). Herança só para
   subtipagem verdadeira (LSP); para variar comportamento, componha e delegue.
6. **Encapsule o que varia.** Identifique o eixo de mudança provável e isole-o atrás de uma
   abstração — mas só quando houver evidência real dessa variação.
7. **SOLID** — SRP (um módulo responde a um, e só um, ator), OCP (aberto para extensão, fechado
   para modificação), LSP (subtipos substituíveis sem surpresa), ISP (não dependa do que não usa),
   DIP (detalhes dependem de políticas, via abstrações).
8. **Coesão e acoplamento de componentes.** Agrupe o que muda junto e pelas mesmas razões (CCP);
   não force dependências desnecessárias (CRP); nenhum ciclo no grafo de dependências (ADP);
   dependa na direção da estabilidade (SDP); componentes estáveis devem ser abstratos (SAP).
9. **Testes primeiro, em passos pequenos — onde há regra.** Em entidades, casos de uso e
   qualquer lógica com decisão, escreva código novo só se um teste automatizado falhou; depois
   elimine a duplicação (Vermelho → Verde → Refatorar). Cola, configuração, scaffolding e
   layout de UI sem lógica não exigem teste unitário próprio: cubra-os com poucos testes de
   integração/e2e do fluxo ou deixe sem teste, e diga qual escolha fez.
10. **Testes fazem parte do sistema.** São o componente mais externo; nada depende deles.
    Teste pelo comportamento (API de teste estável), não pela estrutura interna, para evitar
    testes frágeis.
11. **Requisitos não funcionais moldam a arquitetura** (Sommerville). Desempenho, proteção,
    segurança (safety), disponibilidade e manutenibilidade puxam a estrutura em direções
    diferentes; torne o trade-off explícito.
12. **Padrões não são metas.** Cada padrão adiciona indireção e custo. Aplique-o apenas quando a
    flexibilidade que ele oferece for realmente necessária (GoF, cap. 1.8). YAGNI vale.

## Fluxo de trabalho

### A. Antes de escrever código (entender e decidir)

0. **Leia o contexto do projeto, se existir.** Spec da funcionalidade, ADRs e documentação viva
   (ex.: `specs/`, `docs/adr/`, `CONTEXT.md`) vêm antes do código. Critérios de aceite da spec
   viram a lista de testes; decisões arquiteturais novas viram um ADR. Detalhes em
   `references/spec-driven.md`. Sem spec, siga do passo 1.
1. **Esclareça o requisito.** Separe requisitos funcionais (o que o sistema faz) de não
   funcionais (como: latência, disponibilidade, segurança, escala, portabilidade, custo).
   Se um requisito não é verificável, torne-o mensurável ou pergunte.
2. **Identifique os atores** (quem pede mudanças). Cada ator distinto sugere um módulo distinto (SRP).
3. **Localize o núcleo.** Quais são as entidades (regras críticas de negócio) e os casos de uso
   (regras específicas da aplicação)? Eles devem poder ser testados sem banco, web ou framework.
4. **Desenhe as fronteiras.** Trace linhas entre o que importa (política) e o que é irrelevante
   para a regra (detalhe). Em cada fronteira, a dependência cruza apontando para a política;
   use interfaces definidas *pelo lado da política* (portas) e implementadas pelo detalhe (adaptadores).
5. **Escolha o nível de desacoplamento mínimo suficiente**: código-fonte → implantação →
   serviço. Comece pelo menor; promova quando houver necessidade real.
6. **Considere reúso antes de construir** (bibliotecas, frameworks, serviços), mas "não case
   com o framework": mantenha-o atrás de uma fronteira.

### B. Ao implementar (ciclo TDD na lógica de domínio e casos de uso)

1. Mantenha uma **lista de testes** (comportamentos a cobrir, casos-limite, refatorações pendentes).
   Se houver spec, comece pelos critérios de aceite dela.
2. Escolha o próximo teste que ensine algo e que você saiba fazer passar.
3. **Vermelho:** escreva um teste pequeno que falhe. Escreva a asserção primeiro; invente a
   interface que você gostaria de ter.
4. **Verde:** faça passar rápido — *Implementação Óbvia* se for clara; senão *Fazer de Conta*
   (retorne uma constante) e depois *Triangule* com um segundo exemplo.
5. **Refatorar:** remova duplicação (inclusive entre teste e código), melhore nomes, extraia
   abstrações. Todos os testes verdes antes e depois de cada passo.
6. Encurte os passos quando surgir surpresa; alongue quando tudo estiver fluindo.
7. Bug encontrado → primeiro um **teste de regressão** que reproduz o bug, depois a correção.

### C. Ao estruturar e refatorar

- Ao sentir rigidez (mudança simples exige tocar muitos arquivos), fragilidade (mudança quebra
  partes não relacionadas) ou imobilidade (difícil reusar), procure a dependência que viola a
  Regra da Dependência ou o DIP e inverta-a.
- Ao ver condicionais por tipo espalhados (`switch`/`if` sobre "tipo"), considere polimorfismo:
  Strategy, State ou Command, conforme o que varia.
- Ao ver duplicação, pergunte: **duplicação verdadeira** (muda sempre junto) ou **acidental**
  (parece igual, mas muda por razões/atores diferentes)? Só unifique a verdadeira.
- Refatore em passos que preservam comportamento, cada um protegido por testes.

### D. Antes de entregar (verificação)

- [ ] O núcleo (entidades/casos de uso) compila e testa sem importar framework, ORM, HTTP, UI?
- [ ] Nenhum ciclo entre módulos/pacotes; dependências apontam para o mais estável/abstrato?
- [ ] Cada classe/módulo tem um único ator responsável?
- [ ] Concretos são instanciados apenas na borda (Main, container de DI, fábricas)?
- [ ] Toda regra nova tem teste; todo bug corrigido tem teste de regressão?
- [ ] Em sistemas multi-tenant, toda leitura/escrita é filtrada pelo tenant e a autorização é checada por recurso?
- [ ] Decisão arquitetural nova registrada (ADR) e spec/documentação viva atualizadas?
- [ ] Testes rodam rápido e não dependem de detalhes internos que mudam com frequência?
- [ ] Entradas externas são validadas; exceções têm tratador; chamadas externas têm timeout?
- [ ] Algum padrão adicionado se justifica por uma variação real (não especulativa)?
- [ ] A estrutura de pastas "grita" o domínio (ex.: `orders/`, `billing/`) e não o framework?

## Orientação de saída

- Ao propor arquitetura, mostre: fronteiras, direção das dependências, onde ficam as interfaces
  (portas), quem as implementa (adaptadores), e onde ocorre a composição (Main).
- Ao recomendar um padrão, diga **qual aspecto ele deixa variar**, o **custo** que introduz e
  a **alternativa mais simples** que você descartou.
- Ao revisar código, classifique achados em: violação de dependência, responsabilidade
  misturada, acoplamento/ciclo, ausência de teste, risco de confiabilidade/proteção, excesso
  de engenharia. Para cada um, proponha a menor mudança que resolve.
- Seja proporcional: um script de 50 linhas não precisa de quatro camadas. Partições
  parciais (Façade, Strategy, fronteira unidimensional) são aceitáveis quando o custo de uma
  fronteira completa não se paga ainda — documente a decisão.

## Anti-padrões a recusar ou sinalizar

- Regras de negócio dentro de controllers, views, handlers, ORM models ou procedures do banco.
- Entidades de domínio que herdam de classes do framework/ORM ou carregam anotações dele
  quando isso força o núcleo a importar o framework.
- Objetos de banco (linhas, ORM) atravessando fronteiras até a UI ou casos de uso.
- Singletons como estado global mutável usado para "facilitar" dependências.
- Hierarquias de herança profundas para reaproveitar código.
- Interfaces "gordas" que forçam clientes a depender de métodos que não usam.
- Microsserviços criados para "desacoplar" mas que compartilham modelo de dados (acoplamento disfarçado).
- Testes que replicam a estrutura de classes de produção, quebrando a cada refatoração.
- Código escrito "para o futuro" sem teste que o exija.
- Padrões de projeto aplicados por moda, sem variação concreta a ser isolada.

## Glossário mínimo

- **Entidade:** regra crítica de negócio, válida mesmo sem sistema automatizado.
- **Caso de uso / interactor:** regra específica da aplicação; orquestra entidades.
- **Porta / adaptador:** interface do núcleo / implementação dela no detalhe.
- **Humble Object:** separa o difícil de testar (UI, I/O) do fácil de testar (lógica), deixando o primeiro "burro".
- **Instabilidade I = Fan-out / (Fan-in + Fan-out)**; **Abstração A = Na / Nc**;
  **Distância da sequência principal D = |A + I − 1|** (ideal perto de 0).
