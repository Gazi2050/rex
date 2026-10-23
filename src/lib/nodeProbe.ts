/** One-shot POSIX probe for node's current version and installed versions.
 *  Emits one "tag version" line per finding; unmatched globs are filtered by
 *  the `[ -d ]` guards, so a missing manager prints nothing. */
export const NODE_PROBE_COMMAND = [
  'printf "current %s\\n" "$(node -v 2>/dev/null)"',
  'for d in "$HOME/.nvm/versions/node"/*/; do [ -d "$d" ] && printf "nvm %s\\n" "$(basename "$d")"; done',
  'for d in "$HOME/.local/share/fnm/node-versions"/*/; do [ -d "$d" ] && printf "fnm %s\\n" "$(basename "$d")"; done',
  'for d in "$HOME/Library/Application Support/fnm/node-versions"/*/; do [ -d "$d" ] && printf "fnm %s\\n" "$(basename "$d")"; done',
].join("\n");

export type NodeManager = "fnm" | "nvm";

export type NodeEnv = {
  current: string | null;
  /** Manager with installed versions, preferring fnm when both exist. */
  manager: NodeManager | null;
  /** Every installed version seen, per manager, unsorted. */
  installed: Record<NodeManager, string[]>;
  /** Versions of `manager`, newest first. */
  versions: string[];
};

function versionParts(version: string): number[] {
  return version
    .replace(/^v/i, "")
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);
}

function compareVersionsDesc(a: string, b: string): number {
  const left = versionParts(a);
  const right = versionParts(b);
  for (let index = 0; index < 3; index++) {
    const diff = (right[index] ?? 0) - (left[index] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function parseNodeProbe(stdout: string): NodeEnv {
  let current: string | null = null;
  const installed: Record<NodeManager, string[]> = { fnm: [], nvm: [] };

  for (const raw of stdout.split("\n")) {
    const [tag, version] = raw.trim().split(/\s+/);
    if (!tag || !version) continue;
    if (tag === "current") current = version;
    else if (tag === "fnm" || tag === "nvm") installed[tag].push(version);
  }

  const manager = pickNodeManager({ installed, manager: null }, current);
  return {
    current,
    manager,
    installed,
    versions: manager ? [...installed[manager]].sort(compareVersionsDesc) : [],
  };
}

/** Prefers the manager that owns the shell-reported version; falls back to
 *  fnm when both are installed (nvm often lingers from an older setup). */
export function pickNodeManager(
  env: Pick<NodeEnv, "installed" | "manager">,
  current: string | null,
): NodeManager | null {
  if (current) {
    for (const manager of ["fnm", "nvm"] as const) {
      if (env.installed[manager]?.includes(current)) return manager;
    }
  }
  return env.installed.fnm.length
    ? "fnm"
    : env.installed.nvm.length
      ? "nvm"
      : null;
}

export function nodeVersionsFor(
  env: Pick<NodeEnv, "installed">,
  manager: NodeManager | null,
): string[] {
  return manager ? [...env.installed[manager]].sort(compareVersionsDesc) : [];
}

export function nodeUseCommand(manager: NodeManager, version: string): string {
  return `${manager} use ${version}`;
}
