import * as vscode from "vscode";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import { Language } from "./languages";
import { OS } from "./types";

export { OS };

export interface InstallProgress {
  step: string;
  detail?: string;
  done: boolean;
  error?: string;
}

export type ProgressCallback = (p: InstallProgress) => void;

export function detectOS(): OS {
  const p = os.platform();
  if (p === "win32") {
    return "windows";
  }
  if (p === "darwin") {
    return "mac";
  }
  return "linux";
}

function downloadsDir(): string {
  return path.join(os.homedir(), "Downloads");
}

async function installVSCodeExtension(
  id: string,
  onProgress: ProgressCallback,
): Promise<void> {
  if (vscode.extensions.getExtension(id)) {
    onProgress({ step: `✓ Already installed: ${id}`, done: false });
    return;
  }
  onProgress({ step: `Installing VS Code extension: ${id}`, done: false });
  try {
    await vscode.commands.executeCommand(
      "workbench.extensions.installExtension",
      id,
    );
    onProgress({ step: `✅ Installed: ${id}`, done: false });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    onProgress({
      step: `⚠ Could not install: ${id}`,
      detail: "Search it manually in the Extensions panel (Ctrl+Shift+X)",
      done: false,
      error: msg,
    });
  }
}

function downloadFile(
  url: string,
  destPath: string,
  filename: string,
  onProgress: ProgressCallback,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);

    const makeReq = (currentUrl: string) => {
      https
        .get(
          currentUrl,
          { headers: { "User-Agent": "LangSetup-VSCode/1.0" } },
          (res) => {
            const code = res.statusCode ?? 0;
            if (
              [301, 302, 303, 307, 308].includes(code) &&
              res.headers.location
            ) {
              makeReq(res.headers.location);
              return;
            }
            if (code !== 200) {
              file.close();
              fs.unlink(destPath, () => undefined);
              reject(new Error(`HTTP ${code} downloading ${filename}`));
              return;
            }
            const total = parseInt(res.headers["content-length"] ?? "0", 10);
            let received = 0;
            let lastMB = -1;
            res.on("data", (chunk: Buffer) => {
              received += chunk.length;
              const mb = Math.floor(received / (1024 * 1024));
              if (mb !== lastMB) {
                lastMB = mb;
                const totalStr = total
                  ? ` / ${Math.round(total / 1024 / 1024)} MB`
                  : "";
                onProgress({
                  step: `⬇ Downloading ${filename}: ${mb} MB${totalStr}`,
                  done: false,
                });
              }
            });
            res.pipe(file);
            file.on("finish", () => {
              file.close();
              resolve();
            });
            res.on("error", (e: Error) => {
              file.close();
              fs.unlink(destPath, () => undefined);
              reject(e);
            });
          },
        )
        .on("error", (e: Error) => {
          file.close();
          fs.unlink(destPath, () => undefined);
          reject(e);
        });
    };

    makeReq(url);
  });
}

async function downloadAndOpen(
  url: string,
  filename: string,
  onProgress: ProgressCallback,
): Promise<void> {
  const dir = downloadsDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const destPath = path.join(dir, filename);

  if (fs.existsSync(destPath)) {
    onProgress({ step: `✓ Already in Downloads: ${filename}`, done: false });
  } else {
    onProgress({
      step: `⬇ Downloading: ${filename}`,
      detail: `Saving to: ${destPath}`,
      done: false,
    });
    await downloadFile(url, destPath, filename, onProgress);
    onProgress({ step: `✅ Download complete: ${filename}`, done: false });
  }

  await delay(400);
  onProgress({
    step: `🚀 Opening installer: ${filename}`,
    detail: "Follow the setup wizard that opens on your screen",
    done: false,
  });
  await vscode.env.openExternal(vscode.Uri.file(destPath));
}

async function runLinuxCommands(
  langName: string,
  commands: string[],
  onProgress: ProgressCallback,
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

export async function installLanguage(
  language: Language,
  osType: OS,
  onProgress: ProgressCallback,
): Promise<void> {
  onProgress({ step: `━━━ Starting: ${language.name} ━━━`, done: false });

  onProgress({
    step: `Installing ${language.vsExtensions.length} VS Code extension(s) for ${language.name}…`,
    done: false,
  });
  for (const extId of language.vsExtensions) {
    await installVSCodeExtension(extId, onProgress);
    await delay(400);
  }

  if ((osType === "windows" || osType === "mac") && language.resolveDownload) {
    try {
      onProgress({
        step: `🔍 Fetching latest version of ${language.name}…`,
        done: false,
      });
      const dl = await language.resolveDownload(osType);
      if (dl) {
        onProgress({ step: `📦 Found: ${dl.name}`, done: false });
        await downloadAndOpen(dl.url, dl.filename, onProgress);
        onProgress({ step: `📌 Important:`, detail: dl.note, done: false });
        await delay(2500);
      } else {
        onProgress({
          step: `ℹ No extra download needed for ${language.name}`,
          done: false,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onProgress({
        step: `❌ Download failed for ${language.name}`,
        detail: msg,
        done: false,
        error: msg,
      });
    }
  }

  if (
    osType === "linux" &&
    language.linuxCommands &&
    language.linuxCommands.length > 0
  ) {
    await runLinuxCommands(language.name, language.linuxCommands, onProgress);
  }

  if (language.extraNote) {
    onProgress({ step: `📌 ${language.extraNote}`, done: false });
  }

  onProgress({ step: `✅ ${language.name} — Done!`, done: false });
}

export async function installLanguages(
  languages: Language[],
  osType: OS,
  onProgress: ProgressCallback,
): Promise<void> {
  onProgress({
    step: `Starting installation of ${languages.length} language(s)…`,
    done: false,
  });

  for (let i = 0; i < languages.length; i++) {
    const lang = languages[i];
    onProgress({
      step: `[${i + 1}/${languages.length}] Setting up ${lang.name}`,
      done: false,
    });
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
