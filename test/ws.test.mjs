// Testes do kit/ws.mjs pela interface pública: o comando `hook` recebe no stdin o JSON que o
// Claude Code envia e grava (ou não) uma linha no .work-state/events.log.
// Rodar: node --test
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WS = path.join(ROOT, 'kit', 'ws.mjs');

let repo;

function runHook(payload) {
  const r = spawnSync(process.execPath, [WS, 'hook'], {
    cwd: repo,
    input: JSON.stringify({ cwd: repo, ...payload }),
    env: { ...process.env, WS_TASK: '1234', WS_AGENT: 'teste' },
    encoding: 'utf8',
  });
  assert.equal(r.status, 0, `hook saiu com ${r.status}: ${r.stderr}`);
}

function events() {
  return fs.readFileSync(path.join(repo, '.work-state', 'events.log'), 'utf8').split('\n').filter(Boolean);
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

beforeEach(() => {
  repo = fs.mkdtempSync(path.join(os.tmpdir(), 'ws-test-'));
  execFileSync('git', ['init', '-q'], { cwd: repo });
  execFileSync(process.execPath, [WS, 'init'], { cwd: repo, stdio: 'ignore' });
});

afterEach(() => {
  fs.rmSync(repo, { recursive: true, force: true });
});

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

test('hooks.json deve encaminhar PostToolUseFailure de Bash e PowerShell para o ws.mjs hook', () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'hooks', 'hooks.json'), 'utf8'));
  const entradas = cfg.hooks.PostToolUseFailure || [];
  const entrada = entradas.find((e) => new RegExp(`^(?:${e.matcher})$`).test('Bash'));
  assert.ok(entrada, 'sem PostToolUseFailure para Bash');
  assert.ok(new RegExp(`^(?:${entrada.matcher})$`).test('PowerShell'), 'sem PostToolUseFailure para PowerShell');
  assert.ok(entrada.hooks.some((h) => /ws\.mjs" hook$/.test(h.command)));
});
