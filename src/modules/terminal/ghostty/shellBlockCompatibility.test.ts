import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

const BASHRC = fileURLToPath(
  new URL(
    "../../../../src-tauri/src/modules/pty/scripts/bashrc.bash",
    import.meta.url,
  ),
);

it.skipIf(process.platform === "win32")(
  "keeps Bash usable with and without PS0 integration",
  () => {
    const script = BASHRC;
    const result = spawnSync(
      process.platform === "darwin" ? "/bin/bash" : "bash",
      [
        "--noprofile",
        "--norc",
        "-c",
        `
source() { :; }
export REX_BLOCKS=1
PS1='test> '
. "$1" >/dev/null
if (( BASH_VERSINFO[0] > 4 || BASH_VERSINFO[0] == 4 && BASH_VERSINFO[1] >= 4 )); then
  test "$REX_BLOCKS" = 1 || exit 10
  case "$PS0" in *'133;C'*) ;; *) exit 11 ;; esac
else
  test -z "$REX_BLOCKS" || exit 12
  case "$PS1" in *'rex_blocks=0'*'test> '*) ;; *) exit 13 ;; esac
fi
`,
        "rex-test",
        script,
      ],
      {
        env: { PATH: process.env.PATH ?? "/usr/bin:/bin" },
        encoding: "utf8",
        timeout: 5000,
      },
    );
    expect(result.error).toBeUndefined();
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
  },
);

it.skipIf(
  process.platform === "win32" ||
    (spawnSync("node", ["--version"]).status ?? 1) !== 0,
)("reports node + branch env markers with a per-PWD:PATH node cache", () => {
  const repo = mkdtempSync(join(tmpdir(), "rex-env-test-"));
  try {
    spawnSync("git", ["init", "-q"], { cwd: repo });
    const branch = spawnSync("git", ["symbolic-ref", "--short", "HEAD"], {
      cwd: repo,
      encoding: "utf8",
    }).stdout.trim();
    const script = BASHRC;
    const result = spawnSync(
      "bash",
      [
        "--noprofile",
        "--norc",
        "-c",
        `
source() { :; }
. "$1" >"$2" 2>/dev/null
_rex_precmd >"$3" 2>/dev/null
PATH="$PATH:$REX_NONEXISTENT_DIR"
_rex_precmd >"$4" 2>/dev/null
`,
        "rex-env-test",
        script,
        join(repo, "prompt1.out"),
        join(repo, "prompt2.out"),
        join(repo, "prompt3.out"),
      ],
      {
        cwd: repo,
        env: { PATH: process.env.PATH ?? "/usr/bin:/bin" },
        encoding: "utf8",
        timeout: 10000,
      },
    );
    expect(result.error).toBeUndefined();
    const prompt1 = readFileSync(join(repo, "prompt1.out"), "utf8");
    const prompt2 = readFileSync(join(repo, "prompt2.out"), "utf8");
    const prompt3 = readFileSync(join(repo, "prompt3.out"), "utf8");
    // First prompt: node + branch reported.
    expect(prompt1).toMatch(/\x1b\]6637;node=v\d/);
    expect(prompt1).toContain(`6637;branch=${branch}`);
    // Second prompt, unchanged cwd+PATH: branch refreshed, node cached out.
    expect(prompt2).not.toContain("6637;node=");
    expect(prompt2).toContain(`6637;branch=${branch}`);
    // PATH change (what `nvm use` does) re-forks node.
    expect(prompt3).toMatch(/\x1b\]6637;node=v\d/);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
