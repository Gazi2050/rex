import { describe, expect, it, vi } from "vitest";
import {
  forgetLeafNodeEnv,
  getLeafNodeEnv,
  setLeafNodeEnv,
  subscribeLeafNodeEnv,
} from "./terminalEnvStore";

describe("terminalEnvStore", () => {
  it("starts empty and reports missing leaves as nulls", () => {
    expect(getLeafNodeEnv(1)).toEqual({ node: null, branch: null });
  });

  it("updates fields independently and notifies once per change", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeLeafNodeEnv(2, listener);
    setLeafNodeEnv(2, { node: "v22.19.0" });
    setLeafNodeEnv(2, { node: "v22.19.0" }); // no-op
    setLeafNodeEnv(2, { branch: "main" });
    expect(listener).toHaveBeenCalledTimes(2);
    expect(getLeafNodeEnv(2)).toEqual({ node: "v22.19.0", branch: "main" });
    unsubscribe();
    setLeafNodeEnv(2, { node: "v24.18.0" });
    expect(listener).toHaveBeenCalledTimes(2);
    forgetLeafNodeEnv(2);
    expect(getLeafNodeEnv(2)).toEqual({ node: null, branch: null });
  });
});
