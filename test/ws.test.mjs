// Testes do kit/ws.mjs pela interface pública: os comandos recebem o mesmo stdin e cwd que o
// Claude Code passa e gravam (ou não) no .work-state/.
// Rodar: node --test
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WS = path.join(ROOT, 'kit', 'ws.mjs');

// Sem WS_TASK/WS_AGENT/WORK_STATE_DIR herdados do ambiente de quem roda os testes.
const BASE_ENV = Object.fromEntries(
  Object.entries(process.env).filter(([k]) => !['WS_TASK', 'WS_AGENT', 'WORK_STATE_DIR', 'WS_ALLOW_PUSH'].includes(k)),
);

function ws(args, { cwd, input, env = {} }) {
  return spawnSync(process.execPath, [WS, ...args], {
    cwd,
    input: input === undefined ? undefined : JSON.stringify(input),
    env: { ...BASE_ENV, ...env },
    encoding: 'utf8',
  });
}

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function makeRepo(dir, { branch, remote } = {}) {
  fs.mkdirSync(dir, { recursive: true });
  git(['init', '-q', '-b', 'main'], dir);
  git(['config', 'user.email', 'teste@example.com'], dir);
  git(['config', 'user.name', 'Teste'], dir);
  git(['commit', '-q', '--allow-empty', '-m', 'inicial'], dir);
  if (remote) git(['remote', 'add', 'origin', remote], dir);
  if (branch) git(['checkout', '-q', '-b', branch], dir);
}

function write(file, content = '') {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function readEvents(stateDir) {
  return fs.readFileSync(path.join(stateDir, 'events.log'), 'utf8').split('\n').filter(Boolean);
}

// Formatos capturados do Claude Code: comando com saída 0 dispara PostToolUse sem exitCode;
// saída diferente de zero dispara PostToolUseFailure com `error: "Exit code N"`.
const bashOk = (command) => ({
  hook_event_name: 'PostToolUse',
  tool_name: 'Bash',
  tool_input: { command },
  tool_response: { stdout: '', stderr: '', interrupted: false, isImage: false },
});
const bashFalhou = (command, extra = {}) => ({
  hook_event_name: 'PostToolUseFailure',
  tool_name: 'Bash',
  tool_input: { command },
  error: 'Exit code 1',
  ...extra,
});
const push = (command) => ({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command } });

const task = (id, gate) => `---\nid: ${id}\nfase: implementando\ngate: ${gate}\n---\n## Critérios de aceite\n- [ ] CA-1: x\n`;

describe('modo repositório', () => {
  let repo;

  function runHook(payload) {
    const r = ws(['hook'], { cwd: repo, input: { cwd: repo, ...payload }, env: { WS_TASK: '1234', WS_AGENT: 'teste' } });
    assert.equal(r.status, 0, `hook saiu com ${r.status}: ${r.stderr}`);
  }
  const events = () => readEvents(path.join(repo, '.work-state'));

  beforeEach(() => {
    repo = fs.mkdtempSync(path.join(os.tmpdir(), 'ws-test-'));
    git(['init', '-q'], repo);
    assert.equal(ws(['init'], { cwd: repo }).status, 0);
  });

  afterEach(() => fs.rmSync(repo, { recursive: true, force: true }));

  test('deve gravar teste com resultado=ok quando o comando de teste termina com sucesso', () => {
    runHook(bashOk('npm test'));
    assert.equal(events().length, 1);
    assert.match(events()[0], /evento=teste resultado=ok$/);
  });

  test('deve gravar teste com resultado=falhou quando o comando de teste falha', () => {
    runHook(bashFalhou('npx vitest run'));
    assert.equal(events().length, 1);
    assert.match(events()[0], /evento=teste resultado=falhou$/);
  });

  test('deve gravar teste com resultado=interrompido quando a pessoa interrompe o comando', () => {
    runHook(bashFalhou('pytest', { is_interrupt: true }));
    assert.match(events()[0], /evento=teste resultado=interrompido$/);
  });

  test('deve gravar commit, push e pr-aberto quando os comandos dão certo', () => {
    runHook(bashOk('git commit -m "x"'));
    runHook(bashOk('git push -u origin feat/1234-x'));
    runHook(bashOk('gh pr create --fill'));
    assert.deepEqual(events().map((l) => l.match(/evento=(\S+)/)[1]), ['commit', 'push', 'pr-aberto']);
  });

  test('não deve gravar commit, push nem pr-aberto quando o comando falha', () => {
    runHook(bashFalhou('git commit -m "x"'));
    runHook(bashFalhou('git push'));
    runHook(bashFalhou('gh pr create --fill'));
    assert.deepEqual(events(), []);
  });

  test('não deve gravar task-atualizada quando a edição do arquivo da task falha', () => {
    runHook({
      hook_event_name: 'PostToolUseFailure',
      tool_name: 'Edit',
      tool_input: { file_path: path.join(repo, '.work-state', 'tasks', '1234.md') },
      error: 'String to replace not found in file.',
    });
    assert.deepEqual(events(), []);
  });

  test('não deve gravar o remote com credenciais no config.json', () => {
    const outro = fs.mkdtempSync(path.join(os.tmpdir(), 'ws-test-'));
    try {
      makeRepo(outro, { remote: 'https://usuario:segredo@example.com/org/app.git' });
      assert.equal(ws(['init'], { cwd: outro }).status, 0);
      const cfg = fs.readFileSync(path.join(outro, '.work-state', 'config.json'), 'utf8');
      assert.doesNotMatch(cfg, /segredo|usuario/);
      assert.match(cfg, /https:\/\/example\.com\/org\/app\.git/);
    } finally {
      fs.rmSync(outro, { recursive: true, force: true });
    }
  });
});

