import { describe, expect, it } from "vitest";
import { cleanPathToken, wordRangeAt } from "./terminalPathHit";

describe("wordRangeAt", () => {
  it("expands to whitespace boundaries around the clicked column", () => {
    const line = "src  README.md package.json";
    expect(wordRangeAt(line, 1)).toEqual({ start: 0, end: 3 });
    expect(wordRangeAt(line, 6)).toEqual({ start: 5, end: 14 });
    expect(wordRangeAt(line, 15)).toEqual({ start: 15, end: 27 });
  });

  it("returns null on whitespace and out-of-range columns", () => {
    expect(wordRangeAt("src dist", 3)).toBeNull();
    expect(wordRangeAt("src", 10)).toBeNull();
    expect(wordRangeAt("", 0)).toBeNull();
  });
});

describe("cleanPathToken", () => {
  it("strips wrapped punctuation and trailing separators", () => {
    expect(cleanPathToken('"src/modules"')).toBe("src/modules");
    expect(cleanPathToken("(package.json),")).toBe("package.json");
    expect(cleanPathToken("./scripts/dev.sh:")).toBe("./scripts/dev.sh");
    expect(cleanPathToken("[src]")).toBe("src");
  });

  it("drops tiny leftovers so random glyphs never stat", () => {
    expect(cleanPathToken("--")).toBe("");
    expect(cleanPathToken("a")).toBe("");
    expect(cleanPathToken("src")).toBe("src");
  });
});
