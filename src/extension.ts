import * as vscode from "vscode";
import { LangSetupSidebarProvider } from "./sidebarProvider";
import { installLanguages, detectOS } from "./installer";
import { getLanguage, Language } from "./languages";
import { saveHistoryEntry, clearHistory } from "./history";
import { OS } from "./types";

export function activate(context: vscode.ExtensionContext): void {
  console.log("LangSetup activated.");

  const provider = new LangSetupSidebarProvider(context.extensionUri, context);

  provider.onMessage(async (message: any) => {
    if (message.type !== "install") {
      return;
    }

    const {
      os: selectedOS,
      languages: langIds,
      langNames,
    } = message as {
      os: OS;
      languages: string[];
      langNames: string[];
    };

    if (!Array.isArray(langIds) || langIds.length === 0) {
      vscode.window.showWarningMessage("LangSetup: No languages selected.");
      return;
    }

    const langs = langIds
      .map((id) => getLanguage(id))
      .filter((l): l is Language => l !== undefined);

    if (langs.length === 0) {
      vscode.window.showErrorMessage(
        "LangSetup: Could not find selected languages.",
      );
      return;
    }

    vscode.window.showInformationMessage(
      `LangSetup: Installing ${langs.length} language(s). Check the sidebar for progress.`,
    );

    const logLines: string[] = [];
    let overallStatus: "success" | "partial" | "failed" = "success";

    try {
      await installLanguages(langs, selectedOS, (progress) => {
        provider.sendProgress(
          progress.step,
          progress.detail ?? "",
          progress.done,
          progress.error,
        );
        // Collect for history
        logLines.push(
          progress.step + (progress.detail ? " — " + progress.detail : ""),
        );
        if (progress.error) {
          overallStatus = "partial";
        }
      });

      saveHistoryEntry(
        context,
        selectedOS,
        langNames ?? langs.map((l) => l.name),
        logLines,
        overallStatus,
      );
      provider.refreshHistory();

      const choice = await vscode.window.showInformationMessage(
        "✅ LangSetup: All done! Restart VS Code to activate everything.",
        "Restart Now",
        "Later",
      );
      if (choice === "Restart Now") {
        vscode.commands.executeCommand("workbench.action.reloadWindow");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(`LangSetup error: ${msg}`);
      provider.sendProgress(
        `❌ Error: ${msg}`,
        "Check internet connection and try again.",
        true,
        msg,
      );

      saveHistoryEntry(
        context,
        selectedOS,
        langNames ?? langs.map((l) => l.name),
        [...logLines, `❌ Error: ${msg}`],
        "failed",
      );
      provider.refreshHistory();
    }
  });

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      LangSetupSidebarProvider.viewId,
      provider,
      { webviewOptions: { retainContextWhenHidden: true } },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("langsetup.open", () => {
      vscode.commands.executeCommand(
        "workbench.view.extension.langsetup-sidebar",
      );
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("langsetup.clearHistory", () => {
      clearHistory(context);
      vscode.window.showInformationMessage(
        "LangSetup: Install history cleared.",
      );
      provider.refreshHistory();
    }),
  );
}

export function deactivate(): void {}
