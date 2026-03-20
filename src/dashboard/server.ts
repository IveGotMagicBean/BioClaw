import fs from 'fs';
import http, { IncomingMessage, ServerResponse } from 'http';
import path from 'path';
import { URL } from 'url';

import { setAgentTraceListener, type AgentTraceRow } from '../agent-trace.js';
import {
  DASHBOARD_HOST,
  DASHBOARD_PORT,
  DASHBOARD_TOKEN,
  ENABLE_DASHBOARD,
  GROUPS_DIR,
} from '../config.js';
import { getAgentTraceEvents } from '../db/index.js';
import { logger } from '../logger.js';

let httpServer: http.Server | undefined;
const sseClients = new Set<ServerResponse>();

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function authOk(req: IncomingMessage, url: URL): boolean {
  if (!DASHBOARD_TOKEN) return true;
  const auth = req.headers.authorization;
  if (auth === `Bearer ${DASHBOARD_TOKEN}`) return true;
  if (url.searchParams.get('token') === DASHBOARD_TOKEN) return true;
  return false;
}

function broadcastTrace(row: AgentTraceRow): void {
  const line = `data: ${JSON.stringify(row)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(line);
    } catch {
      sseClients.delete(client);
    }
  }
}

function safeResolvedGroupDir(folder: string): string | null {
  if (!/^[a-zA-Z0-9._-]+$/.test(folder)) return null;
  const base = path.resolve(GROUPS_DIR);
  const target = path.resolve(path.join(GROUPS_DIR, folder));
  const rel = path.relative(base, target);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) return null;
  return target;
}

interface TreeNode {
  name: string;
  relPath: string;
  type: 'dir' | 'file';
  children?: TreeNode[];
}

function readTree(
  absDir: string,
  relPrefix: string,
  depth: number,
  maxDepth: number,
  budget: { n: number },
  maxNodes: number,
): TreeNode[] {
  if (depth > maxDepth || budget.n >= maxNodes) return [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(absDir, { withFileTypes: true });
  } catch {
    return [];
  }
  entries.sort((a, b) => {
    if (a.isDirectory() === b.isDirectory()) return a.name.localeCompare(b.name);
    return a.isDirectory() ? -1 : 1;
  });
  const out: TreeNode[] = [];
  for (const ent of entries) {
    if (budget.n >= maxNodes) break;
    if (ent.name === '.git' || ent.name === 'node_modules') continue;
    const relPath = relPrefix ? `${relPrefix}/${ent.name}` : ent.name;
    if (ent.isDirectory()) {
      budget.n += 1;
      const children = readTree(
        path.join(absDir, ent.name),
        relPath,
        depth + 1,
        maxDepth,
        budget,
        maxNodes,
      );
      out.push({ name: ent.name, relPath, type: 'dir', children });
    } else if (ent.isFile()) {
      budget.n += 1;
      out.push({ name: ent.name, relPath, type: 'file' });
    }
  }
  return out;
}

function listGroupFolders(): string[] {
  try {
    return fs
      .readdirSync(GROUPS_DIR)
      .filter((name) => {
        const p = path.join(GROUPS_DIR, name);
        try {
          return fs.statSync(p).isDirectory();
        } catch {
          return false;
        }
      })
      .sort();
  } catch {
    return [];
  }
}

function dashboardHtml(merged: boolean): string {
  const streamQs = DASHBOARD_TOKEN
    ? `?token=${encodeURIComponent(DASHBOARD_TOKEN)}`
    : '';
  const tokenJs = JSON.stringify(DASHBOARD_TOKEN);
  const mergedNavSettings = merged
    ? `<div class="drawer-section"><a class="set-link" id="nav-chat" href="/"></a></div>`
    : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>BioClaw · Lab trace</title>
  <style>
    :root {
      --bg: #06080d;
      --surface: #0e131a;
      --raised: #141c26;
      --text: #e8eef4;
      --muted: #8b9cb0;
      --acc: #3ecf8e;
      --line: rgba(255,255,255,.09);
      --warn: #f59e0b;
      --radius: 12px;
      --header-h: 72px;
    }
    * { box-sizing: border-box; }
    html, body { height: 100%; margin: 0; overflow: hidden; }
    body {
      font-family: ui-sans-serif, system-ui, "PingFang SC", "Microsoft YaHei", sans-serif;
      background: var(--bg);
      color: var(--text);
      max-height: 100dvh;
      display: flex;
      flex-direction: column;
      background-image: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(62,207,142,.08), transparent);
    }
    .dash-header {
      flex-shrink: 0;
      z-index: 30;
      padding: 14px 22px;
      border-bottom: 1px solid var(--line);
      background: color-mix(in srgb, var(--bg) 88%, transparent);
      backdrop-filter: blur(14px);
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
    }
    .dash-title-block h1 { margin: 0; font-size: 20px; font-weight: 650; letter-spacing: -0.02em; }
    .dash-sub { margin: 6px 0 0; color: var(--muted); font-size: 13px; line-height: 1.45; max-width: 52ch; }
    .dash-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
    }
    .fld { font-size: 13px; color: var(--muted); display: flex; align-items: center; gap: 8px; }
    select, .btn {
      background: var(--raised);
      color: var(--text);
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 8px 12px;
      font: inherit;
    }
    select { min-width: 140px; }
    .btn { cursor: pointer; }
    .btn:hover { border-color: var(--acc); color: var(--acc); }
    .trace-opt {
      font-size: 12px;
      color: var(--muted);
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      user-select: none;
    }
    .trace-opt input { accent-color: var(--acc); cursor: pointer; }
    .icon-btn {
      width: 40px; height: 40px;
      border-radius: 10px;
      border: 1px solid var(--line);
      background: var(--raised);
      color: var(--text);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .icon-btn:hover { border-color: var(--acc); color: var(--acc); }
    .conn-pill {
      font-size: 12px;
      padding: 6px 11px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: var(--raised);
      color: var(--muted);
    }
    .conn-pill.ok { color: var(--acc); border-color: color-mix(in srgb, var(--acc) 40%, var(--line)); }
    .conn-pill.bad { color: var(--warn); border-color: color-mix(in srgb, var(--warn) 40%, var(--line)); }
    main {
      flex: 1 1 0;
      min-height: 0;
      overflow: hidden;
      display: grid;
      grid-template-columns: 1fr min(320px, 34vw);
      grid-template-rows: minmax(0, 1fr);
      gap: 0;
    }
    @media (max-width: 900px) {
      main { grid-template-columns: 1fr; grid-template-rows: minmax(0, 1fr) minmax(0, 38%); }
    }
    #timeline {
      padding: 18px 20px;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
    }
    #sidebar {
      border-left: 1px solid var(--line);
      padding: 18px 16px;
      background: var(--surface);
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
    }
    @media (max-width: 900px) {
      #sidebar { border-left: 0; border-top: 1px solid var(--line); }
    }
    .evt {
      border: 1px solid var(--line);
      border-radius: var(--radius);
      padding: 12px 14px;
      margin-bottom: 12px;
      background: var(--raised);
      border-left: 3px solid var(--acc);
      box-shadow: 0 2px 14px rgba(0,0,0,.15);
    }
    .evt-trace-run_end_err { border-left-color: var(--warn); }
    .evt-trace-run_end_ok { border-left-color: var(--acc); }
    .evt-trace-stream_output { border-left-color: color-mix(in srgb, #5b9cf5 55%, var(--line)); }
    .evt-trace-container_spawn { border-left-color: color-mix(in srgb, var(--muted) 80%, var(--line)); }
    .evt header { padding: 0; border: 0; background: transparent; display: block; }
    .evt-headline { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; }
    .type { font-weight: 600; color: var(--acc); font-size: 13px; }
    .when { color: var(--muted); font-size: 11px; margin-top: 6px; }
    .evt-body { margin-top: 8px; font-size: 13px; line-height: 1.45; }
    .evt-kv { font-size: 12px; color: var(--muted); margin: 4px 0; }
    .evt-kv strong { color: var(--text); font-weight: 600; }
    .evt-preview {
      margin-top: 8px;
      padding: 8px 10px;
      border-radius: 10px;
      background: var(--bg);
      border: 1px solid var(--line);
      font-size: 12px;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 140px;
      overflow-y: auto;
      color: var(--text);
    }
    .evt-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .evt-badge.ok { background: rgba(62,207,142,.18); color: var(--acc); }
    .evt-badge.err { background: rgba(245,158,11,.2); color: var(--warn); }
    .evt-mono { font-family: ui-monospace, monospace; font-size: 11px; word-break: break-all; }
    .evt-raw { margin-top: 10px; font-size: 11px; color: var(--muted); }
    .evt-raw summary { cursor: pointer; user-select: none; }
    .evt-raw pre {
      margin: 8px 0 0;
      font-size: 11px;
      color: var(--muted);
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 200px;
      overflow: auto;
      font-family: ui-monospace, monospace;
      padding: 8px;
      border-radius: 10px;
      background: var(--bg);
      border: 1px solid var(--line);
    }
    .pill { display: inline-block; font-size: 10px; padding: 2px 8px; border-radius: 6px; background: var(--line); margin-right: 6px; }
    .tree { font-size: 12px; color: var(--muted); }
    .tree details { margin: 4px 0 4px 8px; }
    .tree summary { cursor: pointer; color: var(--text); }
    .sidebar-title { font-size: 13px; font-weight: 600; }
    .sidebar-hint { color: var(--muted); font-size: 12px; line-height: 1.45; margin: 8px 0; }
    .db-drawer-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.45);
      z-index: 100;
      opacity: 0;
      visibility: hidden;
      transition: opacity .2s, visibility .2s;
    }
    .db-drawer-backdrop.is-open { opacity: 1; visibility: visible; }
    .db-drawer {
      position: fixed;
      top: 0;
      right: 0;
      width: min(100%, 360px);
      height: 100%;
      z-index: 101;
      background: var(--surface);
      border-left: 1px solid var(--line);
      box-shadow: -12px 0 40px rgba(0,0,0,.35);
      transform: translateX(100%);
      transition: transform .25s ease;
      display: flex;
      flex-direction: column;
    }
    .db-drawer.is-open { transform: translateX(0); }
    .db-drawer-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 18px;
      border-bottom: 1px solid var(--line);
    }
    .db-drawer-head h2 { margin: 0; font-size: 17px; font-weight: 650; }
    .db-drawer-body { padding: 16px 18px; overflow-y: auto; flex: 1; }
    .drawer-section { margin-bottom: 8px; }
    .set-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 0;
      border-bottom: 1px solid var(--line);
    }
    .set-row span { font-size: 14px; }
    .set-link {
      display: block;
      text-align: center;
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid var(--line);
      background: var(--raised);
      color: var(--acc);
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
    }
    .set-link:hover { border-color: var(--acc); }
  </style>
</head>
<body>
  <header class="dash-header">
    <div class="dash-title-block">
      <h1 id="i18n-h1">BioClaw · Lab trace</h1>
      <p class="dash-sub" id="i18n-sub"></p>
    </div>
    <div class="dash-actions">
      <label class="fld"><span id="i18n-group-label"></span> <select id="group"><option value="" id="opt-all"></option></select></label>
      <button type="button" class="btn" id="reload"></button>
      <label class="trace-opt" for="dashTraceStream"><input type="checkbox" id="dashTraceStream" /><span id="dashTraceStreamLabel"></span></label>
      <span class="conn-pill" id="conn"></span>
      <button type="button" class="icon-btn" id="open-settings" aria-label="">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      </button>
    </div>
  </header>
  <main>
    <section id="timeline"></section>
    <aside id="sidebar">
      <strong class="sidebar-title" id="i18n-sidebar-title"></strong>
      <p class="sidebar-hint" id="i18n-sidebar-hint"></p>
      <div id="tree" class="tree"></div>
    </aside>
  </main>
  <div class="db-drawer-backdrop" id="dbBackdrop" aria-hidden="true"></div>
  <aside class="db-drawer" id="dbDrawer" aria-hidden="true" aria-labelledby="dbSettingsTitle">
    <div class="db-drawer-head">
      <h2 id="dbSettingsTitle"></h2>
      <button type="button" class="icon-btn" id="close-settings" aria-label="">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="db-drawer-body">
      <div class="set-row">
        <span id="lbl-setting-lang"></span>
        <button type="button" class="btn btn-lang" id="lang-toggle" title="Language"></button>
      </div>
      ${mergedNavSettings}
    </div>
  </aside>
  <script>
    const AUTH_TOKEN = ${tokenJs};
    const STREAM_QS = ${JSON.stringify(streamQs)};
    const LANG_KEY = 'bioclaw-dashboard-lang';

    var I18N = {
      zh: {
        pageTitle: 'BioClaw · 实验追踪',
        h1: 'BioClaw · 实验追踪',
        sub: '默认隐藏 Agent 流式片段（与聊天侧重复）；此处为运行起止、容器、IPC 等。勾选「显示流式片段」可看全部中间输出（量多，调试用）。列表与树仍随 SSE 刷新。',
        groupLabel: '群组目录',
        allGroups: '全部',
        reload: '刷新',
        settingsTitle: '设置',
        settingsAria: '打开设置',
        closeSettingsAria: '关闭',
        lblSettingLang: '界面语言',
        langToggle: 'English',
        navChat: '返回本地聊天',
        sseWait: 'SSE 连接中…',
        sseOk: 'SSE 已连接',
        sseBad: 'SSE 断开（请手动刷新）',
        sidebarTitle: '工作区树',
        sidebarHint: '选择上方群组后加载 groups/&lt;folder&gt;',
        treePick: '请选择群组',
        treeEmpty: '（空）',
        loadFail: '加载失败',
        traceStreamLabel: '显示流式片段（调试）',
        evtRunStart: '开始处理',
        evtRunEnd: '运行结束',
        evtRunError: '运行异常',
        evtStream: '模型输出片段',
        evtContainer: '容器启动',
        evtIpc: '跨群发送',
        evtUnknown: '事件',
        traceMsgCount: '待处理消息',
        tracePromptLen: '提示长度',
        traceOutChars: '本段输出字符',
        traceSession: '会话 ID',
        traceContainer: '容器名',
        traceIpcKind: '类型',
        traceRawJson: '原始 JSON',
      },
      en: {
        pageTitle: 'BioClaw · Lab trace',
        h1: 'BioClaw · Lab trace',
        sub: 'Stream chunks are hidden by default (noisy vs chat). This view keeps run start/end, container, IPC, etc. Check “stream chunks” to include every agent stream event (debug). Timeline and tree still refresh over SSE.',
        groupLabel: 'Group folder',
        allGroups: 'All',
        reload: 'Refresh',
        settingsTitle: 'Settings',
        settingsAria: 'Open settings',
        closeSettingsAria: 'Close',
        lblSettingLang: 'Language',
        langToggle: '中文',
        navChat: 'Back to chat',
        sseWait: 'SSE connecting…',
        sseOk: 'SSE connected',
        sseBad: 'SSE disconnected (refresh manually)',
        sidebarTitle: 'Workspace tree',
        sidebarHint: 'Pick a group above to load groups/&lt;folder&gt;',
        treePick: 'Select a group',
        treeEmpty: '(empty)',
        loadFail: 'Load failed',
        traceStreamLabel: 'Show stream chunks (debug)',
        evtRunStart: 'Run started',
        evtRunEnd: 'Run finished',
        evtRunError: 'Run failed',
        evtStream: 'Model output chunk',
        evtContainer: 'Container started',
        evtIpc: 'IPC send',
        evtUnknown: 'Event',
        traceMsgCount: 'Messages batched',
        tracePromptLen: 'Prompt length',
        traceOutChars: 'Chunk chars',
        traceSession: 'Session',
        traceContainer: 'Container',
        traceIpcKind: 'Kind',
        traceRawJson: 'Raw JSON',
      }
    };

    var timeline = document.getElementById('timeline');
    var groupSel = document.getElementById('group');
    var connEl = document.getElementById('conn');
    var treeEl = document.getElementById('tree');
    var dashTraceStreamCb = document.getElementById('dashTraceStream');
    var TRACE_STREAM_KEY = 'bioclaw-trace-stream';
    var traceShowStream = false;
    try { traceShowStream = localStorage.getItem(TRACE_STREAM_KEY) === '1'; } catch (e) {}
    var lang = 'zh';

    function T() { return I18N[lang]; }

    function applyLang(next) {
      lang = next === 'en' ? 'en' : 'zh';
      try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
      var t = T();
      document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
      document.title = t.pageTitle;
      document.getElementById('i18n-h1').textContent = t.h1;
      document.getElementById('i18n-sub').textContent = t.sub;
      document.getElementById('i18n-group-label').textContent = t.groupLabel;
      document.getElementById('opt-all').textContent = t.allGroups;
      document.getElementById('reload').textContent = t.reload;
      document.getElementById('dashTraceStreamLabel').textContent = t.traceStreamLabel;
      document.getElementById('dbSettingsTitle').textContent = t.settingsTitle;
      document.getElementById('open-settings').setAttribute('aria-label', t.settingsAria);
      document.getElementById('close-settings').setAttribute('aria-label', t.closeSettingsAria);
      document.getElementById('lbl-setting-lang').textContent = t.lblSettingLang;
      document.getElementById('lang-toggle').textContent = t.langToggle;
      var nav = document.getElementById('nav-chat');
      if (nav) nav.textContent = t.navChat;
      document.getElementById('i18n-sidebar-title').textContent = t.sidebarTitle;
      document.getElementById('i18n-sidebar-hint').innerHTML = t.sidebarHint;
      if (!groupSel.value) treeEl.textContent = t.treePick;
    }

    (function initLang() {
      var saved = null;
      try { saved = localStorage.getItem(LANG_KEY); } catch (e) {}
      applyLang(saved === 'en' ? 'en' : 'zh');
    })();

    document.getElementById('lang-toggle').onclick = function () {
      applyLang(lang === 'zh' ? 'en' : 'zh');
    };

    function authHeaders() {
      var h = {};
      if (AUTH_TOKEN) h['Authorization'] = 'Bearer ' + AUTH_TOKEN;
      return h;
    }

    function esc(s) {
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function traceTypeTitle(type, t) {
      switch (type) {
        case 'run_start': return t.evtRunStart;
        case 'run_end': return t.evtRunEnd;
        case 'run_error': return t.evtRunError;
        case 'stream_output': return t.evtStream;
        case 'container_spawn': return t.evtContainer;
        case 'ipc_send': return t.evtIpc;
        default: return t.evtUnknown + ' · ' + type;
      }
    }
    function traceParsedPayload(payloadStr) {
      try { return JSON.parse(payloadStr); } catch (e) { return null; }
    }
    function traceRawPretty(payloadStr) {
      try { return JSON.stringify(JSON.parse(payloadStr), null, 2); } catch (e) { return String(payloadStr); }
    }
    function traceExtraEvtClass(r, parsed) {
      if (r.type === 'run_end' && parsed && parsed.status === 'error') return ' evt-trace-run_end_err';
      if (r.type === 'run_end') return ' evt-trace-run_end_ok';
      return '';
    }
    function renderTraceRow(r, t) {
      var parsed = traceParsedPayload(r.payload);
      var rawPretty = traceRawPretty(r.payload);
      var typeSlug = String(r.type).replace(/[^a-zA-Z0-9_-]/g, '_');
      var title = traceTypeTitle(r.type, t);
      var head = '<header><div class="evt-headline"><span class="pill">' + esc(r.group_folder) + '</span><span class="type">' + esc(title) + '</span></div>' +
        '<div class="when">#' + r.id + ' · ' + esc(r.created_at) + (r.chat_jid ? ' · ' + esc(r.chat_jid) : '') + '</div></header>';
      var body = '';
      if (r.type === 'run_start' && parsed) {
        body = '<div class="evt-body"><div class="evt-kv">' + esc(t.traceMsgCount) + ': <strong>' + esc(String(parsed.messageCount ?? '—')) + '</strong>';
        if (parsed.promptLength != null) body += ' · ' + esc(t.tracePromptLen) + ': <strong>' + esc(String(parsed.promptLength)) + '</strong>';
        body += '</div>';
        if (parsed.preview) body += '<div class="evt-preview">' + esc(String(parsed.preview)) + '</div>';
        body += '</div>';
      } else if (r.type === 'stream_output' && parsed) {
        var st = parsed.status === 'error' ? 'err' : 'ok';
        body = '<div class="evt-body"><span class="evt-badge ' + (st === 'err' ? 'err' : 'ok') + '">' + esc(String(parsed.status || '—')) + '</span>';
        if (parsed.resultLength != null) body += ' <span class="evt-kv" style="display:inline">' + esc(t.traceOutChars) + ': <strong>' + esc(String(parsed.resultLength)) + '</strong></span>';
        body += '</div>';
        if (parsed.newSessionId) body += '<div class="evt-kv evt-mono">' + esc(t.traceSession) + ': ' + esc(String(parsed.newSessionId)) + '</div>';
        if (parsed.preview) body += '<div class="evt-preview">' + esc(String(parsed.preview)) + '</div>';
      } else if (r.type === 'run_end' && parsed) {
        body = '<div class="evt-body"><span class="evt-badge ' + (parsed.status === 'error' ? 'err' : 'ok') + '">' + esc(String(parsed.status || '—')) + '</span>';
        if (parsed.error) body += '<div class="evt-preview" style="color:var(--warn)">' + esc(String(parsed.error)) + '</div>';
        body += '</div>';
      } else if (r.type === 'run_error' && parsed) {
        body = '<div class="evt-body"><div class="evt-preview" style="color:var(--warn)">' + esc(String(parsed.message != null ? parsed.message : JSON.stringify(parsed))) + '</div></div>';
      } else if (r.type === 'container_spawn' && parsed) {
        body = '<div class="evt-body"><div class="evt-kv evt-mono">' + esc(t.traceContainer) + ': ' + esc(String(parsed.containerName || '—')) + '</div>' +
          '<div class="evt-kv">main=' + esc(String(parsed.isMain ? 'yes' : 'no')) + ' · scheduled=' + esc(String(parsed.isScheduledTask ? 'yes' : 'no')) + '</div></div>';
      } else if (r.type === 'ipc_send' && parsed) {
        body = '<div class="evt-body"><div class="evt-kv">' + esc(t.traceIpcKind) + ': <strong>' + esc(String(parsed.kind || '—')) + '</strong></div>';
        if (parsed.preview) body += '<div class="evt-preview">' + esc(String(parsed.preview)) + '</div>';
        if (parsed.filePath) body += '<div class="evt-kv evt-mono">' + esc(String(parsed.filePath)) + '</div>';
        if (parsed.caption) body += '<div class="evt-kv">' + esc(String(parsed.caption)) + '</div>';
        body += '</div>';
      } else {
        body = '<div class="evt-body"><div class="evt-kv">' + esc(r.type) + '</div></div>';
      }
      var rawBlock = '<details class="evt-raw"><summary>' + esc(t.traceRawJson) + '</summary><pre>' + esc(rawPretty) + '</pre></details>';
      return '<article class="evt evt-trace-' + typeSlug + traceExtraEvtClass(r, parsed) + '">' + head + body + rawBlock + '</article>';
    }
    function renderList(rows) {
      var t = T();
      timeline.innerHTML = rows.map(function (r) { return renderTraceRow(r, t); }).join('');
    }

    async function loadGroups() {
      var res = await fetch('/api/workspace/groups', { headers: authHeaders() });
      if (!res.ok) return;
      var data = await res.json();
      var prev = groupSel.value;
      while (groupSel.options.length > 1) {
        groupSel.remove(1);
      }
      (data.folders || []).forEach(function (f) {
        var o = document.createElement('option');
        o.value = f;
        o.textContent = f;
        groupSel.appendChild(o);
      });
      if (prev && Array.prototype.some.call(groupSel.options, function (o) { return o.value === prev; })) {
        groupSel.value = prev;
      }
    }

    function traceListQuery() {
      var g = groupSel.value;
      var q = '/api/trace/list?limit=400' + (g ? '&group_folder=' + encodeURIComponent(g) : '');
      if (!traceShowStream) q += '&compact=1';
      return q;
    }

    async function loadTrace() {
      var res = await fetch(traceListQuery(), { headers: authHeaders() });
      if (!res.ok) { timeline.textContent = T().loadFail; return; }
      var data = await res.json();
      renderList(data.events || []);
    }

    async function loadTree() {
      var g = groupSel.value;
      if (!g) { treeEl.textContent = T().treePick; return; }
      var res = await fetch('/api/workspace/tree?group_folder=' + encodeURIComponent(g), { headers: authHeaders() });
      if (!res.ok) { treeEl.textContent = T().loadFail; return; }
      var data = await res.json();

      function nodeHtml(n) {
        if (n.type === 'dir') {
          var inner = (n.children || []).map(nodeHtml).join('');
          return '<details open><summary>' + esc(n.name) + '/</summary><div>' + inner + '</div></details>';
        }
        return '<div>· ' + esc(n.name) + '</div>';
      }
      treeEl.innerHTML = (data.tree || []).map(nodeHtml).join('') || T().treeEmpty;
    }

    function connectSse() {
      connEl.textContent = T().sseWait;
      connEl.className = 'conn-pill';
      var url = '/api/trace/stream' + STREAM_QS;
      var es = new EventSource(url);
      es.onopen = function () { connEl.textContent = T().sseOk; connEl.className = 'conn-pill ok'; };
      es.onmessage = function () { loadTrace(); loadTree(); };
      es.onerror = function () {
        connEl.textContent = T().sseBad;
        connEl.className = 'conn-pill bad';
      };
    }

    document.getElementById('reload').onclick = function () { loadTrace(); loadTree(); };
    groupSel.onchange = function () { loadTrace(); loadTree(); };
    if (dashTraceStreamCb) {
      dashTraceStreamCb.checked = traceShowStream;
      dashTraceStreamCb.addEventListener('change', function () {
        traceShowStream = !!dashTraceStreamCb.checked;
        try { localStorage.setItem(TRACE_STREAM_KEY, traceShowStream ? '1' : '0'); } catch (e) {}
        loadTrace();
      });
    }

    (function settingsDrawer() {
      var backdrop = document.getElementById('dbBackdrop');
      var drawer = document.getElementById('dbDrawer');
      function setOpen(o) {
        backdrop.classList.toggle('is-open', o);
        drawer.classList.toggle('is-open', o);
        backdrop.setAttribute('aria-hidden', o ? 'false' : 'true');
        drawer.setAttribute('aria-hidden', o ? 'false' : 'true');
      }
      document.getElementById('open-settings').onclick = function () { setOpen(true); };
      document.getElementById('close-settings').onclick = function () { setOpen(false); };
      backdrop.onclick = function () { setOpen(false); };
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && drawer.classList.contains('is-open')) setOpen(false);
      });
    })();

    loadGroups().then(function () { loadTrace(); loadTree(); connectSse(); });
  </script>
</body>
</html>`;
}

