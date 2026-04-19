// src/installer.ts
// STEP 1 — Installs VS Code extensions silently.
// STEP 2 — Resolves latest version URL, downloads to Downloads folder, opens installer.
// STEP 3 — Linux: runs terminal package manager commands.

import * as vscode from "vscode";
import * as os     from "os";
import * as fs     from "fs";
import * as path   from "path";
import * as https  from "https";
import { Language, OS } from "./languages";

export interface InstallProgress {
  step: string;
  detail?: string;
  done: boolean;
  error?: string;
}
export type ProgressCallback = (p: InstallProgress) => void;

export function detectOS(): OS {
  const p = os.platform();
  if (p === "win32")  { return "windows"; }
  if (p === "darwin") { return "mac"; }
  return "linux";
}

function getDownloadsFolder(): string {
  return path.join(os.homedir(), "Downloads");
}

// ── STEP 1: Install a VS Code extension silently ──────────────────

async function installVSCodeExtension(id: string, onProgress: ProgressCallback): Promise<void> {
  if (vscode.extensions.getExtension(id)) {
    onProgress({ step: `✓ Already installed: ${id}`, done: false });
    return;
  }
  onProgress({ step: `Installing VS Code extension: ${id}`, done: false });
  try {
    await vscode.commands.executeCommand("workbench.extensions.installExtension", id);
    onProgress({ step: `✅ Installed: ${id}`, done: false });
  } catch (err: any) {
    onProgress({ step: `⚠ Could not install: ${id}`, detail: "Search it manually in Extensions panel (Ctrl+Shift+X)", done: false, error: err?.message });
  }
}

// ── STEP 2: Download a file to the Downloads folder ───────────────

function downloadFile(
  url: string, destPath: string, filename: string,
  onProgress: ProgressCallback
): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const makeRequest = (currentUrl: string) => {
      https.get(currentUrl, { headers: { "User-Agent": "LangSetup-VSCode/1.0" } }, (res) => {
        const code = res.statusCode ?? 0;
        if ([301, 302, 303, 307, 308].includes(code)) {
          const loc = res.headers.location;
          if (loc) { makeRequest(loc); return; }
        }
        if (code !== 200) {
          file.close();
          fs.unlink(destPath, () => {});
          reject(new Error(`HTTP ${code} for ${filename}`));
          return;
        }
        const total = parseInt(res.headers["content-length"] ?? "0", 10);
        let received = 0, lastMB = -1;
        res.on("data", (chunk: Buffer) => {
          received += chunk.length;
          const mb = Math.floor(received / (1024 * 1024));
          if (mb !== lastMB) {
            lastMB = mb;
            const totalMB = total ? ` / ${Math.round(total / 1024 / 1024)} MB` : "";
            onProgress({ step: `⬇ Downloading ${filename}: ${mb} MB${totalMB}`, done: false });
          }
        });
        res.pipe(file);
        file.on("finish", () => { file.close(); resolve(); });
        res.on("error", (e) => { file.close(); fs.unlink(destPath, () => {}); reject(e); });
      }).on("error", (e) => { file.close(); fs.unlink(destPath, () => {}); reject(e); });
    };
    makeRequest(url);
  });
}

async function downloadAndOpen(
  url: string, filename: string,
  onProgress: ProgressCallback
): Promise<void> {
  const dir = getDownloadsFolder();
  if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); }
  const destPath = path.join(dir, filename);

  if (fs.existsSync(destPath)) {
    onProgress({ step: `✓ Already in Downloads: ${filename}`, done: false });
  } else {
    onProgress({ step: `⬇ Downloading: ${filename}`, detail: `Saving to: ${destPath}`, done: false });
    await downloadFile(url, destPath, filename, onProgress);
    onProgress({ step: `✅ Download complete: ${filename}`, done: false });
  }

  await delay(400);
  onProgress({ step: `🚀 Opening installer: ${filename}`, detail: "Follow the setup wizard that opens on screen", done: false });
  await vscode.env.openExternal(vscode.Uri.file(destPath));
}

// ── STEP 3: Run Linux terminal commands ───────────────────────────

async function runLinuxCommands(
  langName: string, commands: string[],
  onProgress: ProgressCallback
): Promise<void> {
  const terminal = vscode.window.createTerminal({
    name: `LangSetup – ${langName}`,
    message: `LangSetup: Installing ${langName}. Do not close this terminal.`,
  });
  terminal.show(false);
  for (const cmd of commands) {
    onProgress({ step: `Running: ${cmd}`, done: false });
    terminal.sendText(cmd);
    await delay(2000);
  }
  terminal.sendText(`echo "✅ LangSetup: ${langName} done"`);
}

// ── Install a single language ─────────────────────────────────────

export async function installLanguage(
  language: Language, osType: OS, onProgress: ProgressCallback
): Promise<void> {
  onProgress({ step: `━━━ Starting: ${language.name} ━━━`, done: false });

  // STEP 1 — VS Code extensions (all platforms, always)
  onProgress({ step: `Installing ${language.vsExtensions.length} VS Code extension(s)…`, done: false });
  for (const extId of language.vsExtensions) {
    await installVSCodeExtension(extId, onProgress);
    await delay(400);
  }

  // STEP 2 — Download latest version (Windows & Mac)
  if ((osType === "windows" || osType === "mac") && language.resolveDownload) {
    try {
      onProgress({ step: `🔍 Checking latest version of ${language.name}…`, done: false });
      const dl = await language.resolveDownload(osType);
      if (dl) {
        onProgress({ step: `📦 Found: ${dl.name}`, done: false });
        await downloadAndOpen(dl.url, dl.filename, onProgress);
        onProgress({ step: `📌 Important:`, detail: dl.note, done: false });
        await delay(2500);
      } else {
        onProgress({ step: `ℹ No extra download needed for ${language.name}`, done: false });
      }
    } catch (err: any) {
      onProgress({ step: `❌ Download failed for ${language.name}`, detail: err?.message ?? "Check internet connection and try again", done: false, error: err?.message });
    }
  }

  // STEP 3 — Linux terminal commands
  if (osType === "linux" && language.linuxCommands?.length) {
    await runLinuxCommands(language.name, language.linuxCommands, onProgress);
  }

  if (language.extraNote) {
    onProgress({ step: `📌 ${language.extraNote}`, done: false });
  }

  onProgress({ step: `✅ ${language.name} — Done!`, done: false });
}

// ── Install multiple languages ────────────────────────────────────

export async function installLanguages(
  languages: Language[], osType: OS, onProgress: ProgressCallback
): Promise<void> {
  onProgress({ step: `Starting installation of ${languages.length} language(s)…`, done: false });

  for (let i = 0; i < languages.length; i++) {
    const lang = languages[i];
    onProgress({ step: `[${i + 1}/${languages.length}] Setting up ${lang.name}`, done: false });
    await installLanguage(lang, osType, onProgress);
    await delay(800);
  }

  onProgress({
    step: `🎉 All done! ${languages.length} language(s) installed.`,
    detail: "Finish any open setup wizards → restart VS Code → start coding!",
    done: true,
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
