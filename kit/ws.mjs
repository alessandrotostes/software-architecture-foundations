#!/usr/bin/env node
// ws.mjs — utilitário do ecossistema de skills (estado por repositório em .work-state/).
// Sem dependências. Uso: node <plugin>/kit/ws.mjs <comando> [args]
//
// Comandos:
//   init                     cria .work-state/ no repositório atual e o exclui do git localmente
//   dir                      imprime o caminho absoluto do .work-state/ (resolve worktrees)
//   event k=v [k=v ...]      grava uma linha em events.log e regera o painel
//   render                   regera index.json e dashboard.html a partir de tasks/*.md
//   serve [porta]            servidor local (127.0.0.1) para o painel em tempo real
//   context-status           lista as fontes de contexto e diz se o context-summary.md está velho
//   hook                     entrada de hook (Stop, SubagentStop, PostToolUse): lê JSON do stdin
//   guard                    hook PreToolUse: bloqueia git push se o gate da task não passou

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const KIT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DIRNAME = '.work-state';

// ---------- git / caminhos ----------

function git(args, cwd) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

// Raiz do repositório principal, mesmo quando chamado de dentro de um worktree.
function mainRepoRoot(cwd) {
  const common = git(['rev-parse', '--path-format=absolute', '--git-common-dir'], cwd);
  if (!common) return '';
  return path.basename(common) === '.git' ? path.dirname(common) : common;
}

function resolveStateDir(cwd = process.cwd()) {
  if (process.env.WORK_STATE_DIR) return path.resolve(process.env.WORK_STATE_DIR);
  const root = mainRepoRoot(cwd);
  return root ? path.join(root, DIRNAME) : '';
}

function currentBranch(cwd) {
  return git(['rev-parse', '--abbrev-ref', 'HEAD'], cwd);
}

// feat/1234-filtro-periodo -> 1234
function taskFromBranch(branch) {
  const m = (branch || '').match(/(?:^|[\/_-])(\d{2,})(?:[\/_-]|$)/);
  return m ? m[1] : '';
}

function inferTask(cwd) {
  return process.env.WS_TASK || taskFromBranch(currentBranch(cwd));
}

function inferAgent(cwd) {
  if (process.env.WS_AGENT) return process.env.WS_AGENT;
  const top = git(['rev-parse', '--show-toplevel'], cwd);
  const main = mainRepoRoot(cwd);
  if (!top) return 'desconhecido';
  return path.resolve(top) === path.resolve(main) ? 'principal' : path.basename(top);
}

function localIso(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  const a = Math.abs(off);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${sign}${pad(Math.floor(a / 60))}:${pad(a % 60)}`;
}

function writeAtomic(file, content) {
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, content);
  try {
    fs.renameSync(tmp, file);
  } catch {
    fs.writeFileSync(file, content);
    try { fs.unlinkSync(tmp); } catch {}
  }
}

// ---------- frontmatter ----------

function parseScalar(raw) {
  let v = raw.trim();
  if (/^["']/.test(v)) {
    const q = v[0];
    const end = v.indexOf(q, 1);
    return end > 0 ? v.slice(1, end) : v.slice(1);
  }
  v = v.replace(/\s+#.*$/, '').trim();
  if (v.startsWith('[') && v.endsWith(']')) {
    return v.slice(1, -1).split(',').map((s) => parseScalar(s)).filter((s) => s !== '');
  }
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === 'null' || v === '~') return null;
  return v;
}

export function parseFrontmatter(text) {
  const m = text.match(/^﻿?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)([\s\S]*)$/);
  if (!m) return { data: {}, body: text };
  const data = {};
  let listKey = null;
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const item = line.match(/^\s+-\s+(.*)$/) || line.match(/^-\s+(.*)$/);
    if (item && listKey) {
      data[listKey].push(parseScalar(item[1]));
      continue;
    }
    const kv = line.match(/^([\w.-]+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, rest] = kv;
    if (rest.replace(/\s+#.*$/, '').trim() === '') {
      data[key] = [];
      listKey = key;
    } else {
      data[key] = parseScalar(rest);
      listKey = null;
    }
  }
  return { data, body: m[2] };
}

function section(body, title) {
  const re = new RegExp(`^##\\s+${title}\\s*$`, 'im');
  const m = body.match(re);
  if (!m) return null;
  const rest = body.slice(m.index + m[0].length);
  const next = rest.search(/^##\s+/m);
  return next >= 0 ? rest.slice(0, next) : rest;
}

function firstField(block, label) {
  if (!block) return '';
  const m = block.match(new RegExp(`^\\s*-\\s*${label}\\s*:?\\s*(.+)$`, 'im'));
  return m ? m[1].trim() : '';
}

// ---------- eventos ----------

function parseEventLine(line) {
  const ts = line.split(/\s+/, 1)[0];
  const ev = { ts, raw: line };
  const re = /(\w[\w-]*)=("([^"]*)"|\S+)/g;
  let m;
  while ((m = re.exec(line))) ev[m[1]] = m[3] !== undefined ? m[3] : m[2];
  return ev;
}