describe('modo projeto (pasta com vários repositórios)', () => {
  let tmp;
  let proj;
  let state;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ws-proj-'));
    proj = path.join(tmp, 'projeto');
    makeRepo(path.join(proj, 'backend'), { branch: 'feat/1234-filtro', remote: 'https://usuario:segredo@example.com/org/backend.git' });
    makeRepo(path.join(proj, 'frontend'), { remote: 'git@example.com:org/frontend.git' });
    makeRepo(path.join(proj, 'contexto-projeto'));
    write(path.join(proj, 'backend', 'package.json'), '{}');
    write(path.join(proj, 'contexto-projeto', 'CLAUDE.md'), '# regras');
    write(path.join(proj, 'contexto-projeto', 'context', 'adrs', '0001-datas.md'), '# ADR');
    write(path.join(proj, 'contexto-projeto', 'context', 'changelog.md'), '# histórico');
    write(path.join(proj, 'contexto-projeto', 'context', 'plans', 'plano.md'), '# plano');
    write(path.join(proj, 'contexto-projeto', '.context', 'adrs', '0002-paginacao.md'), '# ADR');
    write(path.join(proj, 'contexto-projeto', '.claude', 'rules', 'api.md'), '# regra');
    write(path.join(proj, 'contexto-projeto', '.worktrees', 'velho', 'context', 'adrs', '0001-datas.md'), '# cópia');
    write(path.join(proj, 'notas.md'), 'anotação solta');
    state = path.join(proj, '.work-state');
  });

  afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));

  function init() {
    const r = ws(['init'], { cwd: proj });
    assert.equal(r.status, 0, r.stderr);
    write(path.join(state, 'tasks', '1234.md'), task(1234, 'nao-rodou'));
  }
  const config = () => JSON.parse(fs.readFileSync(path.join(state, 'config.json'), 'utf8'));

  test('dir deve apontar para o .work-state da pasta do projeto antes do init', () => {
    const r = ws(['dir'], { cwd: proj });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout.trim(), state);
  });

  test('init deve criar o estado na pasta do projeto listando os repositórios', () => {
    init();
    const cfg = config();
    assert.equal(cfg.modo, 'projeto');
    assert.equal(cfg.projeto, 'projeto');
    assert.deepEqual(cfg.repos.map((r) => r.caminho), ['backend', 'contexto-projeto', 'frontend']);
    assert.ok(cfg.repos.every((r) => r.base === 'main'));
    assert.equal(cfg.repos.find((r) => r.caminho === 'contexto-projeto').contexto, true);
    assert.equal(cfg.repos.find((r) => r.caminho === 'backend').contexto, undefined);
    assert.doesNotMatch(JSON.stringify(cfg), /segredo|usuario/);
    const painel = JSON.parse(fs.readFileSync(path.join(state, 'index.json'), 'utf8'));
    assert.equal(painel.repo, 'projeto');
  });

  test('init de novo deve acrescentar repositório novo sem perder o que foi configurado', () => {
    init();
    const cfg = config();
    cfg.ado_projeto = 'Projeto';
    fs.writeFileSync(path.join(state, 'config.json'), JSON.stringify(cfg));
    makeRepo(path.join(proj, 'mobile'));
    assert.equal(ws(['init'], { cwd: proj }).status, 0);
    assert.equal(config().ado_projeto, 'Projeto');
    assert.deepEqual(config().repos.map((r) => r.caminho), ['backend', 'contexto-projeto', 'frontend', 'mobile']);
  });

  test('init deve falhar numa pasta sem repositório git', () => {
    const vazia = path.join(tmp, 'vazia');
    fs.mkdirSync(vazia);
    const r = ws(['init'], { cwd: vazia });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /reposit/);
  });

  test('dir deve achar o estado do projeto de dentro de um repositório dele', () => {
    init();
    const sub = path.join(proj, 'backend', 'src');
    fs.mkdirSync(sub, { recursive: true });
    assert.equal(ws(['dir'], { cwd: sub }).stdout.trim(), state);
  });

  test('dir deve achar o estado do projeto de um worktree criado fora da pasta', () => {
    init();
    const wt = path.join(tmp, 'fora', 'backend-1234');
    git(['worktree', 'add', '-q', wt, '-b', 'feat/1234-wt'], path.join(proj, 'backend'));
    assert.equal(ws(['dir'], { cwd: wt }).stdout.trim(), state);
  });

  test('hook deve atribuir o teste à task e ao repositório do cd', () => {
    init();
    ws(['hook'], { cwd: proj, input: { cwd: proj, ...bashOk('cd backend && npm test') } });
    assert.match(readEvents(state)[0], /task=1234 agente=principal evento=teste resultado=ok repo=backend$/);
  });

  test('hook deve achar o repositório quando o Claude Code já aplicou o cd ao cwd da sessão', () => {
    // depois de um comando que deu certo, o cwd do PostToolUse já é o destino do cd
    init();
    const backend = path.join(proj, 'backend');
    ws(['hook'], { cwd: backend, input: { cwd: backend, ...bashOk('cd backend && npm test') } });
    assert.match(readEvents(state)[0], /task=1234 .*evento=teste resultado=ok repo=backend$/);
  });

  test('hook deve atribuir o commit ao repositório do git -C', () => {
    init();
    git(['checkout', '-q', '-b', 'feat/77-tela'], path.join(proj, 'frontend'));
    ws(['hook'], { cwd: proj, input: { cwd: proj, ...bashOk('git -C frontend commit -m "x"') } });
    assert.match(readEvents(state)[0], /task=77 .*evento=commit repo=frontend$/);
  });

  test('hook na raiz do projeto deve deduzir a task da única branch que tem arquivo de task', () => {
    init();
    git(['checkout', '-q', '-b', 'feat/999-sem-arquivo'], path.join(proj, 'frontend'));
    ws(['hook'], { cwd: proj, input: { cwd: proj, hook_event_name: 'Stop' } });
    assert.match(readEvents(state)[0], /task=1234 .*evento=agente-parado/);
  });

  test('guard deve bloquear o push do repositório do cd quando o gate não passou', () => {
    init();
    const r = ws(['guard'], { cwd: proj, input: { cwd: proj, ...push('cd backend && git push') } });
    assert.equal(r.status, 2);
    assert.match(r.stderr, /task 1234/);
  });

  test('guard deve bloquear o push com git -C apontando para o repositório', () => {
    init();
    assert.equal(ws(['guard'], { cwd: proj, input: { cwd: proj, ...push('git -C backend push -u origin HEAD') } }).status, 2);
  });

  test('guard deve bloquear o push quando a sessão já está dentro do repositório', () => {
    init();
    const backend = path.join(proj, 'backend');
    assert.equal(ws(['guard'], { cwd: backend, input: { cwd: backend, ...push('git push') } }).status, 2);
  });

  test('guard deve liberar o push quando o gate passou', () => {
    init();
    write(path.join(state, 'tasks', '1234.md'), task(1234, 'passou'));
    assert.equal(ws(['guard'], { cwd: proj, input: { cwd: proj, ...push('cd backend && git push') } }).status, 0);
  });

  test('context-status deve ler o contexto dos repositórios do projeto e ignorar histórico, planos e worktrees', () => {
    init();
    const st = JSON.parse(ws(['context-status'], { cwd: proj }).stdout);
    assert.equal(st.raiz, proj);
    for (const f of [
      'backend/package.json',
      'contexto-projeto/CLAUDE.md',
      'contexto-projeto/context/adrs/0001-datas.md',
      'contexto-projeto/.context/adrs/0002-paginacao.md',
      'contexto-projeto/.claude/rules/api.md',
    ]) assert.ok(st.fontes.includes(f), `faltou ${f}`);
    for (const f of [
      'contexto-projeto/context/changelog.md',
      'contexto-projeto/context/plans/plano.md',
      'contexto-projeto/.worktrees/velho/context/adrs/0001-datas.md',
      'notas.md',
    ]) assert.ok(!st.fontes.includes(f), `não devia ler ${f}`);
  });
});