/** Register SSE broadcast for trace rows (call from local web when merged, or from standalone server start). */
export function initDashboardTraceBroadcast(): void {
  setAgentTraceListener((row) => broadcastTrace(row));
}

/** Tear down trace listener and close all dashboard SSE clients. */
export function shutdownDashboardTraceBroadcast(): void {
  setAgentTraceListener(null);
  for (const client of sseClients) {
    try {
      client.end();
    } catch {
      /* ignore */
    }
  }
  sseClients.clear();
}

/**
 * Handle dashboard HTML + APIs. Returns true if the request was handled.
 * - `merged`: `/dashboard` redirects to `/?tab=trace`; APIs on same host as local web.
 * - `standalone`: page at `/`, dedicated DASHBOARD_PORT.
 */
export async function handleDashboardRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  mode: 'standalone' | 'merged',
): Promise<boolean> {
  if (!ENABLE_DASHBOARD) return false;

  if (mode === 'standalone' && req.method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, { ok: true, service: 'bioclaw-dashboard' });
    return true;
  }

  const mergedPage =
    mode === 'merged' &&
    req.method === 'GET' &&
    (url.pathname === '/dashboard' || url.pathname === '/dashboard/');
  const standalonePage =
    mode === 'standalone' &&
    req.method === 'GET' &&
    (url.pathname === '/' || url.pathname === '');
  const isApi =
    url.pathname.startsWith('/api/trace/') || url.pathname.startsWith('/api/workspace/');

  if (!mergedPage && !standalonePage && !isApi) return false;

  if (!authOk(req, url)) {
    sendJson(res, 401, { error: 'Unauthorized' });
    return true;
  }

  if (mergedPage) {
    const tokenParam = url.searchParams.get('token');
    const dest =
      tokenParam !== null && tokenParam !== ''
        ? `/?tab=trace&token=${encodeURIComponent(tokenParam)}`
        : '/?tab=trace';
    res.statusCode = 302;
    res.setHeader('Location', dest);
    res.end();
    return true;
  }

  if (standalonePage) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(dashboardHtml(false));
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/api/trace/list') {
    const limit = parseInt(url.searchParams.get('limit') || '200', 10);
    const group_folder = url.searchParams.get('group_folder') || undefined;
    const compact = url.searchParams.get('compact') === '1' || url.searchParams.get('compact') === 'true';
    const extraOmit = (url.searchParams.get('omit_types') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    let omit_types: string[] | undefined;
    if (compact) {
      omit_types = [...new Set(['stream_output', ...extraOmit])];
    } else if (extraOmit.length > 0) {
      omit_types = extraOmit;
    }
    const events = getAgentTraceEvents({ group_folder, limit, omit_types });
    sendJson(res, 200, { events });
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/api/trace/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write(': stream\n\n');
    sseClients.add(res);
    const hb = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(hb);
      }
    }, 25_000);
    res.on('close', () => {
      clearInterval(hb);
      sseClients.delete(res);
    });
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/api/workspace/groups') {
    sendJson(res, 200, { folders: listGroupFolders() });
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/api/workspace/tree') {
    const folder = url.searchParams.get('group_folder') || '';
    const dir = safeResolvedGroupDir(folder);
    if (!dir) {
      sendJson(res, 400, { error: 'Invalid group_folder' });
      return true;
    }
    const budget = { n: 0 };
    const tree = readTree(dir, '', 0, 5, budget, 400);
    sendJson(res, 200, { group_folder: folder, tree });
    return true;
  }

  sendJson(res, 404, { error: 'Not found' });
  return true;
}

