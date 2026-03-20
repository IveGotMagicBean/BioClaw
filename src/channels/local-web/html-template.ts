/**
 * Single-page Local Web: chat + lab trace (tabs on narrow screens, split on wide).
 */
import { DASHBOARD_TOKEN } from '../../config.js';
import { WEB_VENDOR_MARKED_PATH, WEB_VENDOR_PURIFY_PATH } from './vendor-scripts.js';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderUnifiedWebPage(chatJid: string, assistantName: string): string {
  const streamQs = DASHBOARD_TOKEN ? `?token=${encodeURIComponent(DASHBOARD_TOKEN)}` : '';
  const tokenJs = JSON.stringify(DASHBOARD_TOKEN);
  const aj = JSON.stringify(assistantName);
  const cj = JSON.stringify(chatJid);

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>BioClaw</title>
  <style>
    :root {
      --bg: #07090d;
      --surface: #0b0e14;
      --surface-raised: #11161e;
      --border: rgba(255, 255, 255, 0.065);
      --ink: #f0f3f8;
      --muted: #7c8a9e;
      --accent: #3ecf8e;
      --accent-muted: rgba(62, 207, 142, 0.12);
      --user: #5b9cf5;
      --user-muted: rgba(91, 156, 245, 0.14);
      --warn: #e8a849;
      --radius: 12px;
      --radius-sm: 8px;
      --font: ui-sans-serif, system-ui, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
      --mono: ui-monospace, "SFMono-Regular", Consolas, monospace;
      --header-h: 52px;
    }
    :root[data-theme="light"] {
      --bg: #f4f6f9;
      --surface: #ffffff;
      --surface-raised: #f8fafc;
      --border: rgba(15, 23, 42, 0.1);
      --ink: #0f172a;
      --muted: #64748b;
      --accent: #059669;
      --accent-muted: rgba(5, 150, 105, 0.1);
      --user: #2563eb;
      --user-muted: rgba(37, 99, 235, 0.1);
      --warn: #d97706;
    }
    :root[data-theme="light"] .tab-bar button[aria-selected="true"] {
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
    }
    * { box-sizing: border-box; }
    html, body { height: 100%; margin: 0; overflow: hidden; }
    body {
      font-family: var(--font);
      color: var(--ink);
      background: var(--bg);
      background-image: radial-gradient(ellipse 120% 70% at 50% -25%, rgba(62, 207, 142, 0.055), transparent);
      -webkit-font-smoothing: antialiased;
    }
    :root[data-theme="light"] body {
      background-image: radial-gradient(ellipse 120% 70% at 50% -25%, rgba(5, 150, 105, 0.04), transparent);
    }
    .unified-root {
      height: 100%;
      max-height: 100dvh;
      width: 100%;
      max-width: none;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      margin: 0;
      padding: 0 clamp(14px, 2.5vw, 28px) 12px;
      overflow: hidden;
    }
    .unified-header {
      position: sticky;
      top: 0;
      z-index: 40;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px 16px;
      flex-wrap: wrap;
      min-height: var(--header-h);
      padding: 8px 0;
      margin-bottom: 4px;
      background: color-mix(in srgb, var(--bg) 92%, transparent);
      backdrop-filter: blur(12px) saturate(1.2);
      border-bottom: 1px solid var(--border);
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
      flex: 0 1 auto;
    }
    .logo {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-weight: 650;
      font-size: 15px;
      letter-spacing: -0.035em;
      color: var(--ink);
      line-height: 1;
      flex-shrink: 0;
    }
    .logo-mark {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent);
      flex-shrink: 0;
      box-shadow: 0 0 12px color-mix(in srgb, var(--accent) 45%, transparent);
    }
    .tab-bar {
      display: inline-flex;
      align-items: center;
      padding: 3px;
      gap: 0;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      flex-shrink: 0;
    }
    .tab-bar button {
      border: none;
      background: transparent;
      color: var(--muted);
      padding: 6px 13px;
      border-radius: 6px;
      font: inherit;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.01em;
      cursor: pointer;
      line-height: 1.25;
      transition: color 0.12s, background 0.12s;
    }
    .tab-bar button:hover { color: var(--ink); }
    .tab-bar button[aria-selected="true"] {
      color: var(--ink);
      background: var(--surface);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      flex-shrink: 0;
      margin-left: auto;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 28px;
      padding: 0 10px;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.02em;
      color: var(--muted);
      border-radius: 999px;
      border: 1px solid var(--border);
      background: var(--surface);
      white-space: nowrap;
    }
    .pill .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--muted);
      flex-shrink: 0;
      opacity: 0.85;
    }
    .dot.live {
      background: var(--accent);
      opacity: 1;
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 22%, transparent);
    }
    .dot.poll { background: var(--warn); opacity: 1; }
    .trace-pill.ok { color: color-mix(in srgb, var(--accent) 88%, var(--ink)); }
    .trace-pill.bad { color: var(--warn); }
    .icon-btn {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--muted);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: color 0.15s, border-color 0.15s, background 0.15s;
    }
    .icon-btn:hover {
      color: var(--ink);
      border-color: color-mix(in srgb, var(--muted) 35%, var(--border));
      background: var(--surface-raised);
    }
    .icon-btn svg { width: 18px; height: 18px; stroke-width: 1.75; }
    .unified-body {
      flex: 1 1 0;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }
    .unified-layout {
      display: flex;
      flex-direction: column;
      gap: 0;
      flex: 1 1 0;
      min-height: 0;
      overflow: hidden;
    }
    .unified-layout > .panel:not(.hidden-narrow) {
      display: flex;
      flex-direction: column;
      flex: 1 1 0;
      min-height: 0;
      overflow: hidden;
    }
    @media (min-width: 1100px) {
      .unified-wide .tab-bar { display: none; }
      .unified-wide .unified-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 18px;
        align-items: stretch;
        flex: 1 1 0;
        min-height: 0;
      }
      .unified-wide .unified-layout > .panel-chat,
      .unified-wide .unified-layout > .panel-trace {
        margin-top: 8px;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: var(--surface);
        min-height: 0;
      }
    }
    .panel { min-height: 0; }
    .panel.hidden-narrow { display: none !important; }
    .unified-wide .panel.hidden-narrow { display: flex !important; }
    .chat-scroll {
      flex: 1 1 0;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 12px 16px 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      -webkit-overflow-scrolling: touch;
    }
    .chat-hero { flex-shrink: 0; padding: 14px 16px 6px; }
    .chat-hero h1 { margin: 0; font-size: 18px; font-weight: 600; letter-spacing: -0.03em; line-height: 1.25; }
    .subtitle { margin: 6px 0 0; font-size: 12px; color: var(--muted); line-height: 1.5; max-width: 44ch; }
    .bubble {
      max-width: min(94%, min(720px, 100%));
      border-radius: var(--radius-sm);
      padding: 11px 14px;
      border: 1px solid var(--border);
      box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06);
    }
    .bubble.user { align-self: flex-end; background: var(--user-muted); border-color: color-mix(in srgb, var(--user) 35%, var(--border)); }
    .bubble.bot { align-self: flex-start; background: var(--accent-muted); border-color: color-mix(in srgb, var(--accent) 30%, var(--border)); }
    .meta { font-size: 11px; color: var(--muted); margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
    .badge { font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 6px; background: var(--surface); border: 1px solid var(--border); }
    .content { font-size: 14px; line-height: 1.55; white-space: normal; word-break: break-word; overflow-x: auto; max-width: 100%; }
    .content a { color: var(--accent); }
    .content p { margin: 0 0 0.65em; }
    .content p:last-child { margin-bottom: 0; }
    .content pre {
      margin: 0.5em 0; padding: 10px 12px; border-radius: var(--radius-sm); background: var(--bg);
      border: 1px solid var(--border); overflow-x: auto; font-family: var(--mono); font-size: 12px; line-height: 1.45;
    }
    .content code { font-family: var(--mono); font-size: 0.9em; padding: 0.12em 0.35em; border-radius: 4px; background: var(--surface-raised); border: 1px solid var(--border); }
    .content pre code { padding: 0; border: none; background: transparent; font-size: inherit; }
    .content ul, .content ol { margin: 0.35em 0 0.65em; padding-left: 1.25em; }
    .content li { margin: 0.22em 0; }
    .content blockquote { margin: 0.5em 0; padding-left: 12px; border-left: 3px solid var(--border); color: var(--muted); }
    .content h1, .content h2, .content h3, .content h4 { margin: 0.65em 0 0.35em; font-size: 1.05em; font-weight: 650; line-height: 1.3; }
    .content h1:first-child, .content h2:first-child, .content h3:first-child, .content h4:first-child { margin-top: 0; }
    .content table { border-collapse: collapse; margin: 0.5em 0; font-size: 13px; width: 100%; }
    .content th, .content td { border: 1px solid var(--border); padding: 6px 10px; text-align: left; vertical-align: top; }
    .content th { background: var(--surface-raised); font-weight: 600; }
    .content hr { border: none; border-top: 1px solid var(--border); margin: 0.75em 0; }
    .content img { max-width: 100%; height: auto; border-radius: var(--radius-sm); }
    .composer-card {
      flex-shrink: 0;
      padding: 14px 16px 16px;
      border-top: 1px solid var(--border);
      background: var(--surface);
    }
    @media (min-width: 1100px) { .unified-wide .composer-card { border-radius: 0 0 var(--radius) var(--radius); } }
    textarea {
      width: 100%;
      min-height: 88px;
      max-height: min(280px, 38vh);
      resize: vertical;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 12px 14px;
      font: inherit;
      background: var(--bg);
      color: var(--ink);
    }
    textarea:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-muted); }
    .row { display: flex; gap: 12px; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-top: 10px; }
    .hint { color: var(--muted); font-size: 12px; max-width: 42ch; }
    .toolbar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .upload { position: relative; overflow: hidden; display: inline-flex; align-items: center; gap: 8px; border-radius: var(--radius-sm);
      padding: 9px 13px; border: 1px solid var(--border); background: var(--bg); cursor: pointer; font-size: 13px; }
    .upload input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
    .filename { color: var(--muted); font-size: 12px; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .status { min-height: 18px; color: var(--muted); font-size: 12px; margin-top: 8px; }
    button.primary {
      border: 0; border-radius: var(--radius-sm); padding: 10px 18px; font: inherit; font-weight: 600;
      background: linear-gradient(135deg, var(--accent), #2a9d6a); color: #04120c; cursor: pointer;
    }
    button.primary:disabled { opacity: 0.5; cursor: wait; }
    .file-card { display: grid; gap: 10px; padding: 14px; border-radius: var(--radius-sm); background: var(--surface-raised); border: 1px solid var(--border); }
    .file-title { font-weight: 600; font-size: 14px; }
    .file-path { font-family: var(--mono); font-size: 12px; color: var(--muted); word-break: break-all; }
    .file-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .file-button {
      display: inline-flex; align-items: center; min-height: 36px; padding: 0 14px; border-radius: var(--radius-sm);
      text-decoration: none; border: 1px solid var(--border); background: var(--surface); color: var(--ink); font-size: 13px;
    }
    .preview { max-width: min(100%, 360px); max-height: 200px; border-radius: var(--radius-sm); object-fit: cover; border: 1px solid var(--border); }
    .trace-toolbar { padding: 12px 14px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
    .trace-opt {
      font-size: 12px;
      color: var(--muted);
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      user-select: none;
    }
    .trace-opt input { accent-color: var(--accent); cursor: pointer; }
    .trace-desc { margin: 0 0 10px; font-size: 13px; color: var(--muted); line-height: 1.45; }
    .trace-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
    .fld { font-size: 13px; color: var(--muted); display: flex; align-items: center; gap: 8px; }
    .fld select, .btn-trace {
      background: var(--surface-raised); color: var(--ink); border: 1px solid var(--border); border-radius: var(--radius-sm);
      padding: 8px 12px; font: inherit;
    }
    .btn-trace { cursor: pointer; }
    .btn-trace:hover { border-color: var(--accent); color: var(--accent); }
    .trace-main {
      display: grid;
      grid-template-columns: 1fr min(280px, 32vw);
      grid-template-rows: minmax(0, 1fr);
      flex: 1 1 0;
      min-height: 0;
      overflow: hidden;
    }
    @media (max-width: 700px) { .trace-main { grid-template-columns: 1fr; grid-template-rows: minmax(0, 1fr) minmax(0, 40%); } }
    .timeline {
      padding: 12px;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
    }
    .trace-sidebar {
      border-left: 1px solid var(--border);
      padding: 12px;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      background: color-mix(in srgb, var(--surface-raised) 80%, transparent);
      -webkit-overflow-scrolling: touch;
    }
    @media (max-width: 700px) {
      .trace-sidebar { border-left: 0; border-top: 1px solid var(--border); }
    }
    .evt {
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      margin-bottom: 10px;
      background: var(--surface-raised);
      border-left: 3px solid var(--accent);
    }
    .evt-trace-run_error, .evt-trace-run_end_err { border-left-color: var(--warn); }
    .evt-trace-run_end_ok { border-left-color: var(--accent); }
    .evt-trace-stream_output { border-left-color: color-mix(in srgb, var(--user) 55%, var(--border)); }
    .evt-trace-container_spawn { border-left-color: color-mix(in srgb, var(--muted) 80%, var(--border)); }
    .evt header { padding: 0; border: 0; background: transparent; display: block; }
    .evt-headline { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; }
    .type { font-weight: 600; color: var(--accent); font-size: 13px; }
    .when { color: var(--muted); font-size: 11px; margin-top: 6px; }
    .evt-body { margin-top: 8px; font-size: 13px; line-height: 1.45; }
    .evt-kv { font-size: 12px; color: var(--muted); margin: 4px 0; }
    .evt-kv strong { color: var(--ink); font-weight: 600; }
    .evt-preview {
      margin-top: 8px;
      padding: 8px 10px;
      border-radius: var(--radius-sm);
      background: var(--bg);
      border: 1px solid var(--border);
      font-size: 12px;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 140px;
      overflow-y: auto;
      color: var(--ink);
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
    .evt-badge.ok { background: var(--accent-muted); color: var(--accent); }
    .evt-badge.err { background: color-mix(in srgb, var(--warn) 22%, transparent); color: var(--warn); }
    .evt-mono { font-family: var(--mono); font-size: 11px; word-break: break-all; }
    .evt-raw { margin-top: 10px; font-size: 11px; color: var(--muted); }
    .evt-raw summary { cursor: pointer; user-select: none; }
    .evt-raw pre {
      margin: 8px 0 0;
      font-size: 11px;
      color: var(--muted);
      white-space: pre-wrap;
      word-break: break-all;
      max-height: min(200px, 26vh);
      overflow: auto;
      font-family: var(--mono);
      padding: 8px;
      border-radius: var(--radius-sm);
      background: var(--bg);
      border: 1px solid var(--border);
    }
    .tpill { display: inline-block; font-size: 10px; padding: 2px 8px; border-radius: 6px; background: var(--border); margin-right: 6px; }
    .sidebar-title { font-size: 13px; font-weight: 600; }
    .sidebar-hint { color: var(--muted); font-size: 12px; line-height: 1.45; margin: 8px 0; }
    .tree { font-size: 12px; color: var(--muted); }
    .tree details { margin: 4px 0 4px 8px; }
    .tree summary { cursor: pointer; color: var(--ink); }
    .drawer-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 100; opacity: 0; visibility: hidden; transition: opacity .2s, visibility .2s; }
    .drawer-backdrop.is-open { opacity: 1; visibility: visible; }
    .drawer { position: fixed; top: 0; right: 0; width: min(100%, 380px); height: 100%; z-index: 101; background: var(--surface);
      border-left: 1px solid var(--border); box-shadow: -16px 0 48px rgba(0,0,0,.35); transform: translateX(100%); transition: transform .25s ease;
      display: flex; flex-direction: column; }
    .drawer.is-open { transform: translateX(0); }
    .drawer-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid var(--border); }
    .drawer-head h2 { margin: 0; font-size: 17px; font-weight: 650; }
    .drawer-body { padding: 16px 18px 24px; overflow-y: auto; flex: 1; }
    .drawer-section { margin-bottom: 20px; }
    .drawer-section h3 { margin: 0 0 10px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
    .setting-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); }
    .setting-label { font-size: 14px; }
    .setting-value { font-size: 13px; color: var(--muted); }
    .btn-setting { border: 1px solid var(--border); background: var(--surface-raised); color: var(--ink); border-radius: var(--radius-sm); padding: 8px 14px; font: inherit; font-size: 13px; cursor: pointer; }
    .btn-setting:hover { border-color: var(--accent); color: var(--accent); }
    .jid-box { display: block; margin-top: 8px; padding: 10px 12px; font-family: var(--mono); font-size: 11px; word-break: break-all; color: var(--muted);
      background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-sm); }
  </style>
