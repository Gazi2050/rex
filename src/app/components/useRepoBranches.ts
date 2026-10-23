import { type GitBranchEntry, native } from "@/modules/ai/lib/native";
import { useEffect, useState } from "react";

export type RepoBranches = {
  branch: string | null;
  branches: GitBranchEntry[];
  /** False until the first resolve finishes, so menus can stay closed. */
  loaded: boolean;
};

/** Current branch plus the switchable branch list, re-resolved on `nonce`
 *  (bumped when a terminal command finishes, so `git checkout` shows up). */
export function useRepoBranches(cwd: string | null, nonce = 0): RepoBranches {
  const [branch, setBranch] = useState<string | null>(null);
  const [branches, setBranches] = useState<GitBranchEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: nonce is a manual re-resolve trigger
  useEffect(() => {
    if (!cwd) {
      setBranch(null);
      setBranches([]);
      setLoaded(true);
      return;
    }
    let alive = true;
    native
      .gitResolveRepo(cwd)
      .then(async (repo) => {
        if (!alive) return;
        setBranch(repo?.branch || null);
        if (!repo) {
          setBranches([]);
          setLoaded(true);
          return;
        }
        const list = await native
          .gitListBranches(repo.repoRoot)
          .catch(() => null);
        if (!alive) return;
        setBranches(list?.branches ?? []);
        setLoaded(true);
      })
      .catch(() => {
        if (!alive) return;
        setBranch(null);
        setBranches([]);
        setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [cwd, nonce]);

  return { branch, branches, loaded };
}