/** Standalone dashboard HTTP server (only when local web is off). */
export async function startDashboardServer(): Promise<void> {
  if (httpServer) return;

  initDashboardTraceBroadcast();

  httpServer = http.createServer((req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    handleDashboardRoutes(req, res, url, 'standalone')
      .then((handled) => {
        if (!handled) sendJson(res, 404, { error: 'Not found' });
      })
      .catch((err) => {
        logger.error({ err }, 'Dashboard request error');
        sendJson(res, 500, { error: 'Internal error' });
      });
  });

  await new Promise<void>((resolve, reject) => {
    httpServer!.once('error', reject);
    httpServer!.listen(DASHBOARD_PORT, DASHBOARD_HOST, () => {
      httpServer!.off('error', reject);
      resolve();
    });
  });

  logger.info(
    { host: DASHBOARD_HOST, port: DASHBOARD_PORT },
    'Dashboard listening (standalone, ENABLE_DASHBOARD)',
  );
  console.log(`\n  Dashboard: http://${DASHBOARD_HOST}:${DASHBOARD_PORT}/\n`);
}

/** Close standalone dashboard port and trace broadcast (no-op if merged into local web). */
export async function stopStandaloneDashboardServer(): Promise<void> {
  if (!httpServer) return;
  shutdownDashboardTraceBroadcast();
  await new Promise<void>((resolve, reject) => {
    httpServer!.close((err) => (err ? reject(err) : resolve()));
  });
  httpServer = undefined;
}

/** @deprecated use stopStandaloneDashboardServer */
export const stopDashboardServer = stopStandaloneDashboardServer;
