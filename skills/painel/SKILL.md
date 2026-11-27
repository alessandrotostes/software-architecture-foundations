---
name: painel
description: Abre o painel visual das tasks do repositório atual (o que falta em cada uma, o que espera por mim), atualizado em tempo real pelos agentes.
disable-model-invocation: true
---

> **Caminhos.** `KIT` = pasta `kit/` na raiz deste plugin (`../../kit/` a partir da pasta desta skill). `SAF` = skill `software-architecture-foundations` (`../software-architecture-foundations/`). Use os caminhos absolutos resolvidos a partir do diretório base desta skill.

Painel da manhã do repositório atual. (Chama-se `/painel` porque `/tasks` já é um comando do Claude Code.)

Argumentos: $ARGUMENTS — se contiver `sem-sync`, pule o passo 1.

1. Atualize o estado seguindo `../sync/SKILL.md` (a skill `sync` deste plugin; leia e execute os passos dela) no modo `atualizar`: sem buscar tasks novas nem perguntar. Se ela falhar, continue com o estado local e avise que ele pode estar desatualizado.
2. Rode `node KIT/ws.mjs render`.
3. Suba o servidor local em segundo plano, se ainda não estiver no ar: `node KIT/ws.mjs serve 4777` (se disser que a porta está em uso, o painel já está no ar). Rode a partir do repositório ou da pasta do projeto: o `ws.mjs` acha o `.work-state/` subindo pelas pastas.
4. Abra `http://127.0.0.1:4777/` no navegador (no Windows: `start http://127.0.0.1:4777/`). Sem servidor, o `dashboard.html` também abre direto do disco, mas aí é só um instantâneo.
5. Leia `.work-state/index.json` e responda em **três linhas** o que exige a minha ação hoje, nesta ordem: decisões pendentes (com id e a decisão em uma frase), revisões e testes manuais, tasks paradas há mais de um dia. Não repita o painel inteiro. Se não houver nada, diga que `/sync` traz tasks novas.
