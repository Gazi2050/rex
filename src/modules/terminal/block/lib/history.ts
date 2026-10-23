import { invoke } from "@tauri-apps/api/core";

export function historySuggest(line: string): Promise<string | null> {
  return invoke<string | null>("history_suggest", { line }).catch(() => null);
}

export function historyList(query: string, limit = 200): Promise<string[]> {
  return invoke<string[]>("history_list", { query, limit }).catch(() => []);
}

export function historyRecord(command: string): void {
  void invoke("history_record", { command }).catch(() => {});
}
