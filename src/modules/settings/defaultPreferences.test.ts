import { beforeEach, describe, expect, it, vi } from "vitest";

// `store` is created at module load, so the plugin mock must be in place
// before `./store` is imported.
const entries = vi.hoisted(() => ({ value: [] as [string, unknown][] }));

vi.mock("@tauri-apps/plugin-store", () => ({
  LazyStore: class {
    entries = async () => entries.value;
    get = async () => undefined;
    set = async () => undefined;
    save = async () => undefined;
  },
  Store: class {},
}));
vi.mock("@tauri-apps/api/event", () => ({
  emit: async () => undefined,
  listen: async () => () => undefined,
}));

const REQUESTED_DEFAULTS = {
  terminalCursorBlink: true,
  showHidden: true,
  terminalCursorStyle: "block",
  terminalFontSize: 14,
  editorWordWrap: true,
  zoomLevel: 1.25,
  explorerGitDecorations: true,
} as const;

describe("Rex default configuration", () => {
  beforeEach(() => {
    entries.value = [];
    vi.resetModules();
  });

  it("ships the requested defaults", async () => {
    const { DEFAULT_PREFERENCES } = await import("./store");
    expect(DEFAULT_PREFERENCES).toMatchObject(REQUESTED_DEFAULTS);
  });

  it("applies to users who never stored a choice", async () => {
    const { loadPreferences } = await import("./store");
    expect(await loadPreferences()).toMatchObject(REQUESTED_DEFAULTS);
  });

  it("never overrides an explicit stored choice", async () => {
    entries.value = [
      ["terminalCursorBlink", false],
      ["zoomLevel", 1.0],
    ];
    const { loadPreferences } = await import("./store");
    const prefs = await loadPreferences();
    expect(prefs.terminalCursorBlink).toBe(false);
    expect(prefs.zoomLevel).toBe(1.0);
  });

  it("keeps the legacy showHiddenDirectories key winning over the default", async () => {
    entries.value = [["showHiddenDirectories", false]];
    const { loadPreferences } = await import("./store");
    expect((await loadPreferences()).showHidden).toBe(false);
  });
});
