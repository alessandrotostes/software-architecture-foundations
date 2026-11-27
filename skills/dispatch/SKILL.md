---
name: dispatch
description: Distribui tasks com spec aprovada para agentes independentes do Claude Code, cada task na sua pasta de worktrees (um por repositório que ela toca), todos gravando no mesmo .work-state/.
disable-model-invocation: true
---

> **Caminhos.** `KIT` = pasta `kit/` na raiz deste plugin (`../../kit/` a partir da pasta desta skill). `SAF` = skill `software-architecture-foundations` (`../software-architecture-foundations/`). Use os caminhos absolutos resolvidos a partir do diretório base desta skill.

Tasks: $ARGUMENTS

Leia antes: `KIT/regras.md` e `KIT/formato.md`.

Regra que torna isso seguro: **uma task, uma pasta de worktrees, um agente**, e eles só se comunicam pelo arquivo de estado.

1. `STATE=$(node KIT/ws.mjs dir)` e leia `config.json` (`max_agentes`, padrão 2; `modo`).
2. Conte os agentes ativos: tasks com `agente` preenchido e fase `implementando` ou `gate` com atividade nas últimas 2 horas. Não ultrapasse `max_agentes`; o que sobrar, pule e explique.
3. Para cada id, pule e explique se:
   - `spec_aprovada` não é `true`;
   - já existe agente ativo na task;
   - a fase é `aguardando-decisao` sem `- Resposta:` ou `bloqueada`;
   - no modo projeto, a task não tem `repos` (a spec define quais repositórios ela toca);
   - o `## Plano` ou o `## Escopo` cita arquivos que outra task ativa (ou outra deste lote) também altera. Nesse caso diga que devem rodar em sequência;
   - a spec prevê migration de banco e outra task ativa também: rodando juntas, uma altera o banco de desenvolvimento da outra. Sugira a sequência.
4. Para cada task que passou:
   1. Atualize as bases: em cada repositório que a task toca, `git -C <repositório> fetch origin`. Se falhar, siga com o que existe localmente e avise.
   2. Worktrees: `node KIT/ws.mjs worktree add <id>`. Ele cria (ou reaproveita) um worktree por repositório da task, **dentro da pasta da sessão** (`.worktrees/<id>/<caminho>` no modo projeto, `.worktrees/<id>` no modo repositório), na branch da task, a partir da `base` do repositório, e copia os `arquivos_locais` (como `.env`). Leia o JSON da saída: `cwd` é a pasta de trabalho do agente. Se ele recusar (por exemplo, a branch da task está em uso na cópia principal), pule a task e diga o motivo e como resolver.
   3. Grave em `tasks/<id>.md`: `worktree: <cwd>`, `agente: wt-<id>`, `iniciado_em`, `atualizado_em`.
   4. Inicie a sessão headless em segundo plano (na ferramenta Bash, `run_in_background`; num terminal, `&`), dentro de `cwd`, com o estado apontando para o `.work-state/` principal:
      ```
      cd "<cwd>" && WORK_STATE_DIR="<STATE>" WS_TASK=<id> WS_AGENT=wt-<id> \
        claude -p "/software-architecture-foundations:implement <id>" \
          --allowedTools "Read,Edit,Write,Glob,Grep,Bash(cd *),Bash(git *),Bash(npm *),Bash(npx *),Bash(pnpm *),Bash(node *)" \
          > "<STATE>/agent-<id>.log" 2>&1
      ```
      Ajuste `--allowedTools` aos comandos de instalação, lint, teste e build de cada repositório (veja o `package.json` ou equivalente). Não use `--dangerously-skip-permissions`. O hook de push sem gate continua valendo.
   5. Rode `ws.mjs event evento=agente-iniciado task=<id> agente=wt-<id>`.
   6. Depois de alguns segundos, leia as primeiras linhas de `<STATE>/agent-<id>.log`: erro de login ou de permissão aparece ali. Com login expirado, avise que a pessoa precisa rodar `claude auth login` (ou `claude setup-token`, para agentes sem supervisão).
5. Responda com o que foi disparado (id, `cwd`, branch, repositórios) e o que foi pulado e por quê. Lembre que:
   - o andamento aparece no `/painel`;
   - um agente que parar para decisão fica com `fase: aguardando-decisao`: depois de responder no bloco, retome com `/dispatch <id>` (ele reaproveita os worktrees da task) ou abrindo `claude` em `cwd` e rodando `/implement <id>`;
   - quando a task for mergeada, `node KIT/ws.mjs worktree remove <id>` apaga os worktrees dela (recusa se houver alteração não commitada; as branches ficam).
