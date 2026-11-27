# Changelog

## 2.0.1 — 2026-11-27

### Corrigido
- Hooks: teste que falhava não aparecia no painel. O Claude Code manda comando com saída diferente
  de zero para `PostToolUseFailure`, que o `hooks/hooks.json` não registrava. Agora registra (só para
  Bash e PowerShell) e o `ws.mjs` grava `teste` com `resultado=falhou`, ou `interrompido` quando a
  pessoa interrompe.
- Hooks: teste que passava era gravado sem `resultado`, porque a resposta do `PostToolUse` não traz
  `exitCode`. Agora sai com `resultado=ok`.
- Hooks: commit, push e PR cujo comando falhou não são mais gravados como se tivessem acontecido.

### Adicionado
- `test/ws.test.mjs`: testes do `ws.mjs hook` com os payloads reais do Claude Code, sem dependências.
  Rode com `node --test`.

## 2.0.0 — 2026-11-27

### Adicionado
- O repositório vira um **plugin do Claude Code** (`.claude-plugin/plugin.json` e `marketplace.json`),
  com a skill de arquitetura e um fluxo de trabalho com agentes no mesmo pacote.
- Skills do fluxo: `spec`, `implement`, `gate`, `dispatch`, `sync` e `painel`.
- `kit/`: regras comuns (precedência entre projeto e skill, contexto vivo, parada para decisão humana,
  trabalho novo e tasks filhas), formato do estado por task e `ws.mjs` (estado, eventos, painel em
  tempo real, servidor local e hooks, sem dependências).
- `hooks/hooks.json`: registro automático de eventos no painel e bloqueio de `git push` sem gate.
- O fluxo usa a skill de arquitetura em cada etapa: fluxo A na spec, TDD e checklist D na
  implementação, checklist de revisão com severidades no gate, rascunho de ADR nas decisões arquiteturais.

### Alterado
- **Quebra de caminho:** a skill de arquitetura saiu da raiz para `skills/software-architecture-foundations/`.
  Quem copia a pasta manualmente deve usar o novo caminho; o conteúdo da skill não mudou.
- READMEs reescritos para as duas partes.

## 1.1.0 — 2026-11-25

### Adicionado
- `references/typescript-react.md`: como aplicar portas, adaptadores, composição, fronteiras
  (dependency-cruiser / eslint-plugin-boundaries) e testes em TypeScript, Node.js e React.
- `references/spec-driven.md`: integração com Spec-Driven Development e Context Engineering —
  critérios de aceite como lista de testes, ADRs e documentação viva.
- Checklist de revisão: isolamento multi-tenant e autorização por recurso.
- README em inglês (`README.en.md`), `LICENSE` (CC BY 4.0) e este changelog.
- Palavras-chave em inglês na `description` e `metadata` (autor e versão) no frontmatter.

### Alterado
- Test-first passa a valer para regra de negócio e lógica com decisão; cola, configuração e
  layout sem lógica podem ter só testes de integração/e2e (antes a regra era absoluta).
- Nome de teste independente de linguagem (`it('deve … quando …')`, pytest, JUnit).
- `AGENTS.md` reduzido a princípios, checklist e ponteiros para não pesar no contexto de toda sessão.
- Coluna "Intenção" dos 23 padrões GoF reescrita com palavras próprias.
- `license` do frontmatter agora usa o identificador SPDX `CC-BY-4.0`.

### Corrigido
- Quebra de linha no meio de "generalidade especulativa" em `software-engineering.md`.

## 1.0.0
- Versão inicial: SKILL.md, AGENTS.md e referências de Clean Architecture, Padrões de Projeto,
  TDD, Engenharia de Software e checklist de revisão.
