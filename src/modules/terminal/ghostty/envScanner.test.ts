import { describe, expect, it, vi } from "vitest";
import { createEnvScanner } from "./envScanner";

const enc = (s: string) => new TextEncoder().encode(s);
const ST = "\x1b\\";
const env = (body: string) => `\x1b]6637;${body}${ST}`;
const bel = (body: string) => `\x1b]6637;${body}\x07`;
const text = (out: Uint8Array) => new TextDecoder().decode(out);

describe("envScanner", () => {
  it("strips node + branch markers and passes everything else through", () => {
    const onEnv = vi.fn();
    const scanner = createEnvScanner(onEnv);
    const out = scanner.feed(
      enc(`pre ${env("node=v22.19.0")} mid ${env("branch=feature%2Fx")} post`),
    );
    expect(text(out)).toBe("pre  mid  post");
    expect(onEnv).toHaveBeenNthCalledWith(1, { node: "v22.19.0" });
    expect(onEnv).toHaveBeenNthCalledWith(2, { branch: "feature/x" });
  });

  it("accepts BEL as terminator", () => {
    const onEnv = vi.fn();
    const scanner = createEnvScanner(onEnv);
    expect(text(scanner.feed(enc(`a${bel("node=v20.11.0")}b`)))).toBe("ab");
    expect(onEnv).toHaveBeenCalledWith({ node: "v20.11.0" });
  });

  it("reassembles a marker split across chunk boundaries", () => {
    const onEnv = vi.fn();
    const scanner = createEnvScanner(onEnv);
    const seq = env("node=v24.18.0");
    let out = scanner.feed(enc("hello "));
    // Split at every byte offset to cover torn ESC/ST pairs.
    out = Buffer.concat([
      out,
      scanner.feed(enc(seq.slice(0, 4))),
      scanner.feed(enc(seq.slice(4, 9))),
      scanner.feed(enc(seq.slice(9))),
      scanner.feed(enc(" tail")),
    ]);
    expect(text(out)).toBe("hello  tail");
    expect(onEnv).toHaveBeenCalledWith({ node: "v24.18.0" });
  });

  it("holds back a bare ESC tail and still emits later data", () => {
    const onEnv = vi.fn();
    const scanner = createEnvScanner(onEnv);
    let out = scanner.feed(enc("run "));
    out = Buffer.concat([
      out,
      scanner.feed(enc("\x1b")),
      scanner.feed(enc("n")),
    ]);
    expect(text(out)).toBe("run \x1bn");
    expect(onEnv).not.toHaveBeenCalled();
  });

  it("drops an unterminated overlong marker instead of printing it", () => {
    const onEnv = vi.fn();
    const scanner = createEnvScanner(onEnv);
    const out = scanner.feed(
      enc(`ok ${`\x1b]6637;node=${"x".repeat(1024)}`}end`),
    );
    expect(text(out)).toBe("ok ");
    expect(onEnv).not.toHaveBeenCalled();
  });

  it("ignores malformed bodies", () => {
    const onEnv = vi.fn();
    const scanner = createEnvScanner(onEnv);
    const out = scanner.feed(
      enc(`${env("novalue")} ${env("nope=x")} ${env("node=")}`),
    );
    expect(text(out)).toBe("  ");
    expect(onEnv).not.toHaveBeenCalled();
  });

  it("leaves other OSC sequences untouched", () => {
    const onEnv = vi.fn();
    const scanner = createEnvScanner(onEnv);
    const raw = "\x1b]7;file://host/tmp\x1b\\\x1b]133;A\x1b\\";
    expect(text(scanner.feed(enc(raw)))).toBe(raw);
    expect(onEnv).not.toHaveBeenCalled();
  });
});
