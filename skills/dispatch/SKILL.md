---
name: dispatch
description: Distribui tasks com spec aprovada para agentes independentes do Claude Code, um worktree e uma branch por task, todos gravando no mesmo .work-state/ do repositório.
disable-model-invocation: true
---

> **Caminhos.** `KIT` = pasta `kit/` na raiz deste plugin (`../../kit/` a partir da pasta desta skill). `SAF` = skill `software-architecture-foundations` (`../software-architecture-foundations/`). Use os caminhos absolutos resolvidos a partir do diretório base desta skill.

Tasks: $ARGUMENTS

Leia antes: `KIT/regras.md` e `KIT/formato.md`.

Regra que torna isso seguro: **uma task, um worktree, um agente**, e eles só se comunicam pelo arquivo de estado.

1. `STATE=$(node KIT/ws.mjs dir)` e leia `config.json` (`max_agentes`, padrão 2). A raiz do repositório principal é a pasta-mãe de `STATE`.
2. Conte os agentes ativos: tasks com `agente` preenchido e fase `implementando` ou `gate` com atividade nas últimas 2 horas. Não ultrapasse `max_agentes`; o que sobrar, pule e explique.
3. Para cada id, pule e explique se:
   - `spec_aprovada` não é `true`;
   - já existe agente ativo na task;
   - a fase é `aguardando-decisao` sem `- Resposta:` ou `bloqueada`;
   - o `## Plano` ou o `## Escopo` cita arquivos que outra task ativa (ou outra deste lote) também altera. Nesse caso diga que devem rodar em sequência.
4. Para cada task que passou:
   1. Worktree e branch: `git -C <raiz> worktree add <raiz>/../<repo>-wt/<id> -b <branch>` (ou sem `-b`, se a branch já existir). Nunca reutilize um worktree que tenha outra task.
   2. Grave em `tasks/<id>.md`: `worktree` (caminho absoluto), `agente: wt-<id>`, `iniciado_em`, `atualizado_em`.
   3. Inicie a sessão headless dentro do worktree, em segundo plano, com o estado apontando para a raiz:
      ```
      cd <worktree> && WORK_STATE_DIR="<STATE>" WS_TASK=<id> WS_AGENT=wt-<id> \
        claude -p "/software-architecture-foundations:implement <id>" \
          --allowedTools "Read,Edit,Write,Glob,Grep,Bash(git *),Bash(npm *),Bash(npx *),Bash(pnpm *),Bash(node *)" \
          > "<STATE>/agent-<id>.log" 2>&1
      ```
      Ajuste `--allowedTools` aos comandos de lint, teste e build do projeto (veja `package.json`). Não use `--dangerously-skip-permissions`. O hook de push sem gate continua valendo.
   4. Rode `ws.mjs event evento=agente-iniciado task=<id> agente=wt-<id>`.
5. Responda com o que foi disparado (id, worktree, branch) e o que foi pulado e por quê. Lembre que o andamento aparece no `/painel` e que um agente que parar para decisão fica com `fase: aguardando-decisao`: depois de responder no bloco, retome com `/dispatch <id>` (ele vai reaproveitar o worktree da própria task) ou abrindo `claude` no worktree e rodando `/implement <id>`.
