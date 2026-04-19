export type OS = "windows" | "mac" | "linux";

export interface ResolvedDownload {
  name: string;
  version: string;
  url: string;
  filename: string;
  note: string;
}

export interface HistoryEntry {
  id: string;
  date: string;
  timestamp: number;
  os: OS;
  languages: string[];
  status: "success" | "partial" | "failed";
  details: string[];
}
