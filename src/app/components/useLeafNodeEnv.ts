import {
  getLeafNodeEnv,
  type LeafNodeEnv,
  subscribeLeafNodeEnv,
} from "@/modules/terminal/lib/terminalEnvStore";
import { useEffect, useState } from "react";

/** Subscribes to the shell-reported node/branch values for a leaf. */
export function useLeafNodeEnv(leafId: number | null): LeafNodeEnv {
  const [env, setEnv] = useState<LeafNodeEnv>({ node: null, branch: null });

  useEffect(() => {
    if (leafId == null) {
      setEnv({ node: null, branch: null });
      return;
    }
    setEnv(getLeafNodeEnv(leafId));
    return subscribeLeafNodeEnv(leafId, () => setEnv(getLeafNodeEnv(leafId)));
  }, [leafId]);

  return env;
}