function readEvents(stateDir) {
  const file = path.join(stateDir, 'events.log');
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean).map(parseEventLine);
}

function appendEvent(stateDir, fields, cwd) {
  const f = { ...fields };
  if (!f.task) f.task = inferTask(cwd) || '-';
  if (!f.agente) f.agente = inferAgent(cwd);
  const order = ['task', 'agente', 'evento'];
  const keys = [...order.filter((k) => k in f), ...Object.keys(f).filter((k) => !order.includes(k))];
  const parts = keys.map((k) => {
    const v = String(f[k]).replace(/[\r\n"]+/g, ' ').trim();
    return /\s/.test(v) || v === '' ? `${k}="${v}"` : `${k}=${v}`;
  });
  fs.appendFileSync(path.join(stateDir, 'events.log'), `${localIso()} ${parts.join(' ')}\n`);
}

// ---------- render ----------

const ESPERA_POR_MIM = new Set(['revisao-humana', 'teste-navegador', 'teste-manual']);

function classify(t) {
  const pend = Array.isArray(t.pendencias) ? t.pendencias : [];
  if (t.fase === 'aguardando-decisao') return { ordem: 0, grupo: 'decisao' };
  if (
    (t.fase === 'spec' && t.spec_aprovada !== true) ||
    t.fase === 'revisao' ||
    t.fase === 'teste-manual' ||
    pend.some((p) => ESPERA_POR_MIM.has(p))
  ) return { ordem: 1, grupo: 'espera' };
  if (t.fase === 'bloqueada' || pend.some((p) => /^aguarda-filha-|conflito|ci-falhando/.test(p))) return { ordem: 2, grupo: 'bloqueada' };
  if (t.fase === 'pronta-merge') return { ordem: 4, grupo: 'pronta' };
  if (t.fase === 'nova' || !t.fase) return { ordem: 5, grupo: 'nova' };
  return { ordem: 3, grupo: 'andamento' };
}

function loadTasks(stateDir, events) {
  const dir = path.join(stateDir, 'tasks');
  if (!fs.existsSync(dir)) return [];
  const lastEventByTask = {};
  for (const e of events) if (e.task) lastEventByTask[e.task] = e;
  const tasks = [];
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.md')) continue;
    const file = path.join(dir, name);
    let text;
    try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
    const { data, body } = parseFrontmatter(text);
    const id = String(data.id ?? name.replace(/\.md$/, ''));
    const crit = section(body, 'Crit[ée]rios de aceite') || '';
    const checks = [...crit.matchAll(/^\s*-\s*\[([ xX])\]\s*(.*)$/gm)];
    const decisao = section(body, 'Decis[ãa]o necess[áa]ria');
    const novo = section(body, 'Trabalho novo descoberto');
    const mtime = fs.statSync(file).mtime;
    const last = lastEventByTask[id];
    const candidates = [data.atualizado_em, mtime.toISOString(), last && last.ts]
      .filter(Boolean)
      .map((s) => new Date(s))
      .filter((d) => !isNaN(d));
    const atividade = candidates.length ? new Date(Math.max(...candidates)) : mtime;
    const t = {
      ...data,
      id,
      pendencias: Array.isArray(data.pendencias) ? data.pendencias : data.pendencias ? [data.pendencias] : [],
      filhas: Array.isArray(data.filhas) ? data.filhas.map(String) : data.filhas ? [String(data.filhas)] : [],
      mae: data.mae != null && data.mae !== '' ? String(data.mae) : '',
      ca_ok: checks.filter((c) => c[1] !== ' ').length,
      ca_total: checks.length,
      decisao: decisao ? firstField(decisao, 'O que [ée]') || 'ver arquivo da task' : '',
      trabalho_novo: novo ? firstField(novo, 'O que [ée]') || 'ver arquivo da task' : '',
      ultima_atividade: localIso(atividade),
      ultimo_evento: last ? `${last.evento || ''}${last.resultado ? ' (' + last.resultado + ')' : ''}` : '',
      arquivo: path.relative(stateDir, file).replace(/\\/g, '/'),
    };
    Object.assign(t, classify(t));
    tasks.push(t);
  }
  // progresso das filhas na mãe
  const byId = Object.fromEntries(tasks.map((t) => [t.id, t]));
  for (const t of tasks) {
    const kids = tasks.filter((k) => k.mae === t.id || t.filhas.includes(k.id));
    t.filhas = [...new Set([...t.filhas, ...kids.map((k) => k.id)])];
    t.filhas_prontas = t.filhas.filter((k) => byId[k] && byId[k].fase === 'pronta-merge').length;
  }
  return tasks;
}

function render(stateDir) {
  if (!fs.existsSync(stateDir)) throw new Error(`não existe: ${stateDir} (rode: ws.mjs init)`);
  const events = readEvents(stateDir);
  const tasks = loadTasks(stateDir, events);
  const syncs = events.filter((e) => e.evento === 'sync');
  let config = {};
  try { config = JSON.parse(fs.readFileSync(path.join(stateDir, 'config.json'), 'utf8')); } catch {}
  const roots = tasks.filter((t) => !t.mae || !tasks.some((m) => m.id === t.mae));
  const resumo = {
    decisao: tasks.filter((t) => t.grupo === 'decisao').length,
    espera: tasks.filter((t) => t.grupo === 'espera').length,
    bloqueada: tasks.filter((t) => t.grupo === 'bloqueada').length,
    andamento: tasks.filter((t) => t.grupo === 'andamento').length,
    pronta: tasks.filter((t) => t.grupo === 'pronta').length,
    total: tasks.length,
    raizes: roots.length,
  };
  const index = {
    gerado_em: localIso(),
    repo: config.repo || path.basename(path.dirname(stateDir)),
    ado_url: config.ado_url || '',
    ultima_sync: syncs.length ? syncs[syncs.length - 1].ts : null,
    resumo,
    tasks,
    eventos: events.slice(-40).reverse().map((e) => e.raw),
  };
  const json = JSON.stringify(index, null, 2);
  writeAtomic(path.join(stateDir, 'index.json'), json);
  const tpl = fs.readFileSync(path.join(KIT_DIR, 'dashboard.template.html'), 'utf8');
  const safe = JSON.stringify(index).replace(/</g, '\\u003c');
  writeAtomic(path.join(stateDir, 'dashboard.html'), tpl.replace('/*__INITIAL_DATA__*/null', safe));
  return index;
}

// ---------- init ----------

function init(cwd) {
  const root = mainRepoRoot(cwd);
  if (!root) throw new Error('não é um repositório git');
  const stateDir = path.join(root, DIRNAME);
  fs.mkdirSync(path.join(stateDir, 'tasks'), { recursive: true });
  const ev = path.join(stateDir, 'events.log');
  if (!fs.existsSync(ev)) fs.writeFileSync(ev, '');
  const cfg = path.join(stateDir, 'config.json');
  if (!fs.existsSync(cfg)) {
    const remote = git(['remote', 'get-url', 'origin'], root);
    fs.writeFileSync(cfg, JSON.stringify({
      repo: path.basename(root),
      remote,
      ado_url: '',
      ado_projeto: '',
      ado_area: '',
      max_agentes: 2,
    }, null, 2) + '\n');
  }
  const exclude = path.join(root, '.git', 'info', 'exclude');
  fs.mkdirSync(path.dirname(exclude), { recursive: true });
  const cur = fs.existsSync(exclude) ? fs.readFileSync(exclude, 'utf8') : '';
  if (!cur.split(/\r?\n/).some((l) => l.trim() === `${DIRNAME}/` || l.trim() === DIRNAME)) {
    fs.appendFileSync(exclude, `${cur && !cur.endsWith('\n') ? '\n' : ''}${DIRNAME}/\n`);
  }
  render(stateDir);
  return stateDir;
}

// ---------- context-status ----------

const SKIP = new Set(['node_modules', '.git', DIRNAME, 'dist', 'build', 'bin', 'obj', '.next', 'coverage', 'vendor']);
const CONTEXT_DIRS = new Set(['context', 'contexto', 'docs', 'doc', 'adr', 'adrs', 'decisions']);
const CONFIG_RE = /^(\.eslintrc.*|eslint\.config\..*|tsconfig.*\.json|package\.json|\.editorconfig|\.prettierrc.*|prettier\.config\..*|biome\.json|\.stylelintrc.*|Directory\.Build\.props|\.globalconfig|pyproject\.toml|ruff\.toml)$/i;

function walk(dir, depth, out, inContext) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (out.length > 400) return;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP.has(e.name)) continue;
      if (inContext) { if (depth > 0) walk(p, depth - 1, out, true); }
      else if (CONTEXT_DIRS.has(e.name.toLowerCase())) walk(p, 4, out, true);
      else if (depth > 0) walk(p, depth - 1, out, false);
    } else if (inContext ? /\.(md|mdx|txt|adoc|ya?ml|json)$/i.test(e.name) : ['CLAUDE.md', 'CONTEXT.md', 'AGENTS.md'].includes(e.name) || CONFIG_RE.test(e.name)) {
      out.push(p);
    }
  }
}

