import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KeyBinding } from "../shortcuts";

const prefsMock = vi.hoisted(() => ({
  shortcuts: {} as Record<string, KeyBinding[]>,
}));

vi.mock("@/modules/settings/preferences", () => ({
  usePreferencesStore: {
    getState: () => ({ shortcuts: prefsMock.shortcuts }),
  },
}));

import { shortcutLabel } from "./shortcutLabel";

beforeEach(() => {
  prefsMock.shortcuts = {};
});

describe("shortcutLabel", () => {
  it("formats the default binding when there is no user override", () => {
    // tab.new defaults to Ctrl+T.
    expect(shortcutLabel("tab.new")).toBe("Ctrl T");
  });

  it("prefers a user override over the default binding", () => {
    prefsMock.shortcuts = {
      "tab.new": [{ ctrl: true, shift: true, key: "k" }],
    };
    expect(shortcutLabel("tab.new")).toBe("Ctrl Shift K");
  });
});
