import {
  NODE_PROBE_COMMAND,
  type NodeEnv,
  parseNodeProbe,
} from "@/lib/nodeProbe";
import { native } from "@/modules/ai/lib/native";
import { useEffect, useState } from "react";

/** Node version + installed versions for the chip dropdown. Probed lazily in
 *  the terminal's cwd and re-run whenever `nonce` bumps after a command. */
export function useNodeEnv(cwd: string | null, nonce = 0): NodeEnv | null {
  const [env, setEnv] = useState<NodeEnv | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: nonce is a manual re-probe trigger
  useEffect(() => {
    if (!cwd) {
      setEnv(null);
      return;
    }
    let alive = true;
    native
      .runCommand(NODE_PROBE_COMMAND, cwd, 5)
      .then((out) => {
        if (alive) setEnv(parseNodeProbe(out.stdout));
      })
      .catch(() => {
        if (alive) setEnv(null);
      });
    return () => {
      alive = false;
    };
  }, [cwd, nonce]);

  return env;
}