function contextStatus(cwd) {
  const top = git(['rev-parse', '--show-toplevel'], cwd) || cwd;
  const stateDir = resolveStateDir(cwd);
  const files = [];
  walk(top, 2, files, false);
  const summary = stateDir ? path.join(stateDir, 'context-summary.md') : '';
  const summaryTime = summary && fs.existsSync(summary) ? fs.statSync(summary).mtimeMs : 0;
  let newest = 0;
  let newestFile = '';
  for (const f of files) {
    const t = fs.statSync(f).mtimeMs;
    if (t > newest) { newest = t; newestFile = f; }
  }
  return {
    raiz: top,
    resumo: summary,
    resumo_existe: summaryTime > 0,
    desatualizado: summaryTime === 0 || newest > summaryTime,
    fonte_mais_recente: newestFile ? path.relative(top, newestFile).replace(/\\/g, '/') : '',
    fontes: files.map((f) => path.relative(top, f).replace(/\\/g, '/')),
  };
}

// ---------- hooks ----------

function readStdin() {
  try { return fs.readFileSync(0, 'utf8'); } catch { return ''; }
}

const BASH_EVENTS = [
  [/\bgit\s+commit\b/, 'commit'],
  [/\bgit\s+push\b/, 'push'],
  [/\bgh\s+pr\s+create\b|\baz\s+repos\s+pr\s+create\b/, 'pr-aberto'],
  [/\b(npm|pnpm|yarn|bun)\s+(run\s+)?test\b|\bnpx\s+(jest|vitest|playwright)\b|\b(jest|vitest|pytest|dotnet\s+test|go\s+test|cargo\s+test|mvn\s+test|gradle\w*\s+test)\b/, 'teste'],
];

