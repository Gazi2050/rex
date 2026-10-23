import { describe, expect, it } from "vitest";
import { formatDuration } from "./formatDuration";

describe("formatDuration", () => {
  it("shows sub-millisecond runs instead of nothing", () => {
    expect(formatDuration(0)).toBe("<1ms");
  });

  it("formats milliseconds, seconds, minutes and hours", () => {
    expect(formatDuration(23)).toBe("23ms");
    expect(formatDuration(1500)).toBe("1.5s");
    expect(formatDuration(15_000)).toBe("15s");
    expect(formatDuration(65_000)).toBe("1m 5s");
    expect(formatDuration(120_000)).toBe("2m");
    expect(formatDuration(3_600_000)).toBe("1h");
    expect(formatDuration(5_400_000)).toBe("1h 30m");
  });

  it("returns null for unusable values", () => {
    expect(formatDuration(-1)).toBeNull();
    expect(formatDuration(Number.NaN)).toBeNull();
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBeNull();
  });
});
