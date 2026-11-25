<!-- Versão enxuta e sempre ativa da skill software-architecture-foundations.
     Coloque na raiz do projeto (ou copie para CLAUDE.md, GEMINI.md, .github/copilot-instructions.md, .cursor/rules/).
     O fluxo completo e as referências ficam na pasta da skill; este arquivo só carrega o essencial. -->

# Fundamentos de Arquitetura de Software

Regras de trabalho destiladas de Clean Architecture (Martin), Padrões de Projeto (GoF),
TDD (Beck) e Engenharia de Software (Sommerville). Cada regra existe para **reduzir o custo de
mudar o software**; quando não reduzir no contexto atual, não aplique e diga por quê.

## Princípios (sempre ativos)

1. **Estrutura vale mais que comportamento:** código que funciona mas não muda perde valor.
2. **Regra da Dependência:** dependências apontam para dentro; regra de negócio não conhece UI, banco, framework ou rede.
3. **Política vs. detalhe:** banco, web, frameworks e serviços externos são detalhes; adie essas decisões.
4. **Programe para interfaces;** concretos são criados num só lugar (Main/composição).
5. **Composição acima de herança;** herança só para subtipagem verdadeira.
6. **Encapsule o que varia** — só com evidência real de variação.
7. **SOLID:** SRP por ator, OCP, LSP, ISP, DIP.
8. **Componentes:** agrupe o que muda junto; sem ciclos; dependa na direção da estabilidade.
9. **Test-first onde há regra:** entidades, casos de uso e lógica com decisão seguem Vermelho → Verde → Refatorar.
   Cola, configuração e layout sem lógica: poucos testes de integração/e2e ou nenhum — diga a escolha.
10. **Testes pelo comportamento público,** nunca pela estrutura interna.
11. **Requisitos não funcionais moldam a arquitetura;** explicite o trade-off.
12. **Padrões não são metas.** YAGNI vale.

## Antes de entregar

- [ ] Núcleo testa sem framework, ORM, HTTP ou UI?
- [ ] Sem ciclos; dependências na direção do mais estável/abstrato?
- [ ] Concretos instanciados só na borda (Main/DI/fábricas)?
- [ ] Regra nova tem teste; bug corrigido tem teste de regressão?
- [ ] Entradas validadas, exceções tratadas, timeouts em chamadas externas?
- [ ] Multi-tenant: dados filtrados pelo tenant da sessão e autorização por recurso?
- [ ] Padrão novo justificado por variação real?
- [ ] Spec, ADR e documentação viva atualizadas, se o projeto os usa?

## Onde está o resto

Leia só o que a tarefa pede (ajuste o caminho se instalou em `.claude/skills/`):

| Situação | Arquivo |
|---|---|
| Fluxo completo (antes de codar, TDD, refatoração, formato de saída, anti-padrões) | `.agents/skills/software-architecture-foundations/SKILL.md` |
| Camadas, fronteiras, SOLID, componentes, métricas | `.agents/skills/software-architecture-foundations/references/clean-architecture.md` |
| Escolher, aplicar ou remover um padrão de projeto | `.agents/skills/software-architecture-foundations/references/design-patterns.md` |
| Código novo, bug, refatoração, desenho de testes | `.agents/skills/software-architecture-foundations/references/tdd.md` |
| Requisitos, RNF, estilos arquiteturais, confiabilidade, segurança, legado | `.agents/skills/software-architecture-foundations/references/software-engineering.md` |
| Revisão de código/PR | `.agents/skills/software-architecture-foundations/references/review-checklist.md` |
| TypeScript, Node.js, React | `.agents/skills/software-architecture-foundations/references/typescript-react.md` |
| Specs, ADRs, documentação viva | `.agents/skills/software-architecture-foundations/references/spec-driven.md` |
