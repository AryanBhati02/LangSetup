import * as vscode from "vscode";
import { LANGUAGES } from "./languages";
import { detectOS } from "./installer";
import { getHistory, getStats, clearHistory } from "./history";

export class LangSetupSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = "langsetup.sidebarView";

  private _view?: vscode.WebviewView;
  private _messageHandler?: (msg: any) => void;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext,
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _ctx: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this._buildHtml();

    webviewView.webview.onDidReceiveMessage((msg: any) => {
      if (msg.type === "clearHistory") {
        clearHistory(this._context);

        const h = getHistory(this._context);
        const s = getStats(this._context);
        webviewView.webview.postMessage({
          type: "historyData",
          history: h,
          stats: s,
        });
        return;
      }
      if (msg.type === "getHistory") {
        const h = getHistory(this._context);
        const s = getStats(this._context);
        webviewView.webview.postMessage({
          type: "historyData",
          history: h,
          stats: s,
        });
        return;
      }

      if (this._messageHandler) {
        this._messageHandler(msg);
      }
    });
  }

  public onMessage(handler: (msg: any) => void): void {
    this._messageHandler = handler;
  }

  public sendProgress(
    step: string,
    detail: string,
    done: boolean,
    error?: string,
  ): void {
    this._view?.webview.postMessage({
      type: "progress",
      step,
      detail,
      done,
      error,
    });
  }

  public refreshHistory(): void {
    if (!this._view) {
      return;
    }
    const h = getHistory(this._context);
    const s = getStats(this._context);
    this._view.webview.postMessage({
      type: "historyData",
      history: h,
      stats: s,
    });
  }

  private _buildHtml(): string {
    const detectedOS = detectOS();
    const langsJson = JSON.stringify(
      LANGUAGES.map((l) => ({
        id: l.id,
        name: l.name,
        icon: l.icon,
        description: l.description,
        extCount: l.vsExtensions.length,
        hasDownload: !!l.resolveDownload,
      })),
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta http-equiv="Content-Security-Policy"
  content="default-src 'none';
           img-src https: data: vscode-resource: vscode-webview-resource:;
           style-src 'unsafe-inline' vscode-resource: vscode-webview-resource:;
           script-src 'unsafe-inline' vscode-resource: vscode-webview-resource:;"/>
<title>LangSetup</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{
  font-family:var(--vscode-font-family,'Segoe UI',sans-serif);
  font-size:13px;
  color:var(--vscode-foreground);
  background:transparent;
  height:100vh;
  display:flex;
  flex-direction:column;
  overflow:hidden;
}


.tabs{
  display:flex;
  border-bottom:1px solid var(--vscode-panel-border,#333);
  flex-shrink:0;
}
.tab{
  flex:1;padding:9px 4px;
  text-align:center;font-size:11px;font-weight:600;
  cursor:pointer;border-bottom:2px solid transparent;
  color:var(--vscode-descriptionForeground);
  transition:all 0.12s;
}
.tab:hover{color:var(--vscode-foreground);}
.tab.active{color:#4f8ef7;border-bottom-color:#4f8ef7;}


.pane{display:none;flex:1;overflow-y:auto;flex-direction:column;}
.pane.active{display:flex;}
.pane::-webkit-scrollbar{width:4px;}
.pane::-webkit-scrollbar-thumb{background:var(--vscode-input-border,#555);border-radius:2px;}


.header{
  padding:11px 12px 9px;
  border-bottom:1px solid var(--vscode-panel-border,#333);
  display:flex;align-items:center;gap:9px;flex-shrink:0;
}
.logo{
  width:28px;height:28px;
  background:linear-gradient(135deg,#4f8ef7,#7c3aed);
  border-radius:6px;display:flex;align-items:center;justify-content:center;
  font-size:15px;flex-shrink:0;
}
.header-text .title{font-size:13px;font-weight:700;}
.header-text .sub{font-size:10px;color:var(--vscode-descriptionForeground);margin-top:1px;}


.section{padding:9px 10px 5px;flex-shrink:0;}
.label{
  font-size:10px;font-weight:700;text-transform:uppercase;
  letter-spacing:.07em;color:var(--vscode-descriptionForeground);margin-bottom:6px;
}
hr{border:none;border-top:1px solid var(--vscode-panel-border,#333);margin:2px 0;flex-shrink:0;}


.os-row{display:flex;gap:5px;}
.os-pill{
  flex:1;border:1.5px solid var(--vscode-input-border,#555);
  background:var(--vscode-input-background,#1e1e1e);
  border-radius:6px;padding:7px 4px;cursor:pointer;text-align:center;
  font-size:11px;color:var(--vscode-foreground);transition:border-color .12s;
}
.os-pill:hover{border-color:#4f8ef7;}
.os-pill.active{border-color:#4f8ef7;background:rgba(79,142,247,.15);color:#4f8ef7;font-weight:600;}
.os-pill span{font-size:16px;display:block;margin-bottom:2px;}


.lang-list{display:flex;flex-direction:column;gap:4px;padding:0 10px;}
.lang-item{
  display:flex;align-items:center;gap:10px;
  padding:7px 9px;
  border:1.5px solid var(--vscode-input-border,#555);
  background:var(--vscode-input-background,#1e1e1e);
  border-radius:7px;cursor:pointer;user-select:none;
  transition:border-color .12s,background .12s;
}
.lang-item:hover{border-color:#5080b0;}
.lang-item.selected{border-color:#4f8ef7;background:rgba(79,142,247,.12);}
.lang-logo-wrap{
  width:24px;height:24px;flex-shrink:0;position:relative;
  display:flex;align-items:center;justify-content:center;
}
.lang-logo-fallback{
  position:absolute;font-size:13px;font-weight:700;
  color:var(--vscode-descriptionForeground);
}
.lang-logo-wrap img{
  width:24px;height:24px;object-fit:contain;
  border-radius:2px;position:relative;z-index:1;
}
.lang-body{flex:1;min-width:0;}
.lang-name{font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.lang-desc{font-size:10px;color:var(--vscode-descriptionForeground);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.lang-tags{display:flex;gap:3px;margin-top:3px;}
.tag{font-size:9px;font-weight:600;padding:1px 5px;border-radius:3px;text-transform:uppercase;}
.tag-ext{background:rgba(79,142,247,.2);color:#60a5fa;}
.tag-tool{background:rgba(74,222,128,.15);color:#4ade80;}
.checkmark{
  width:17px;height:17px;background:#4f8ef7;border-radius:50%;
  display:none;align-items:center;justify-content:center;
  font-size:9px;color:#fff;font-weight:800;flex-shrink:0;
}
.lang-item.selected .checkmark{display:flex;}


.action-bar{padding:7px 10px;display:flex;align-items:center;gap:8px;flex-shrink:0;}
.sel-info{font-size:11px;color:var(--vscode-descriptionForeground);flex:1;}
.sel-info strong{color:#4f8ef7;}
.clear-btn{
  font-size:10px;padding:3px 8px;background:none;
  border:1px solid var(--vscode-input-border,#555);border-radius:4px;
  color:var(--vscode-descriptionForeground);cursor:pointer;transition:all .12s;
}
.clear-btn:hover{border-color:#f87171;color:#f87171;}


.confirm-box{
  display:none;margin:0 10px 8px;padding:11px;
  background:var(--vscode-editor-background,#1e1e1e);
  border:1.5px solid #4f8ef7;border-radius:8px;animation:popIn .15s ease;
  flex-shrink:0;
}
.confirm-box.show{display:block;}
.confirm-box h3{font-size:12px;font-weight:700;margin-bottom:5px;}
.confirm-box p{font-size:11px;color:var(--vscode-descriptionForeground);line-height:1.5;margin-bottom:9px;}
.confirm-lang-list{margin-bottom:10px;display:flex;flex-direction:column;gap:3px;}
.confirm-row{
  display:flex;align-items:center;gap:8px;font-size:11px;
  padding:4px 0;border-bottom:1px solid var(--vscode-panel-border,#333);
}
.confirm-row:last-child{border-bottom:none;}
.confirm-row img{width:16px;height:16px;object-fit:contain;}
.confirm-actions{display:flex;gap:6px;}
.btn-cancel{
  flex:1;padding:6px;background:none;
  border:1px solid var(--vscode-input-border,#555);
  border-radius:5px;color:var(--vscode-foreground);font-size:12px;cursor:pointer;
}
.btn-cancel:hover{border-color:#888;}
.btn-go{
  flex:2;padding:6px;background:#4f8ef7;border:none;
  border-radius:5px;color:#fff;font-size:12px;font-weight:700;cursor:pointer;
}
.btn-go:hover{background:#3b7be0;}


.log-panel{
  display:none;margin:0 10px 8px;
  border:1px solid var(--vscode-panel-border,#333);
  border-radius:7px;overflow:hidden;flex-shrink:0;
}
.log-panel.show{display:block;}
.log-head{
  background:var(--vscode-sideBarSectionHeader-background,#252526);
  padding:4px 9px;font-size:10px;font-weight:700;
  text-transform:uppercase;letter-spacing:.06em;
  color:var(--vscode-descriptionForeground);
}
.log-body{
  max-height:180px;overflow-y:auto;padding:5px 8px;
  background:var(--vscode-input-background,#1e1e1e);
  display:flex;flex-direction:column;gap:2px;
  font-family:'Consolas','Courier New',monospace;font-size:11px;
}
.log-body::-webkit-scrollbar{width:3px;}
.log-body::-webkit-scrollbar-thumb{background:#555;border-radius:2px;}
.log-row{animation:popIn .15s ease;line-height:1.5;}
.log-row.ok{color:#4ade80;}
.log-row.err{color:#f87171;}
.log-row.note{color:#fbbf24;}
.log-row.info{color:var(--vscode-foreground);}
.log-sub{color:var(--vscode-descriptionForeground);font-size:10px;margin-left:8px;display:block;}


.install-wrap{padding:0 10px 10px;flex-shrink:0;margin-top:auto;}
.install-btn{
  width:100%;padding:10px;
  background:linear-gradient(135deg,#4f8ef7,#3365c5);
  border:none;border-radius:7px;color:#fff;
  font-size:13px;font-weight:700;cursor:pointer;transition:filter .12s;
}
.install-btn:hover:not(:disabled){filter:brightness(1.1);}
.install-btn:disabled{opacity:.35;cursor:not-allowed;}
.install-btn.busy{background:#1e3a6e;animation:pulse 1.4s infinite;}


.done-banner{
  display:none;margin:0 10px 8px;padding:12px 10px;
  background:rgba(74,222,128,.07);
  border:1px solid rgba(74,222,128,.4);
  border-radius:8px;text-align:center;animation:popIn .2s ease;flex-shrink:0;
}
.done-banner.show{display:block;}
.done-banner .big{font-size:28px;margin-bottom:5px;}
.done-banner h3{font-size:13px;font-weight:700;color:#4ade80;}
.done-banner p{font-size:10px;color:var(--vscode-descriptionForeground);margin-top:3px;line-height:1.5;}


.stats-grid{
  display:grid;grid-template-columns:1fr 1fr;gap:6px;
  padding:0 10px 8px;flex-shrink:0;
}
.stat-card{
  background:var(--vscode-input-background,#1e1e1e);
  border:1px solid var(--vscode-input-border,#555);
  border-radius:7px;padding:9px 10px;
}
.stat-card .sv{font-size:20px;font-weight:800;color:#4f8ef7;line-height:1;}
.stat-card .sk{font-size:10px;color:var(--vscode-descriptionForeground);margin-top:2px;}

.hist-list{display:flex;flex-direction:column;gap:5px;padding:0 10px 10px;}
.hist-entry{
  background:var(--vscode-input-background,#1e1e1e);
  border:1px solid var(--vscode-input-border,#555);
  border-radius:7px;padding:9px 10px;
}
.hist-entry-head{display:flex;align-items:center;gap:7px;margin-bottom:5px;}
.hist-status{
  width:8px;height:8px;border-radius:50%;flex-shrink:0;
}
.hist-status.success{background:#4ade80;}
.hist-status.partial{background:#fbbf24;}
.hist-status.failed{background:#f87171;}
.hist-date{font-size:10px;color:var(--vscode-descriptionForeground);margin-left:auto;}
.hist-os{
  font-size:9px;padding:1px 5px;border-radius:3px;
  background:rgba(79,142,247,.2);color:#60a5fa;font-weight:600;
}
.hist-langs{display:flex;flex-wrap:wrap;gap:3px;margin-bottom:4px;}
.hist-lang-tag{
  font-size:9px;padding:1px 6px;border-radius:3px;
  background:rgba(255,255,255,.07);
  color:var(--vscode-foreground);
}
.hist-detail-toggle{
  font-size:10px;color:#4f8ef7;cursor:pointer;
  background:none;border:none;padding:0;text-align:left;
}
.hist-detail-toggle:hover{text-decoration:underline;}
.hist-details{
  display:none;margin-top:5px;padding:5px 7px;
  background:rgba(0,0,0,.2);border-radius:5px;
  font-family:'Consolas','Courier New',monospace;font-size:10px;
  color:var(--vscode-descriptionForeground);line-height:1.6;
  max-height:100px;overflow-y:auto;
}
.hist-details.show{display:block;}

.hist-empty{
  text-align:center;padding:40px 20px;
  color:var(--vscode-descriptionForeground);font-size:12px;
}
.hist-empty .big{font-size:32px;margin-bottom:8px;}

.hist-toolbar{
  padding:0 10px 8px;display:flex;gap:6px;flex-shrink:0;
}
.hist-clear-btn{
  font-size:11px;padding:5px 10px;
  background:none;
  border:1px solid var(--vscode-input-border,#555);
  border-radius:5px;color:var(--vscode-descriptionForeground);
  cursor:pointer;transition:all .12s;
}
.hist-clear-btn:hover{border-color:#f87171;color:#f87171;}

@keyframes pulse{0%,100%{opacity:1}50%{opacity:.65}}
@keyframes popIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
</style>
</head>
<body>

<!-- Tab bar -->
<div class="tabs">
  <div class="tab active" id="tab-install" onclick="switchTab('install')">⬇ Install</div>
  <div class="tab"        id="tab-history" onclick="switchTab('history')">📋 History</div>
</div>

<!-- ═══════════════ INSTALL PANE ════════════════════════ -->
<div class="pane active" id="pane-install">

  <div class="header">
    <div class="logo">📦</div>
    <div class="header-text">
      <div class="title">LangSetup</div>
      <div class="sub">One-click language installer</div>
    </div>
  </div>

  <div class="section">
    <div class="label">Step 1 — Your Operating System</div>
    <div class="os-row">
      <div class="os-pill" data-os="windows" onclick="setOS('windows')"><span>🪟</span>Windows</div>
      <div class="os-pill" data-os="mac"     onclick="setOS('mac')"><span>🍎</span>macOS</div>
      <div class="os-pill" data-os="linux"   onclick="setOS('linux')"><span>🐧</span>Linux</div>
    </div>
  </div>

  <hr/>

  <div class="section">
    <div class="label">Step 2 — Select Languages</div>
  </div>
  <div class="lang-list" id="langList"></div>

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
      <button class="btn-cancel" onclick="hideConfirm()">Cancel</button>
      <button class="btn-go"     onclick="startInstall()">Download &amp; Install</button>
    </div>
  </div>

  <!-- Log panel -->
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

  <div class="install-wrap">
    <button class="install-btn" id="installBtn" onclick="showConfirm()" disabled>
      ⬇ Install Selected Languages
    </button>
  </div>

</div><!-- /pane-install -->

<!-- ═══════════════ HISTORY PANE ════════════════════════ -->
<div class="pane" id="pane-history">

  <!-- Stats cards -->
  <div class="section" style="padding-bottom:8px;">
    <div class="label">Install Statistics</div>
  </div>
  <div class="stats-grid" id="statsGrid">
    <div class="stat-card"><div class="sv" id="stat-sessions">0</div><div class="sk">Sessions</div></div>
    <div class="stat-card"><div class="sv" id="stat-total">0</div><div class="sk">Languages Installed</div></div>
    <div class="stat-card" style="grid-column:span 2"><div class="sv" style="font-size:14px" id="stat-most">—</div><div class="sk">Most Installed Language</div></div>
  </div>

  <div class="section" style="padding-bottom:4px;">
    <div class="label">Recent Sessions</div>
  </div>

  <div class="hist-toolbar">
    <button class="hist-clear-btn" onclick="clearHist()">🗑 Clear All History</button>
  </div>

  <div class="hist-list" id="histList">
    <div class="hist-empty" id="histEmpty">
      <div class="big">📭</div>
      <div>No installs yet.<br/>Go to the Install tab to get started!</div>
    </div>
  </div>

</div><!-- /pane-history -->

<script>
const vscode = acquireVsCodeApi();
const LANGS  = ${langsJson};
let currentOS = '${detectedOS}';
let selected  = new Set();
let busy      = false;
let logLines  = [];   



function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.pane').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  document.getElementById('pane-' + name).classList.add('active');
  if (name === 'history') { vscode.postMessage({ type: 'getHistory' }); }
}



function init() {
  try {
    console.log("LangSetup: initializing UI with " + LANGS.length + " languages");
    setOS(currentOS);
    const list = document.getElementById('langList');
    if (!list) {
      console.error("LangSetup: could not find langList element");
      return;
    }
    LANGS.forEach(l => {
      const el = document.createElement('div');
      el.className = 'lang-item';
      el.dataset.id = l.id;
      el.onclick = () => toggle(l.id);
      el.innerHTML =
        '<div class="lang-logo-wrap">' +
          '<span class="lang-logo-fallback">' + l.name.charAt(0) + '</span>' +
          '<img src="' + l.icon + '" alt="' + esc(l.name) + '" ' +
               'onerror="this.style.opacity=0" crossorigin="anonymous"/>' +
        '</div>' +
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
  } catch (err) {
    console.error("LangSetup UI Init Error:", err);
    const list = document.getElementById('langList');
    if (list) {
      list.innerHTML = '<div style="color:#f87171; padding: 10px;">❌ Error initializing UI: ' + String(err) + '<br/>Please check DevTools.</div>';
    }
  }
}



function setOS(os) {
  currentOS = os;
  document.querySelectorAll('.os-pill').forEach(p =>
    p.classList.toggle('active', p.dataset.os === os)
  );
}



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
      '<img src="' + l.icon + '" alt="' + esc(l.name) + '" onerror="this.style.opacity=0" crossorigin="anonymous"/>' +
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



function startInstall() {
  hideConfirm();
  busy = true;
  logLines = [];
  const btn = document.getElementById('installBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Installing…';
  btn.classList.add('busy');
  document.getElementById('logPanel').classList.add('show');
  vscode.postMessage({
    type: 'install',
    os: currentOS,
    languages: [...selected],
    langNames: [...selected].map(id => LANGS.find(x => x.id === id)?.name ?? id),
  });
}



function addLog(step, detail, done, error) {
  logLines.push(step + (detail ? ' — ' + detail : ''));
  const body = document.getElementById('logBody');
  const row  = document.createElement('div');
  let cls = 'info';
  if (error)                                              { cls = 'err';  }
  else if (step.startsWith('✅') || step.startsWith('🎉')) { cls = 'ok';   }
  else if (step.startsWith('📌'))                         { cls = 'note'; }
  row.className = 'log-row ' + cls;
  row.innerHTML = esc(step) + (detail ? '<span class="log-sub">' + esc(detail) + '</span>' : '');
  body.appendChild(row);
  body.scrollTop = body.scrollHeight;
}



function renderHistory(history, stats) {
  document.getElementById('stat-sessions').textContent = stats.totalSessions;
  document.getElementById('stat-total').textContent    = stats.totalLanguages;
  document.getElementById('stat-most').textContent     = stats.mostInstalled;

  const list  = document.getElementById('histList');
  const empty = document.getElementById('histEmpty');

  
  Array.from(list.children).forEach(c => { if (c !== empty) { c.remove(); } });

  if (!history || history.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  history.forEach((entry, idx) => {
    const div = document.createElement('div');
    div.className = 'hist-entry';

    const osLabel = { windows: '🪟 Windows', mac: '🍎 macOS', linux: '🐧 Linux' }[entry.os] ?? entry.os;
    const langTags = entry.languages.map(l => '<span class="hist-lang-tag">' + esc(l) + '</span>').join('');
    const detailLines = (entry.details ?? []).map(d => esc(d)).join('<br/>');
    const detailId = 'hist-detail-' + idx;

    div.innerHTML =
      '<div class="hist-entry-head">' +
        '<span class="hist-status ' + entry.status + '"></span>' +
        '<strong style="font-size:11px">' + entry.languages.length + ' language(s)</strong>' +
        '<span class="hist-os">' + osLabel + '</span>' +
        '<span class="hist-date">' + esc(entry.date) + '</span>' +
      '</div>' +
      '<div class="hist-langs">' + langTags + '</div>' +
      (detailLines
        ? '<button class="hist-detail-toggle" onclick="toggleDetail(&quot;' + detailId + '&quot;)">Show log ▾</button>' +
          '<div class="hist-details" id="' + detailId + '">' + detailLines + '</div>'
        : ''
      );
    list.appendChild(div);
  });
}

function toggleDetail(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.toggle('show'); }
}

function clearHist() {
  vscode.postMessage({ type: 'clearHistory' });
}



window.addEventListener('message', e => {
  const m = e.data;

  if (m.type === 'progress') {
    addLog(m.step, m.detail || '', m.done, !!m.error);
    if (m.done && m.step.includes('All done')) {
      busy = false;
      document.getElementById('doneBanner').classList.add('show');
      const btn = document.getElementById('installBtn');
      btn.textContent = '✅ Done — Restart VS Code';
      btn.classList.remove('busy');
      btn.disabled = false;
    }
    return;
  }

  if (m.type === 'historyData') {
    renderHistory(m.history, m.stats);
    return;
  }
});

function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
</script>
</body>
</html>`;
  }
}
