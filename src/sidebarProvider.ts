// src/sidebarProvider.ts
// Builds the sidebar UI. Language icons are now real official logos
// loaded from the Devicon CDN instead of emojis.

import * as vscode from "vscode";
import { LANGUAGES }  from "./languages";
import { detectOS }   from "./installer";

export class LangSetupSidebarProvider implements vscode.WebviewViewProvider {

  public static readonly viewId = "langsetup.sidebarView";
  private _view?: vscode.WebviewView;
  private _messageHandler?: (msg: any) => void;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      // Allow loading images from the Devicon CDN
      localResourceRoots: [],
    };
    webviewView.webview.html = this._buildHtml();
    if (this._messageHandler) {
      webviewView.webview.onDidReceiveMessage(this._messageHandler);
    }
  }

  public onMessage(handler: (msg: any) => void) {
    this._messageHandler = handler;
    if (this._view) {
      this._view.webview.onDidReceiveMessage(handler);
    }
  }

  public sendProgress(step: string, detail: string, done: boolean, error?: string) {
    this._view?.webview.postMessage({ type: "progress", step, detail, done, error });
  }

  private _buildHtml(): string {
    const detectedOS = detectOS();

    const langsJson = JSON.stringify(
      LANGUAGES.map((l) => ({
        id:          l.id,
        name:        l.name,
        icon:        l.icon,          // now a CDN image URL
        description: l.description,
        extCount:    l.vsExtensions.length,
        hasDownload: !!(l.resolveDownload),
        extraNote:   l.extraNote ?? null,
      }))
    );

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'none';
           img-src https://cdn.jsdelivr.net data:;
           style-src 'unsafe-inline';
           script-src 'unsafe-inline';"
/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>LangSetup</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: var(--vscode-font-family, 'Segoe UI', sans-serif);
    font-size: 13px;
    color: var(--vscode-foreground);
    background: transparent;
    padding-bottom: 30px;
  }

  /* ── Header ── */
  .header {
    padding: 12px 12px 10px;
    border-bottom: 1px solid var(--vscode-panel-border, #333);
    display: flex; align-items: center; gap: 9px;
  }
  .logo {
    width: 30px; height: 30px;
    background: linear-gradient(135deg, #4f8ef7, #7c3aed);
    border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
  }
  .header-text .title { font-size: 13px; font-weight: 700; }
  .header-text .sub   { font-size: 10px; color: var(--vscode-descriptionForeground); margin-top: 1px; }

  /* ── Section label ── */
  .section { padding: 10px 10px 6px; }
  .label {
    font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.07em;
    color: var(--vscode-descriptionForeground); margin-bottom: 7px;
  }

  /* ── OS pills ── */
  .os-row { display: flex; gap: 5px; }
  .os-pill {
    flex: 1;
    border: 1.5px solid var(--vscode-input-border, #555);
    background: var(--vscode-input-background, #1e1e1e);
    border-radius: 6px; padding: 7px 4px;
    cursor: pointer; text-align: center; font-size: 11px;
    color: var(--vscode-foreground); transition: border-color 0.12s;
  }
  .os-pill:hover  { border-color: #4f8ef7; }
  .os-pill.active { border-color: #4f8ef7; background: rgba(79,142,247,0.15); color: #4f8ef7; font-weight: 600; }
  .os-pill span   { font-size: 17px; display: block; margin-bottom: 3px; }

  hr { border: none; border-top: 1px solid var(--vscode-panel-border, #333); margin: 2px 0; }

  /* ── Language list ── */
  .lang-list { display: flex; flex-direction: column; gap: 4px; padding: 0 10px; }

  .lang-item {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 9px;
    border: 1.5px solid var(--vscode-input-border, #555);
    background: var(--vscode-input-background, #1e1e1e);
    border-radius: 7px; cursor: pointer; user-select: none;
    transition: border-color 0.12s, background 0.12s;
  }
  .lang-item:hover    { border-color: #5080b0; background: rgba(255,255,255,0.03); }
  .lang-item.selected { border-color: #4f8ef7; background: rgba(79,142,247,0.12); }

  /* Language logo image */
  .lang-logo {
    width: 26px; height: 26px;
    object-fit: contain;
    flex-shrink: 0;
    border-radius: 3px;
    /* fallback background if image fails to load */
    background: rgba(255,255,255,0.05);
  }

  /* Fallback letter shown while image loads or if it fails */
  .lang-logo-wrap {
    width: 26px; height: 26px; flex-shrink: 0;
    position: relative; display: flex;
    align-items: center; justify-content: center;
  }
  .lang-logo-fallback {
    position: absolute;
    font-size: 16px; font-weight: 700;
    color: var(--vscode-descriptionForeground);
    pointer-events: none;
  }
  .lang-logo-wrap img {
    width: 26px; height: 26px;
    object-fit: contain;
    border-radius: 3px;
    position: relative; z-index: 1;
  }

  .lang-body  { flex: 1; min-width: 0; }
  .lang-name  { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .lang-desc  { font-size: 10px; color: var(--vscode-descriptionForeground); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .lang-tags  { display: flex; gap: 4px; margin-top: 4px; }
  .tag { font-size: 9px; font-weight: 600; padding: 1px 5px; border-radius: 3px; text-transform: uppercase; }
  .tag-ext  { background: rgba(79,142,247,0.2); color: #60a5fa; }
  .tag-tool { background: rgba(74,222,128,0.15); color: #4ade80; }

  .checkmark {
    width: 18px; height: 18px; background: #4f8ef7; border-radius: 50%;
    display: none; align-items: center; justify-content: center;
    font-size: 10px; color: #fff; font-weight: 800; flex-shrink: 0;
  }
  .lang-item.selected .checkmark { display: flex; }

  /* ── Action bar ── */
  .action-bar { padding: 8px 10px; display: flex; align-items: center; gap: 8px; }
  .sel-info { font-size: 11px; color: var(--vscode-descriptionForeground); flex: 1; }
  .sel-info strong { color: #4f8ef7; }
  .clear-btn {
    font-size: 10px; padding: 3px 8px; background: none;
    border: 1px solid var(--vscode-input-border, #555);
    border-radius: 4px; color: var(--vscode-descriptionForeground);
    cursor: pointer; transition: all 0.12s;
  }
  .clear-btn:hover { border-color: #f87171; color: #f87171; }

  /* ── Confirm box ── */
  .confirm-box {
    display: none; margin: 0 10px 10px; padding: 12px;
    background: var(--vscode-editor-background, #1e1e1e);
    border: 1.5px solid #4f8ef7; border-radius: 8px;
    animation: popIn 0.15s ease;
  }
  .confirm-box.show { display: block; }
  .confirm-box h3 { font-size: 12px; font-weight: 700; margin-bottom: 6px; }
  .confirm-box p  { font-size: 11px; color: var(--vscode-descriptionForeground); line-height: 1.5; margin-bottom: 10px; }
  .confirm-lang-list { margin-bottom: 12px; display: flex; flex-direction: column; gap: 3px; }
  .confirm-row {
    display: flex; align-items: center; gap: 8px;
    font-size: 11px; padding: 5px 0;
    border-bottom: 1px solid var(--vscode-panel-border, #333);
  }
  .confirm-row:last-child { border-bottom: none; }
  .confirm-row img { width: 18px; height: 18px; object-fit: contain; }
  .confirm-actions { display: flex; gap: 6px; }
  .btn-cancel {
    flex: 1; padding: 7px; background: none;
    border: 1px solid var(--vscode-input-border, #555);
    border-radius: 5px; color: var(--vscode-foreground); font-size: 12px; cursor: pointer;
  }
  .btn-cancel:hover { border-color: #888; }
  .btn-install {
    flex: 2; padding: 7px; background: #4f8ef7; border: none;
    border-radius: 5px; color: #fff; font-size: 12px; font-weight: 700; cursor: pointer;
  }
  .btn-install:hover { background: #3b7be0; }

  /* ── Log panel ── */
  .log-panel { display: none; margin: 0 10px 10px; border: 1px solid var(--vscode-panel-border, #333); border-radius: 7px; overflow: hidden; }
  .log-panel.show { display: block; }
  .log-head { background: var(--vscode-sideBarSectionHeader-background, #252526); padding: 5px 9px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--vscode-descriptionForeground); }
  .log-body {
    max-height: 220px; overflow-y: auto; padding: 6px 8px;
    background: var(--vscode-input-background, #1e1e1e);
    display: flex; flex-direction: column; gap: 3px;
    font-family: 'Consolas', 'Courier New', monospace; font-size: 11px;
  }
  .log-body::-webkit-scrollbar { width: 4px; }
  .log-body::-webkit-scrollbar-thumb { background: #555; border-radius: 2px; }
  .log-row { animation: popIn 0.15s ease; line-height: 1.5; }
  .log-row.ok   { color: #4ade80; }
  .log-row.err  { color: #f87171; }
  .log-row.note { color: #fbbf24; }
  .log-row.info { color: var(--vscode-foreground); }
  .log-sub { color: var(--vscode-descriptionForeground); font-size: 10px; margin-left: 8px; display: block; }

  /* ── Install button ── */
  .install-wrap { padding: 0 10px 10px; }
  .install-btn {
    width: 100%; padding: 10px;
    background: linear-gradient(135deg, #4f8ef7, #3365c5);
    border: none; border-radius: 7px; color: #fff;
    font-size: 13px; font-weight: 700; cursor: pointer; transition: filter 0.12s;
  }
  .install-btn:hover:not(:disabled) { filter: brightness(1.1); }
  .install-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .install-btn.busy { background: #1e3a6e; animation: pulse 1.4s infinite; }

  /* ── Done banner ── */
  .done-banner {
    display: none; margin: 0 10px 10px; padding: 14px 10px;
    background: rgba(74,222,128,0.07);
    border: 1px solid rgba(74,222,128,0.4);
    border-radius: 8px; text-align: center; animation: popIn 0.2s ease;
  }
  .done-banner.show { display: block; }
  .done-banner .big { font-size: 30px; margin-bottom: 6px; }
  .done-banner h3   { font-size: 13px; font-weight: 700; color: #4ade80; }
  .done-banner p    { font-size: 10px; color: var(--vscode-descriptionForeground); margin-top: 4px; line-height: 1.5; }

  @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.65} }
  @keyframes popIn  { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }
</style>
</head>
<body>

<!-- Header -->
<div class="header">
  <div class="logo">📦</div>
  <div class="header-text">
    <div class="title">LangSetup</div>
    <div class="sub">One-click language installer</div>
  </div>
</div>

<!-- OS Selection -->
<div class="section">
  <div class="label">Step 1 — Your Operating System</div>
  <div class="os-row">
    <div class="os-pill" data-os="windows" onclick="setOS('windows')"><span>🪟</span>Windows</div>
    <div class="os-pill" data-os="mac"     onclick="setOS('mac')"><span>🍎</span>macOS</div>
    <div class="os-pill" data-os="linux"   onclick="setOS('linux')"><span>🐧</span>Linux</div>
  </div>
</div>

<hr/>

<!-- Language Selection -->
<div class="section">
  <div class="label">Step 2 — Select Languages</div>
</div>
<div class="lang-list" id="langList"></div>

<!-- Action bar -->
<div class="action-bar">
  <div class="sel-info"><strong id="selCount">0</strong> selected</div>
  <button class="clear-btn" onclick="clearAll()">Clear all</button>
</div>

<!-- Confirm box -->
<div class="confirm-box" id="confirmBox">
  <h3>🚀 Ready to Install?</h3>
  <p>LangSetup will install VS Code extensions and download the latest official setup files for:</p>
  <div class="confirm-lang-list" id="confirmList"></div>
  <div class="confirm-actions">
    <button class="btn-cancel"  onclick="hideConfirm()">Cancel</button>
    <button class="btn-install" onclick="startInstall()">Download &amp; Install</button>
  </div>
</div>

<!-- Install log -->
<div class="log-panel" id="logPanel">
  <div class="log-head">📋 Install Log</div>
  <div class="log-body" id="logBody"></div>
</div>

<!-- Done banner -->
<div class="done-banner" id="doneBanner">
  <div class="big">🎉</div>
  <h3>All Done!</h3>
  <p>Finish any setup wizards that opened.<br/>Then <strong>restart VS Code</strong> and start coding!</p>
</div>

<!-- Install button -->
<div class="install-wrap">
  <button class="install-btn" id="installBtn" onclick="showConfirm()" disabled>
    ⬇ Install Selected Languages
  </button>
</div>

<script>
const vscode = acquireVsCodeApi();
const LANGS  = ${langsJson};
let currentOS = '${detectedOS}';
let selected  = new Set();
let busy      = false;

// ── Build language cards with real logo images ──────────────────

function init() {
  setOS(currentOS);
  const list = document.getElementById('langList');

  LANGS.forEach(l => {
    const el = document.createElement('div');
    el.className = 'lang-item';
    el.dataset.id = l.id;
    el.onclick = () => toggle(l.id);

    // First letter as fallback shown behind the image
    const fallbackLetter = l.name.charAt(0).toUpperCase();

    el.innerHTML =
      // Logo image with fallback letter underneath
      '<div class="lang-logo-wrap">' +
        '<span class="lang-logo-fallback">' + fallbackLetter + '</span>' +
        '<img src="' + l.icon + '" alt="' + esc(l.name) + ' logo" ' +
          'onerror="this.style.display=\'none\'" ' +
          'crossorigin="anonymous"/>' +
      '</div>' +
      // Text content
      '<div class="lang-body">' +
        '<div class="lang-name">' + esc(l.name) + '</div>' +
        '<div class="lang-desc">' + esc(l.description) + '</div>' +
        '<div class="lang-tags">' +
          '<span class="tag tag-ext">' + l.extCount + ' ext</span>' +
          (l.hasDownload ? '<span class="tag tag-tool">+ installer</span>' : '') +
        '</div>' +
      '</div>' +
      '<div class="checkmark">✓</div>';

    list.appendChild(el);
  });
}

// ── OS Selection ────────────────────────────────────────────────

function setOS(os) {
  currentOS = os;
  document.querySelectorAll('.os-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.os === os);
  });
}

// ── Language Toggle ─────────────────────────────────────────────

function toggle(id) {
  if (busy) { return; }
  selected.has(id) ? selected.delete(id) : selected.add(id);
  document.querySelector('[data-id="' + id + '"]').classList.toggle('selected', selected.has(id));
  updateUI();
}

function clearAll() {
  selected.clear();
  document.querySelectorAll('.lang-item').forEach(el => el.classList.remove('selected'));
  updateUI();
}

function updateUI() {
  document.getElementById('selCount').textContent = selected.size;
  document.getElementById('installBtn').disabled  = selected.size === 0 || busy;
}

// ── Confirm box ─────────────────────────────────────────────────

function showConfirm() {
  if (!selected.size || busy) { return; }
  const cl = document.getElementById('confirmList');
  cl.innerHTML = '';
  selected.forEach(id => {
    const l = LANGS.find(x => x.id === id);
    if (!l) { return; }
    const row = document.createElement('div');
    row.className = 'confirm-row';
    row.innerHTML =
      // Small logo in confirm list too
      '<img src="' + l.icon + '" alt="' + esc(l.name) + '" onerror="this.style.display=\'none\'" crossorigin="anonymous"/>' +
      '<strong>' + esc(l.name) + '</strong>' +
      '<span style="margin-left:auto;color:var(--vscode-descriptionForeground);font-size:10px">' +
        l.extCount + ' ext' + (l.hasDownload ? ' + installer' : '') +
      '</span>';
    cl.appendChild(row);
  });
  document.getElementById('confirmBox').classList.add('show');
}

function hideConfirm() {
  document.getElementById('confirmBox').classList.remove('show');
}

// ── Install ─────────────────────────────────────────────────────

function startInstall() {
  hideConfirm();
  busy = true;
  const btn = document.getElementById('installBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Installing…';
  btn.classList.add('busy');
  document.getElementById('logPanel').classList.add('show');
  vscode.postMessage({ type: 'install', os: currentOS, languages: [...selected] });
}

// ── Log ─────────────────────────────────────────────────────────

function addLog(step, detail, done, error) {
  const body = document.getElementById('logBody');
  const row  = document.createElement('div');
  let cls = 'info';
  if (error)                                          { cls = 'err';  }
  else if (step.startsWith('✅') || step.startsWith('🎉')) { cls = 'ok';   }
  else if (step.startsWith('📌'))                     { cls = 'note'; }
  row.className = 'log-row ' + cls;
  row.innerHTML = esc(step) + (detail ? '<span class="log-sub">' + esc(detail) + '</span>' : '');
  body.appendChild(row);
  body.scrollTop = body.scrollHeight;
}

// ── Messages from extension.ts ───────────────────────────────────

window.addEventListener('message', e => {
  const m = e.data;
  if (m.type === 'progress') {
    addLog(m.step, m.detail || '', m.done, !!m.error);
    if (m.done && m.step.includes('All done')) {
      busy = false;
      document.getElementById('doneBanner').classList.add('show');
      const btn = document.getElementById('installBtn');
      btn.textContent = '✅ Installation Complete!';
      btn.classList.remove('busy');
    }
  }
});

function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

init();
</script>
</body>
</html>`;
  }
}