</head>
<body>
  <div class="unified-root" id="unifiedRoot">
    <header class="unified-header">
      <div class="header-left">
        <span class="logo"><span class="logo-mark" aria-hidden="true"></span>BioClaw</span>
        <nav class="tab-bar" role="tablist" aria-label="Main">
          <button type="button" role="tab" id="tabTraceBtn" aria-selected="false"></button>
          <button type="button" role="tab" id="tabChatBtn" aria-selected="true"></button>
        </nav>
      </div>
      <div class="header-actions">
        <div class="pill" id="connPill" title=""><span class="dot" id="connDot"></span><span id="connLabel"></span></div>
        <div class="pill trace-pill" id="traceConnPill" title=""><span class="dot" id="traceConnDot"></span><span id="traceConnLabel"></span></div>
        <button type="button" class="icon-btn" id="openSettings" aria-label=""><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg></button>
      </div>
    </header>
    <div class="unified-body">
      <div class="unified-layout" id="unifiedLayout">
        <section id="panelTrace" class="panel panel-trace hidden-narrow" role="tabpanel" aria-labelledby="tabTraceBtn">
          <div class="trace-toolbar">
            <p class="trace-desc" id="traceSub"></p>
            <div class="trace-actions">
              <label class="fld"><span id="i18n-group-label"></span> <select id="group"><option value="" id="opt-all"></option></select></label>
              <label class="trace-opt" for="traceShowStream"><input type="checkbox" id="traceShowStream" /><span id="traceStreamLabel"></span></label>
              <button type="button" class="btn-trace" id="reloadTrace"></button>
            </div>
          </div>
          <div class="trace-main">
            <div id="timeline" class="timeline"></div>
            <aside class="trace-sidebar">
              <strong class="sidebar-title" id="i18n-sidebar-title"></strong>
              <p class="sidebar-hint" id="i18n-sidebar-hint"></p>
              <div id="tree" class="tree"></div>
            </aside>
          </div>
        </section>
        <section id="panelChat" class="panel panel-chat" role="tabpanel" aria-labelledby="tabChatBtn">
          <div class="chat-hero"><h1 id="chatTitle"></h1><p class="subtitle" id="chatHint"></p></div>
          <div id="messages" class="chat-scroll" aria-live="polite"></div>
          <div class="composer-card">
            <form id="composer">
              <textarea id="text" rows="4"></textarea>
              <div class="row">
                <div class="hint" id="uploadHint"></div>
                <div class="toolbar">
                  <label class="upload"><span id="uploadLabel"></span><input id="file" type="file"></label>
                  <span id="filename" class="filename"></span>
                  <button class="primary" id="send" type="submit"></button>
                </div>
              </div>
              <div id="status" class="status"></div>
            </form>
          </div>
        </section>
      </div>
    </div>
  </div>
  <div class="drawer-backdrop" id="settingsBackdrop" aria-hidden="true"></div>
  <aside class="drawer" id="settingsDrawer" aria-hidden="true" aria-labelledby="settingsHeading">
    <div class="drawer-head">
      <h2 id="settingsHeading"></h2>
      <button type="button" class="icon-btn" id="closeSettings" aria-label=""><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
    </div>
    <div class="drawer-body">
      <div class="drawer-section">
        <h3 id="secDisplay"></h3>
        <div class="setting-row"><span class="setting-label" id="lblLang"></span><button type="button" class="btn-setting" id="langBtn"></button></div>
        <div class="setting-row"><span class="setting-label" id="lblTheme"></span><button type="button" class="btn-setting" id="themeBtn"></button></div>
      </div>
      <div class="drawer-section">
        <h3 id="secConnection"></h3>
        <div class="setting-row"><span class="setting-label" id="lblConn"></span><span class="setting-value" id="settingsConnValue"></span></div>
        <div class="setting-row" style="flex-direction:column;align-items:stretch;gap:8px">
          <span class="setting-label" id="lblTraceConn"></span>
          <span class="setting-value" id="settingsTraceConnValue"></span>
        </div>
        <div class="setting-row" style="flex-direction:column;align-items:stretch;gap:8px">
          <span class="setting-label" id="lblSession"></span>
          <code class="jid-box">${escapeHtml(chatJid)}</code>
        </div>
      </div>
    </div>
  </aside>
  <script src="${WEB_VENDOR_MARKED_PATH}"></script>
  <script src="${WEB_VENDOR_PURIFY_PATH}"></script>
  <script>
    const chatJid = ${cj};
    const assistantName = ${aj};
    const AUTH_TOKEN = ${tokenJs};
    const STREAM_QS = ${JSON.stringify(streamQs)};
    const LANG_KEY = 'bioclaw-web-lang';

    const unifiedRoot = document.getElementById('unifiedRoot');
    const tabTraceBtn = document.getElementById('tabTraceBtn');
    const tabChatBtn = document.getElementById('tabChatBtn');
    const panelTrace = document.getElementById('panelTrace');
    const panelChat = document.getElementById('panelChat');
    const messagesEl = document.getElementById('messages');
    const form = document.getElementById('composer');
    const input = document.getElementById('text');
    const fileInput = document.getElementById('file');
    const fileNameEl = document.getElementById('filename');
    const sendBtn = document.getElementById('send');
    const statusEl = document.getElementById('status');
    const connDot = document.getElementById('connDot');
    const connLabel = document.getElementById('connLabel');
    const connPill = document.getElementById('connPill');
    const traceConnDot = document.getElementById('traceConnDot');
    const traceConnLabel = document.getElementById('traceConnLabel');
    const traceConnPill = document.getElementById('traceConnPill');
    const themeBtn = document.getElementById('themeBtn');
    const langBtn = document.getElementById('langBtn');
    const settingsBackdrop = document.getElementById('settingsBackdrop');
    const settingsDrawer = document.getElementById('settingsDrawer');
    const openSettingsBtn = document.getElementById('openSettings');
    const closeSettingsBtn = document.getElementById('closeSettings');
    const settingsConnValue = document.getElementById('settingsConnValue');
    const settingsTraceConnValue = document.getElementById('settingsTraceConnValue');

    const timeline = document.getElementById('timeline');
    const groupSel = document.getElementById('group');
    const treeEl = document.getElementById('tree');
    const traceStreamCb = document.getElementById('traceShowStream');

    var traceShowStream = false;
    try { traceShowStream = localStorage.getItem('bioclaw-trace-stream') === '1'; } catch (e) {}

    let lastSignature = '';
    let pollTimer = null;
    let chatEs = null;
    let lastConnMode = null;
    let traceEs = null;
    let traceBooted = false;
    var lang = 'zh';
    var currentTab = 'chat';

    var I18N = {
      zh: {
        pageTitle: 'BioClaw',
        tabChat: '对话',
        tabTrace: '实验追踪',
        connPillTitle: '新消息',
        connConnecting: '连接中…',
        tracePillTitle: '实验追踪',
        traceIdle: '未连接',
        settingsTitle: '设置',
        settingsAria: '打开设置',
        closeSettingsAria: '关闭',
        secDisplay: '显示',
        secConnection: '连接',
        lblLang: '界面语言',
        lblTheme: '外观',
        lblConn: '对话列表',
        lblTraceConn: '追踪列表',
        lblSession: '会话 ID',
        langToggle: 'English',
        themeToggle: '切换浅色 / 深色',
        chatTitle: '对话',
        chatHintTpl: 'Enter 发送 · Shift+Enter 换行 · 默认无需 @{name}',
        traceSub: '默认隐藏 Agent 流式中间片段（与左侧对话重复）；此处保留运行起止、容器、IPC 等关键事件。勾选下方可显示全部流式记录（量多，适合调试）。',
        groupLabel: '群组',
        allGroups: '全部',
        reloadTrace: '刷新',
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
        placeholder: '例如：用 BioPython 读取 FASTA 并统计 GC 含量…',
        uploadHint: '上传文件会写入群组工作区，Agent 可通过路径访问。',
        uploadLabel: '上传文件',
        noFile: '未选择',
        send: '发送',
        sseLive: '实时更新',
        poll2s: '约 2 秒刷新',
        offline: '离线',
        sseWait: '连接中…',
        sseOk: '已连接',
        sseBad: '已断开',
        roleAssistant: '助手',
        roleYou: '你',
        userFallback: '用户',
        uploadedPrefix: '已上传 · ',
        openFile: '打开',
        download: '下载',
        uploading: '正在上传…',
        uploadFail: '上传失败',
        sendFail: '发送失败',
        sidebarTitle: '工作区树',
        sidebarHint: '选择上方群组后加载 groups/&lt;folder&gt;',
        treePick: '请选择群组',
        treeEmpty: '（空）',
        loadFail: '加载失败',
      },
      en: {
        pageTitle: 'BioClaw',
        tabChat: 'Chat',
        tabTrace: 'Lab trace',
        connPillTitle: 'Messages',
        connConnecting: 'Connecting…',
        tracePillTitle: 'Trace',
        traceIdle: 'Idle',
        settingsTitle: 'Settings',
        settingsAria: 'Open settings',
        closeSettingsAria: 'Close',
        secDisplay: 'Display',
        secConnection: 'Connection',
        lblLang: 'Language',
        lblTheme: 'Appearance',
        lblConn: 'Chat list',
        lblTraceConn: 'Trace feed',
        lblSession: 'Session ID',
        langToggle: '中文',
        themeToggle: 'Light / dark theme',
        chatTitle: 'Chat',
        chatHintTpl: 'Enter to send · Shift+Enter for newline · @{name} optional by default',
        traceSub: 'By default, agent stream chunks are hidden (they overlap the chat). This column shows run start/end, container, IPC, etc. Enable below to include every stream event (noisy, for debugging).',
        groupLabel: 'Group',
        allGroups: 'All',
        reloadTrace: 'Refresh',
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
        placeholder: 'e.g. Read a FASTA with BioPython and report GC content…',
        uploadHint: 'Uploads go to the group workspace; the agent can read them by path.',
        uploadLabel: 'Upload file',
        noFile: 'No file chosen',
        send: 'Send',
        sseLive: 'Live',
        poll2s: '~2s refresh',
        offline: 'Offline',
        sseWait: 'Connecting…',
        sseOk: 'Connected',
        sseBad: 'Disconnected',
        roleAssistant: 'Assistant',
        roleYou: 'You',
        userFallback: 'User',
        uploadedPrefix: 'Uploaded · ',
        openFile: 'Open',
        download: 'Download',
        uploading: 'Uploading…',
        uploadFail: 'Upload failed',
        sendFail: 'Send failed',
        sidebarTitle: 'Workspace tree',
        sidebarHint: 'Pick a group above to load groups/&lt;folder&gt;',
        treePick: 'Select a group',
        treeEmpty: '(empty)',
        loadFail: 'Load failed',
      },
    };

    function T() { return I18N[lang]; }

    function applyLang(next) {
      lang = next === 'en' ? 'en' : 'zh';
      try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
      var t = T();
      document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
      document.title = t.pageTitle;
      tabTraceBtn.textContent = t.tabTrace;
      tabChatBtn.textContent = t.tabChat;
      connPill.title = t.connPillTitle;
      traceConnPill.title = t.tracePillTitle;
      document.getElementById('settingsHeading').textContent = t.settingsTitle;
      openSettingsBtn.setAttribute('aria-label', t.settingsAria);
      closeSettingsBtn.setAttribute('aria-label', t.closeSettingsAria);
      document.getElementById('secDisplay').textContent = t.secDisplay;
      document.getElementById('secConnection').textContent = t.secConnection;
      document.getElementById('lblLang').textContent = t.lblLang;
      document.getElementById('lblTheme').textContent = t.lblTheme;
      document.getElementById('lblConn').textContent = t.lblConn;
      document.getElementById('lblTraceConn').textContent = t.lblTraceConn;
      document.getElementById('lblSession').textContent = t.lblSession;
      langBtn.textContent = t.langToggle;
      themeBtn.textContent = t.themeToggle;
      document.getElementById('chatTitle').textContent = t.chatTitle;
      document.getElementById('chatHint').textContent = t.chatHintTpl.replace('{name}', assistantName);
      document.getElementById('traceSub').textContent = t.traceSub;
      document.getElementById('i18n-group-label').textContent = t.groupLabel;
      document.getElementById('opt-all').textContent = t.allGroups;
      document.getElementById('reloadTrace').textContent = t.reloadTrace;
      document.getElementById('traceStreamLabel').textContent = t.traceStreamLabel;
      input.placeholder = t.placeholder;
      document.getElementById('uploadHint').textContent = t.uploadHint;
      document.getElementById('uploadLabel').textContent = t.uploadLabel;
      sendBtn.textContent = t.send;
      document.getElementById('i18n-sidebar-title').textContent = t.sidebarTitle;
      document.getElementById('i18n-sidebar-hint').innerHTML = t.sidebarHint;
      var hasFile = fileInput.files && fileInput.files[0];
      fileNameEl.textContent = hasFile ? fileInput.files[0].name : t.noFile;
      if (!groupSel.value) treeEl.textContent = t.treePick;
      if (lastConnMode === null) {
        connDot.classList.remove('live', 'poll');
        connLabel.textContent = t.connConnecting;
        settingsConnValue.textContent = t.connConnecting;
      } else setChatConn(lastConnMode);
      syncTracePillText();
    }

    function syncTracePillText() {
      if (traceEs) return;
      var t = T();
      traceConnLabel.textContent = t.traceIdle;
      settingsTraceConnValue.textContent = t.traceIdle;
    }

    (function initLang() {
      var saved = null;
      try {
        saved = localStorage.getItem(LANG_KEY) || localStorage.getItem('bioclaw-local-web-lang') || localStorage.getItem('bioclaw-dashboard-lang');
      } catch (e) {}
      applyLang(saved === 'en' ? 'en' : 'zh');
    })();

    function setChatConn(mode) {
      lastConnMode = mode;
      var t = T();
      connDot.classList.remove('live', 'poll');
      var label = t.offline;
      if (mode === 'sse') { connDot.classList.add('live'); label = t.sseLive; }
      else if (mode === 'poll') { connDot.classList.add('poll'); label = t.poll2s; }
      connLabel.textContent = label;
      settingsConnValue.textContent = label;
    }

    function stopTraceSse() {
      if (traceEs) { traceEs.close(); traceEs = null; }
      traceConnDot.classList.remove('live');
      traceConnPill.classList.remove('ok', 'bad');
      var t = T();
      traceConnLabel.textContent = t.traceIdle;
      settingsTraceConnValue.textContent = traceConnLabel.textContent;
    }

    function startTraceSse() {
      if (traceEs) return;
      var t = T();
      traceConnLabel.textContent = t.sseWait;
      settingsTraceConnValue.textContent = t.sseWait;
      traceConnPill.classList.remove('ok', 'bad');
      var url = '/api/trace/stream' + STREAM_QS;
      traceEs = new EventSource(url);
      traceEs.onopen = function () {
        traceConnLabel.textContent = T().sseOk;
        settingsTraceConnValue.textContent = traceConnLabel.textContent;
        traceConnDot.classList.add('live');
        traceConnPill.classList.add('ok');
        traceConnPill.classList.remove('bad');
      };
      traceEs.onmessage = function () { loadTrace(); loadTree(); };
      traceEs.onerror = function () {
        traceConnLabel.textContent = T().sseBad;
        settingsTraceConnValue.textContent = traceConnLabel.textContent;
        traceConnDot.classList.remove('live');
        traceConnPill.classList.add('bad');
        traceConnPill.classList.remove('ok');
      };
    }

    function authHeaders() {
      var h = {};
      if (AUTH_TOKEN) h['Authorization'] = 'Bearer ' + AUTH_TOKEN;
      return h;
    }

    function esc(s) {
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    (function setupMarkdownSanitize() {
      if (typeof DOMPurify !== 'undefined' && !globalThis.__bioclawDpHook) {
        globalThis.__bioclawDpHook = true;
        DOMPurify.addHook('afterSanitizeAttributes', function (node) {
          if (node.tagName === 'A' && node.hasAttribute('href')) {
            node.setAttribute('target', '_blank');
            node.setAttribute('rel', 'noreferrer noopener');
          }
        });
      }
    })();

    function linkifyBareFilePaths(t) {
      return String(t).replace(/(^|\\s|[>\\u00a0])(\\/files\\/[\\w./%-]+)/g, function (_, sep, p) {
        return sep + '[' + p + '](' + p + ')';
      });
    }

    function markdownToSafeHtml(raw) {
      if (typeof marked === 'undefined' || typeof marked.parse !== 'function' || typeof DOMPurify === 'undefined') {
        return esc(raw).replace(/(\\/files\\/[\\w./%-]+)/g, '<a href="$1" target="_blank" rel="noreferrer">$1</a>').replace(/\\n/g, '<br>');
      }
      try {
        if (typeof marked.setOptions === 'function') marked.setOptions({ gfm: true, breaks: true });
        var linked = linkifyBareFilePaths(raw);
        var html = marked.parse(linked, { async: false });
        return DOMPurify.sanitize(html, {
          ALLOWED_TAGS: ['p','br','strong','em','b','i','code','pre','ul','ol','li','h1','h2','h3','h4','h5','h6','blockquote','a','hr','del','ins','sub','sup','table','thead','tbody','tr','th','td','img'],
          ALLOWED_ATTR: ['href','title','class','colspan','rowspan','align','src','alt','width','height','loading'],
          ALLOW_DATA_ATTR: false,
        });
      } catch (e2) {
        return esc(raw).replace(/\\n/g, '<br>');
      }
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
      var head = '<header><div class="evt-headline"><span class="tpill">' + esc(r.group_folder) + '</span><span class="type">' + esc(title) + '</span></div>' +
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
      while (groupSel.options.length > 1) groupSel.remove(1);
      (data.folders || []).forEach(function (f) {
        var o = document.createElement('option');
        o.value = f; o.textContent = f;
        groupSel.appendChild(o);
      });
      if (prev && Array.prototype.some.call(groupSel.options, function (o) { return o.value === prev; })) groupSel.value = prev;
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

    function ensureTrace() {
      if (traceBooted) { startTraceSse(); return; }
      traceBooted = true;
      loadGroups().then(function () {
        loadTrace();
        loadTree();
        startTraceSse();
      });
    }

    function isWide() { return window.matchMedia('(min-width: 1100px)').matches; }

    function applyLayout() {
      var wide = isWide();
      unifiedRoot.classList.toggle('unified-wide', wide);
      if (wide) {
        panelChat.classList.remove('hidden-narrow');
        panelTrace.classList.remove('hidden-narrow');
        ensureTrace();
      } else {
        if (currentTab === 'chat') {
          panelChat.classList.remove('hidden-narrow');
          panelTrace.classList.add('hidden-narrow');
          stopTraceSse();
        } else {
          panelChat.classList.add('hidden-narrow');
          panelTrace.classList.remove('hidden-narrow');
          ensureTrace();
        }
        tabTraceBtn.setAttribute('aria-selected', currentTab === 'trace' ? 'true' : 'false');
        tabChatBtn.setAttribute('aria-selected', currentTab === 'chat' ? 'true' : 'false');
      }
    }

    function setTab(tab) {
      currentTab = tab;
      var u = new URL(window.location.href);
      u.searchParams.set('tab', tab === 'trace' ? 'trace' : 'chat');
      window.history.replaceState({}, '', u.pathname + u.search);
      applyLayout();
    }

    tabTraceBtn.addEventListener('click', function () { setTab('trace'); });
    tabChatBtn.addEventListener('click', function () { setTab('chat'); });
    window.matchMedia('(min-width: 1100px)').addEventListener('change', applyLayout);

    (function bootTabFromUrl() {
      var p = new URLSearchParams(window.location.search);
      if (p.get('tab') === 'trace') currentTab = 'trace';
      applyLayout();
    })();

    document.getElementById('reloadTrace').onclick = function () { loadTrace(); loadTree(); };
    groupSel.onchange = function () { loadTrace(); loadTree(); };
    if (traceStreamCb) {
      traceStreamCb.checked = traceShowStream;
      traceStreamCb.addEventListener('change', function () {
        traceShowStream = !!traceStreamCb.checked;
        try { localStorage.setItem('bioclaw-trace-stream', traceShowStream ? '1' : '0'); } catch (e) {}
        loadTrace();
      });
    }

    langBtn.addEventListener('click', function () {
      applyLang(lang === 'zh' ? 'en' : 'zh');
      lastSignature = '';
      refreshMessages();
    });

    function loadTheme() {
      var th = localStorage.getItem('bioclaw-theme');
      if (th === 'light') document.documentElement.setAttribute('data-theme', 'light');
      else document.documentElement.removeAttribute('data-theme');
    }
    loadTheme();
    themeBtn.addEventListener('click', function () {
      if (document.documentElement.getAttribute('data-theme') === 'light') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('bioclaw-theme', 'dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('bioclaw-theme', 'light');
      }
    });

    function setSettingsOpen(open) {
      settingsBackdrop.classList.toggle('is-open', open);
      settingsDrawer.classList.toggle('is-open', open);
      settingsBackdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
      settingsDrawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    }
    openSettingsBtn.addEventListener('click', function () { setSettingsOpen(true); });
    closeSettingsBtn.addEventListener('click', function () { setSettingsOpen(false); });
    settingsBackdrop.addEventListener('click', function () { setSettingsOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && settingsDrawer.classList.contains('is-open')) setSettingsOpen(false);
    });

    function render(messages) {
      var signature = JSON.stringify(messages.map(function (m) { return [m.id, m.timestamp, m.content]; }));
      if (signature === lastSignature) return;
      lastSignature = signature;
      var t = T();
      messagesEl.innerHTML = messages.map(function (msg) {
        var kind = msg.is_from_me ? 'bot' : 'user';
        var name = msg.is_from_me ? assistantName : (msg.sender_name || t.userFallback);
        var role = msg.is_from_me ? t.roleAssistant : t.roleYou;
        return '<article class="bubble ' + kind + '"><div class="meta"><span class="badge">' + esc(role) + '</span>' +
          esc(name) + ' · ' + esc(msg.timestamp) + '</div><div class="content">' + renderBody(msg.content) + '</div></article>';
      }).join('');
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function renderBody(text) {
      var upload = parseUploadMessage(text);
      if (upload) return renderUploadCard(upload);
      return markdownToSafeHtml(String(text));
    }

    function parseUploadMessage(text) {
      var lines = String(text).split('\\n');
      var fileLine = lines.find(function (line) { return line.startsWith('Uploaded file: '); });
      var workspaceLine = lines.find(function (line) { return line.startsWith('Workspace path: '); });
      var previewLine = lines.find(function (line) { return line.startsWith('Preview URL: '); });
      if (!fileLine || !workspaceLine || !previewLine) return null;
      return {
        filename: fileLine.slice('Uploaded file: '.length),
        workspacePath: workspaceLine.slice('Workspace path: '.length),
        previewUrl: previewLine.slice('Preview URL: '.length),
      };
    }

    function renderUploadCard(file) {
      var t = T();
      var escapedName = esc(file.filename);
      var escapedPath = esc(file.workspacePath);
      var escapedPreview = esc(file.previewUrl);
      var isImage = /\\.(png|jpe?g|gif|webp|svg)$/i.test(file.filename);
      var preview = isImage ? '<img class="preview" src="' + escapedPreview + '" alt="' + escapedName + '">' : '';
      return '<section class="file-card"><div class="file-title">' + esc(t.uploadedPrefix) + escapedName + '</div><div class="file-path">' + escapedPath + '</div>' + preview +
        '<div class="file-actions"><a class="file-button" href="' + escapedPreview + '" target="_blank" rel="noreferrer">' + esc(t.openFile) + '</a>' +
        '<a class="file-button" href="' + escapedPreview + '" download>' + esc(t.download) + '</a></div></section>';
    }

    async function refreshMessages() {
      try {
        var res = await fetch('/api/messages?chatJid=' + encodeURIComponent(chatJid));
        if (!res.ok) return;
        var data = await res.json();
        render(data.messages || []);
      } catch (e) {}
    }

    function startPolling() {
      if (pollTimer) return;
      setChatConn('poll');
      pollTimer = setInterval(refreshMessages, 2000);
    }
    function stopPolling() {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    }

    function connectChatSse() {
      try {
        chatEs = new EventSource('/api/events?chatJid=' + encodeURIComponent(chatJid));
        chatEs.onopen = function () { setChatConn('sse'); stopPolling(); };
        chatEs.onmessage = function () { refreshMessages(); };
        chatEs.onerror = function () {
          if (chatEs) { chatEs.close(); chatEs = null; }
          setChatConn('poll');
          startPolling();
        };
      } catch (e) { startPolling(); }
    }

    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      fileNameEl.textContent = file ? file.name : T().noFile;
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
    });

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      var text = input.value.trim();
      var file = fileInput.files && fileInput.files[0];
      if (!text && !file) return;
      sendBtn.disabled = true;
      try {
        if (file) {
          setStatus(T().uploading);
          var upRes = await fetch('/api/upload?chatJid=' + encodeURIComponent(chatJid), {
            method: 'POST',
            headers: { 'x-file-name': encodeURIComponent(file.name), 'content-type': file.type || 'application/octet-stream' },
            body: file,
          });
          if (!upRes.ok) throw new Error('UPLOAD_FAIL');
          fileInput.value = '';
          fileNameEl.textContent = T().noFile;
        }
        if (text) {
          var res2 = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatJid: chatJid, text: text }),
          });
          if (!res2.ok) throw new Error('SEND_FAIL');
          input.value = '';
        }
        setStatus('');
        await refreshMessages();
      } catch (e) {
        var msg = e && e.message;
        if (msg === 'UPLOAD_FAIL') setStatus(T().uploadFail);
        else if (msg === 'SEND_FAIL') setStatus(T().sendFail);
        else setStatus(String(msg || ''));
      } finally {
        sendBtn.disabled = false;
      }
    });

    function setStatus(text) { statusEl.textContent = text || ''; }

    refreshMessages();
    connectChatSse();
  </script>
</body>
</html>`;
}
