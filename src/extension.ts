// src/extension.ts
// Main entry point. Registers the sidebar and handles the install message.

import * as vscode from "vscode";
import { LangSetupSidebarProvider } from "./sidebarProvider";
import { installLanguages, detectOS } from "./installer";
import { getLanguage, Language } from "./languages";

export function activate(context: vscode.ExtensionContext) {
  console.log("LangSetup activated.");

  const provider = new LangSetupSidebarProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      LangSetupSidebarProvider.viewId,
      provider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("langsetup.open", () => {
      vscode.commands.executeCommand("workbench.view.extension.langsetup-sidebar");
    })
  );

  provider.onMessage(async (message: any) => {
    if (message.type !== "install") { return; }

    const { os: selectedOS, languages: langIds } = message;

    if (!Array.isArray(langIds) || langIds.length === 0) {
      vscode.window.showWarningMessage("LangSetup: No languages selected.");
      return;
    }

    const langs = (langIds as string[])
      .map((id) => getLanguage(id))
      .filter((l): l is Language => l !== undefined);

    if (langs.length === 0) {
      vscode.window.showErrorMessage("LangSetup: Could not find selected languages.");
      return;
    }

    vscode.window.showInformationMessage(
      `LangSetup: Installing ${langs.length} language(s). Check the sidebar for progress.`
    );

    try {
      await installLanguages(langs, selectedOS, (progress) => {
        provider.sendProgress(progress.step, progress.detail ?? "", progress.done, progress.error);
      });

      const choice = await vscode.window.showInformationMessage(
        "✅ LangSetup: All done! Restart VS Code to activate everything.",
        "Restart Now", "Later"
      );
      if (choice === "Restart Now") {
        vscode.commands.executeCommand("workbench.action.reloadWindow");
      }
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      vscode.window.showErrorMessage(`LangSetup error: ${msg}`);
      provider.sendProgress(`❌ Error: ${msg}`, "Check your internet and try again.", true, msg);
    }
  });
}

export function deactivate() {}
