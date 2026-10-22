import { describe, expect, it } from "vitest";
import { DEFAULT_PREFERENCES, coerceTerminalCursorStyle } from "./store";

describe("coerceTerminalCursorStyle", () => {
  it("keeps terminal cursor styles", () => {
    for (const style of ["bar", "block", "underline"]) {
      expect(coerceTerminalCursorStyle(style)).toBe(style);
    }
  });

  it("falls back to the default for invalid persisted values", () => {
    const fallback = DEFAULT_PREFERENCES.terminalCursorStyle;
    expect(fallback).toBe("block");
    for (const value of ["outline", 1, null]) {
      expect(coerceTerminalCursorStyle(value)).toBe(fallback);
    }
  });
});
