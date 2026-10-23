import type { LeafEnvUpdate } from "../ghostty/envScanner";

export type LeafNodeEnv = {
  /** `node --version` as reported by the leaf's own shell, or null. */
  node: string | null;
  /** Current git branch/sha as reported by the leaf's own shell, or null. */
  branch: string | null;
};

type Entry = LeafNodeEnv & { listeners: Set<() => void> };

/**
 * Per-leaf shell environment as reported by the shell integration's
 * `OSC 6637` markers (the same values Warp carries in its precmd payload).
 * Tracked outside the VT because the values describe the shell process, not
 * the rendered grid. Absent entries mean "shell never reported" — callers
 * fall back to a filesystem probe.
 */
const entries = new Map<number, Entry>();

function entryFor(leafId: number): Entry {
  let entry = entries.get(leafId);
  if (!entry) {
    entry = { node: null, branch: null, listeners: new Set() };
    entries.set(leafId, entry);
  }
  return entry;
}

export function getLeafNodeEnv(leafId: number): LeafNodeEnv {
  const entry = entries.get(leafId);
  return entry
    ? { node: entry.node, branch: entry.branch }
    : { node: null, branch: null };
}

export function subscribeLeafNodeEnv(
  leafId: number,
  callback: () => void,
): () => void {
  const entry = entryFor(leafId);
  entry.listeners.add(callback);
  return () => entry.listeners.delete(callback);
}

export function setLeafNodeEnv(leafId: number, update: LeafEnvUpdate): void {
  const entry = entryFor(leafId);
  if (
    (update.node === undefined || update.node === entry.node) &&
    (update.branch === undefined || update.branch === entry.branch)
  )
    return;
  if (update.node !== undefined) entry.node = update.node;
  if (update.branch !== undefined) entry.branch = update.branch;
  for (const listener of entry.listeners) listener();
}

export function forgetLeafNodeEnv(leafId: number): void {
  entries.delete(leafId);
}
