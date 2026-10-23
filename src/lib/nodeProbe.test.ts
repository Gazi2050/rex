import { describe, expect, it } from "vitest";
import {
  nodeUseCommand,
  nodeVersionsFor,
  parseNodeProbe,
  pickNodeManager,
} from "./nodeProbe";

describe("parseNodeProbe", () => {
  it("reads the current version and the manager's installs, newest first", () => {
    const env = parseNodeProbe(
      ["current v20.11.0", "fnm v18.20.4", "fnm v22.11.0", "fnm v20.11.0"].join(
        "\n",
      ),
    );
    expect(env.current).toBe("v20.11.0");
    expect(env.manager).toBe("fnm");
    expect(env.versions).toEqual(["v22.11.0", "v20.11.0", "v18.20.4"]);
  });

  it("falls back to nvm and ignores a missing node", () => {
    const env = parseNodeProbe("current \nnvm v16.20.2\nnvm v18.20.4");
    expect(env.current).toBeNull();
    expect(env.manager).toBe("nvm");
    expect(env.versions).toEqual(["v18.20.4", "v16.20.2"]);
  });

  it("prefers fnm when both managers are installed", () => {
    const env = parseNodeProbe("nvm v16.20.2\nfnm v22.11.0");
    expect(env.manager).toBe("fnm");
    expect(env.versions).toEqual(["v22.11.0"]);
  });

  it("prefers the manager owning the shell-reported version", () => {
    const env = parseNodeProbe("current v16.20.2\nnvm v16.20.2\nfnm v22.11.0");
    expect(env.manager).toBe("nvm");
    expect(env.versions).toEqual(["v16.20.2"]);
  });

  it("reports no manager when nothing is installed", () => {
    const env = parseNodeProbe("current v22.11.0");
    expect(env.manager).toBeNull();
    expect(env.versions).toEqual([]);
  });

  it("re-picks the manager for a shell-reported version", () => {
    const env = parseNodeProbe("nvm v16.20.2\nfnm v22.11.0");
    expect(pickNodeManager(env, "v16.20.2")).toBe("nvm");
    expect(nodeVersionsFor(env, "nvm")).toEqual(["v16.20.2"]);
  });

  it("builds the switch command from the detected manager", () => {
    expect(nodeUseCommand("fnm", "v22.11.0")).toBe("fnm use v22.11.0");
    expect(nodeUseCommand("nvm", "v18.20.4")).toBe("nvm use v18.20.4");
  });
});
