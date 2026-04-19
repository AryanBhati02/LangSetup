import * as vscode from "vscode";
import { HistoryEntry, OS } from "./types";

const HISTORY_KEY = "langsetup.installHistory";
const MAX_ENTRIES = 50;

export function saveHistoryEntry(
  context: vscode.ExtensionContext,
  os: OS,
  languages: string[],
  logLines: string[],
  status: HistoryEntry["status"],
): void {
  const existing = getHistory(context);
  const now = new Date();

  const entry: HistoryEntry = {
    id: String(now.getTime()),
    date: now.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
    timestamp: now.getTime(),
    os,
    languages,
    status,
    details: logLines.slice(-30),
  };

  const updated = [entry, ...existing].slice(0, MAX_ENTRIES);
  context.globalState.update(HISTORY_KEY, updated);
}

export function getHistory(context: vscode.ExtensionContext): HistoryEntry[] {
  return context.globalState.get<HistoryEntry[]>(HISTORY_KEY, []);
}

export function clearHistory(context: vscode.ExtensionContext): void {
  context.globalState.update(HISTORY_KEY, []);
}

export interface HistoryStats {
  totalSessions: number;
  totalLanguages: number;
  mostInstalled: string;
  lastInstall: string;
}

export function getStats(context: vscode.ExtensionContext): HistoryStats {
  const history = getHistory(context);

  if (history.length === 0) {
    return {
      totalSessions: 0,
      totalLanguages: 0,
      mostInstalled: "None yet",
      lastInstall: "Never",
    };
  }

  const counts: Record<string, number> = {};
  let totalLanguages = 0;
  for (const entry of history) {
    for (const lang of entry.languages) {
      counts[lang] = (counts[lang] ?? 0) + 1;
      totalLanguages++;
    }
  }

  const mostInstalled =
    Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None";

  return {
    totalSessions: history.length,
    totalLanguages,
    mostInstalled,
    lastInstall: history[0]?.date ?? "Never",
  };
}
