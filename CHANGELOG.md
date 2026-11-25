# Changelog

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