function hook() {
  let input = {};
  try { input = JSON.parse(readStdin() || '{}'); } catch {}
  const cwd = input.cwd || process.cwd();
  const stateDir = resolveStateDir(cwd);
  if (!stateDir || !fs.existsSync(stateDir)) return; // repositório sem .work-state: não faz nada
  const name = input.hook_event_name;
  const fields = {};
  if (name === 'Stop') fields.evento = 'agente-parado';
  else if (name === 'SubagentStop') fields.evento = 'subagente-finalizado';
  else if (name === 'PostToolUse') {
    const tool = input.tool_name;
    const ti = input.tool_input || {};
    if (tool === 'Bash' || tool === 'PowerShell') {
      const cmd = String(ti.command || '');
      const hit = BASH_EVENTS.find(([re]) => re.test(cmd));
      if (!hit) return;
      fields.evento = hit[1];
      const resp = input.tool_response || {};
      if (hit[1] === 'teste' && typeof resp === 'object') {
        const code = resp.exitCode ?? resp.exit_code ?? resp.returnCode;
        if (code !== undefined) fields.resultado = code === 0 ? 'ok' : 'falhou';
        else if (resp.interrupted) fields.resultado = 'interrompido';
      }
    } else if (['Edit', 'Write', 'MultiEdit'].includes(tool)) {
      const fp = path.resolve(cwd, String(ti.file_path || ''));
      const tasksDir = path.join(stateDir, 'tasks') + path.sep;
      if (!fp.toLowerCase().startsWith(tasksDir.toLowerCase()) || !fp.endsWith('.md')) return;
      fields.evento = 'task-atualizada';
      fields.task = path.basename(fp, '.md');
    } else return;
  } else return;
  appendEvent(stateDir, fields, cwd);
  render(stateDir);
}

