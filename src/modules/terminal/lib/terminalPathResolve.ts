import { type FileStat, native } from "@/modules/ai/lib/native";
import { homeDir } from "@tauri-apps/api/path";

let cachedHome: string | null = null;
void homeDir()
  .then((home) => {
    cachedHome = home.replace(/\\/g, "/").replace(/\/+$/, "");
  })
  .catch(() => {});

const statCache = new Map<string, FileStat | null>();

export type ResolvedPathHit = { path: string; kind: "file" | "dir" };

/**
 * Resolves a token clicked/hovered in terminal output against the terminal's
 * cwd (plus ~ and absolute forms). Results are cached — hover fires often,
 * and `stat` answers in microseconds on the native side.
 */
export async function resolvePathToken(
  token: string,
  cwd: string | null,
): Promise<ResolvedPathHit | null> {
  const candidates: string[] = [];
  const push = (value: string) => {
    if (value && !candidates.includes(value)) candidates.push(value);
  };
  if (token.startsWith("~") && cachedHome) {
    push(token === "~" ? cachedHome : `${cachedHome}/${token.slice(2)}`);
  }
  if (token.startsWith("/")) push(token);
  if (cwd) push(`${cwd}/${token}`);

  for (const candidate of candidates) {
    let stat = statCache.get(candidate);
    if (stat === undefined) {
      stat = await native.statPath(candidate).catch(() => null);
      if (statCache.size > 400) statCache.clear();
      statCache.set(candidate, stat);
    }
    if (stat) {
      return { path: candidate, kind: stat.kind === "dir" ? "dir" : "file" };
    }
  }
  return null;
}