describe('worktrees por task (dispatch)', () => {
  let tmp;
  let proj;
  let state;
  const taskComRepos = (id, repos, branch) =>
    `---\nid: ${id}\nfase: spec-aprovada\nspec_aprovada: true\n${repos ? `repos: [${repos.join(', ')}]\n` : ''}${branch ? `branch: ${branch}\n` : ''}gate: nao-rodou\n---\n`;
  const add = (id, cwd = proj) => ws(['worktree', 'add', id], { cwd });
  const branchOf = (dir) => git(['branch', '--show-current'], dir);

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ws-wt-'));
    proj = path.join(tmp, 'projeto');
    const backend = path.join(proj, 'backend');
    makeRepo(backend);
    write(path.join(backend, '.gitignore'), '.env\nnode_modules/\n');
    git(['add', '.gitignore'], backend);
    git(['commit', '-q', '-m', 'gitignore'], backend);
    write(path.join(backend, '.env'), 'SEGREDO_LOCAL=1\n');
    write(path.join(backend, '.env.example'), 'SEGREDO_LOCAL=\n');
    makeRepo(path.join(proj, 'frontend'));
    makeRepo(path.join(proj, 'contexto-projeto'));
    assert.equal(ws(['init'], { cwd: proj }).status, 0);
    state = path.join(proj, '.work-state');
    write(path.join(state, 'tasks', '555.md'), taskComRepos(555, ['backend', 'frontend'], 'feat/555-relatorio'));
  });

  afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));

  test('init deve listar em arquivos_locais os .env que o git ignora', () => {
    const cfg = JSON.parse(fs.readFileSync(path.join(state, 'config.json'), 'utf8'));
    assert.deepEqual(cfg.repos.find((r) => r.caminho === 'backend').arquivos_locais, ['.env']);
    assert.equal(cfg.repos.find((r) => r.caminho === 'frontend').arquivos_locais, undefined);
  });

  test('worktree add deve criar um worktree por repositório da task dentro da pasta do projeto', () => {
    const r = add('555');
    assert.equal(r.status, 0, r.stderr);
    const out = JSON.parse(r.stdout);
    assert.equal(out.cwd, path.join(proj, '.worktrees', '555'));
    for (const repo of ['backend', 'frontend']) {
      const wt = path.join(proj, '.worktrees', '555', repo);
      assert.equal(out.worktrees.find((w) => w.caminho === repo).path, wt);
      assert.equal(branchOf(wt), 'feat/555-relatorio');
      assert.equal(branchOf(path.join(proj, repo)), 'main');
    }
    assert.equal(fs.readFileSync(path.join(proj, '.worktrees', '555', 'backend', '.env'), 'utf8'), 'SEGREDO_LOCAL=1\n');
    assert.ok(!fs.existsSync(path.join(proj, '.worktrees', '555', 'frontend', '.env')));
  });

  test('worktree add deve impedir que o .env copiado entre num commit quando a branch não o ignora', () => {
    const backend = path.join(proj, 'backend');
    git(['branch', 'feat/557-antiga', 'HEAD~1'], backend); // branch de antes do .gitignore
    write(path.join(state, 'tasks', '557.md'), taskComRepos(557, ['backend'], 'feat/557-antiga'));
    assert.equal(add('557').status, 0);
    const wt = path.join(proj, '.worktrees', '557', 'backend');
    assert.ok(fs.existsSync(path.join(wt, '.env')));
    assert.equal(git(['status', '--porcelain'], wt), '', '.env copiado não pode aparecer para git add');
    assert.equal(ws(['worktree', 'remove', '557'], { cwd: proj }).status, 0);
  });

  test('worktree add de novo deve reaproveitar os worktrees da task', () => {
    assert.equal(add('555').status, 0);
    const r = add('555');
    assert.equal(r.status, 0, r.stderr);
    assert.ok(JSON.parse(r.stdout).worktrees.every((w) => w.estado === 'reaproveitado'));
  });

  test('worktree add deve usar a branch da task quando ela já existe', () => {
    const frontend = path.join(proj, 'frontend');
    git(['checkout', '-q', '-b', 'feat/555-relatorio'], frontend);
    git(['commit', '-q', '--allow-empty', '-m', 'trabalho anterior'], frontend);
    const ponta = git(['rev-parse', 'HEAD'], frontend);
    git(['checkout', '-q', 'main'], frontend);
    assert.equal(add('555').status, 0);
    assert.equal(git(['rev-parse', 'HEAD'], path.join(proj, '.worktrees', '555', 'frontend')), ponta);
  });

  test('worktree add deve recusar quando a branch da task está em uso na cópia principal', () => {
    git(['checkout', '-q', '-b', 'feat/555-relatorio'], path.join(proj, 'backend'));
    const r = add('555');
    assert.equal(r.status, 1);
    assert.match(r.stderr, /backend/);
    assert.match(r.stderr, /feat\/555-relatorio/);
    assert.ok(!fs.existsSync(path.join(proj, '.worktrees', '555', 'frontend')), 'não deve criar worktree pela metade');
  });

  test('worktree add deve recusar task sem repos no modo projeto', () => {
    write(path.join(state, 'tasks', '556.md'), taskComRepos(556, null, 'feat/556-x'));
    const r = add('556');
    assert.equal(r.status, 1);
    assert.match(r.stderr, /repos/);
  });

  test('hook dentro do worktree deve gravar a task, o agente e o repositório do worktree', () => {
    assert.equal(add('555').status, 0);
    const wt = path.join(proj, '.worktrees', '555', 'backend');
    ws(['hook'], { cwd: wt, input: { cwd: wt, ...bashOk('npm test') } });
    assert.match(readEvents(state).at(-1), /task=555 agente=wt-555 evento=teste resultado=ok repo=backend$/);
  });

  test('worktree remove deve apagar os worktrees limpos e manter as branches', () => {
    assert.equal(add('555').status, 0);
    const r = ws(['worktree', 'remove', '555'], { cwd: proj });
    assert.equal(r.status, 0, r.stderr);
    assert.ok(!fs.existsSync(path.join(proj, '.worktrees', '555')));
    assert.equal(git(['branch', '--list', 'feat/555-relatorio'], path.join(proj, 'backend')), 'feat/555-relatorio');
  });

  test('worktree remove deve recusar quando há alteração não commitada', () => {
    assert.equal(add('555').status, 0);
    write(path.join(proj, '.worktrees', '555', 'backend', 'novo.ts'), 'export {}');
    const r = ws(['worktree', 'remove', '555'], { cwd: proj });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /backend/);
    assert.ok(fs.existsSync(path.join(proj, '.worktrees', '555', 'backend', 'novo.ts')));
  });

  test('worktree add no modo repositório deve criar o worktree dentro do repositório, fora do git status', () => {
    const repo = path.join(tmp, 'app');
    makeRepo(repo);
    assert.equal(ws(['init'], { cwd: repo }).status, 0);
    write(path.join(repo, '.work-state', 'tasks', '777.md'), taskComRepos(777, null, 'feat/777-x'));
    const r = add('777', repo);
    assert.equal(r.status, 0, r.stderr);
    const wt = path.join(repo, '.worktrees', '777');
    assert.equal(JSON.parse(r.stdout).cwd, wt);
    assert.equal(branchOf(wt), 'feat/777-x');
    assert.equal(git(['status', '--porcelain'], repo), '');
  });
});

test('hooks.json deve encaminhar PostToolUseFailure de Bash e PowerShell para o ws.mjs hook', () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'hooks', 'hooks.json'), 'utf8'));
  const entradas = cfg.hooks.PostToolUseFailure || [];
  const entrada = entradas.find((e) => new RegExp(`^(?:${e.matcher})$`).test('Bash'));
  assert.ok(entrada, 'sem PostToolUseFailure para Bash');
  assert.ok(new RegExp(`^(?:${entrada.matcher})$`).test('PowerShell'), 'sem PostToolUseFailure para PowerShell');
  assert.ok(entrada.hooks.some((h) => /ws\.mjs" hook$/.test(h.command)));
});