function guard() {
  let input = {};
  try { input = JSON.parse(readStdin() || '{}'); } catch {}
  if (process.env.WS_ALLOW_PUSH === '1') return 0;
  const cmd = String((input.tool_input || {}).command || '');
  if (!/\bgit\s+push\b/.test(cmd)) return 0;
  const cwd = input.cwd || process.cwd();
  const stateDir = resolveStateDir(cwd);
  const task = inferTask(cwd);
  if (!stateDir || !task) return 0;
  const file = path.join(stateDir, 'tasks', `${task}.md`);
  if (!fs.existsSync(file)) return 0;
  const { data } = parseFrontmatter(fs.readFileSync(file, 'utf8'));
  if (data.gate === 'passou') return 0;
  process.stderr.write(
    `Push bloqueado: o gate da task ${task} está "${data.gate || 'nao-rodou'}". ` +
    `Rode /gate ${task} e só faça push quando gate: passou. ` +
    `Para liberar manualmente, a pessoa pode definir WS_ALLOW_PUSH=1.\n`
  );
  return 2;
}

// ---------- serve ----------

function serve(stateDir, port) {
  const types = { '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.log': 'text/plain; charset=utf-8' };
  const server = http.createServer((req, res) => {
    let rel = decodeURIComponent((req.url || '/').split('?')[0]);
    if (rel === '/') rel = '/dashboard.html';
    const file = path.resolve(stateDir, '.' + rel);
    if (!file.startsWith(path.resolve(stateDir)) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end('não encontrado'); return;
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
  server.on('error', (e) => { console.error(e.code === 'EADDRINUSE' ? `porta ${port} em uso (o painel já pode estar no ar: http://127.0.0.1:${port}/)` : e.message); process.exit(1); });
  server.listen(port, '127.0.0.1', () => console.log(`painel: http://127.0.0.1:${port}/  (Ctrl+C para parar)`));
}

// ---------- main ----------

function parseKv(args) {
  const out = {};
  for (const a of args) {
    const i = a.indexOf('=');
    if (i > 0) out[a.slice(0, i)] = a.slice(i + 1);
  }
  return out;
}

function main() {
  const [cmd, ...args] = process.argv.slice(2);
  const cwd = process.cwd();
  try {
    switch (cmd) {
      case 'init': console.log(init(cwd)); break;
      case 'dir': {
        const d = resolveStateDir(cwd);
        if (!d) throw new Error('não é um repositório git');
        console.log(d); break;
      }
      case 'event': {
        const d = resolveStateDir(cwd);
        if (!d || !fs.existsSync(d)) throw new Error('sem .work-state (rode: ws.mjs init)');
        const kv = parseKv(args);
        if (!kv.evento) throw new Error('informe evento=<nome>');
        appendEvent(d, kv, cwd);
        render(d);
        break;
      }
      case 'render': {
        const idx = render(resolveStateDir(cwd));
        console.log(`${idx.resumo.total} tasks; decisão: ${idx.resumo.decisao}, espera por você: ${idx.resumo.espera}, bloqueadas: ${idx.resumo.bloqueada}, prontas: ${idx.resumo.pronta}`);
        break;
      }
      case 'serve': serve(resolveStateDir(cwd), Number(args[0]) || 4777); break;
      case 'context-status': console.log(JSON.stringify(contextStatus(cwd), null, 2)); break;
      case 'hook': try { hook(); } catch {} process.exit(0); // hook nunca falha a sessão
      case 'guard': { let code = 0; try { code = guard(); } catch {} process.exit(code); }
      default:
        console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 14).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
        process.exit(cmd ? 1 : 0);
    }
  } catch (e) {
    console.error(`ws: ${e.message}`);
    process.exit(1);
  }
}

main();
