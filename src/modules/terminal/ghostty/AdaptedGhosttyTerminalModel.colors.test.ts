import { readFile } from "node:fs/promises";
import { RexGhostty } from "@rex/ghostty-core/adapted";
import { beforeAll, describe, expect, it } from "vitest";
import { AdaptedGhosttyTerminalModel } from "./AdaptedGhosttyTerminalModel";

/**
 * Locks the runtime color chain end to end: the theme palette handed to
 * `setColors` must reach the parsed cells, so SGR output (`ls --color`, git,
 * grep) renders the palette's real colors instead of falling back to default
 * foreground. This is the model layer above the raw terminal test in
 * AdaptedGhostty.test.ts.
 */
describe("AdaptedGhosttyTerminalModel palette colors", () => {
  let scalarBytes: ArrayBuffer;

  beforeAll(async () => {
    const file = await readFile(
      new URL(
        "../../../../packages/ghostty-core/adapted/ghostty-vt-scalar.wasm",
        import.meta.url,
      ),
    );
    scalarBytes = Uint8Array.from(file).buffer;
  });

  it("renders SGR palette colors through the theme palette", async () => {
    const core = await RexGhostty.loadBytes(scalarBytes);
    // Dark-theme ANSI hues (globals.css defaults) so the assertion proves the
    // configured palette, not a test accident.
    const palette = [
      0x3f3f3f, 0xe35d5d, 0x6ec48f, 0xe0b34d, 0x6ea8e8, 0xb98ce0, 0x5fc6cc,
      0xd8d8d8, 0x6e6e6e, 0xf27f7f, 0x85d9a4, 0xeec469, 0x8dbcf2, 0xcba5ee,
      0x7bdbe0, 0xf7f7f7,
    ];
    const model = new AdaptedGhosttyTerminalModel(core, {
      backend: "ghostty-webgpu",
      cols: 40,
      rows: 6,
    });
    try {
      model.setColors(0xd8d8d8, 0x17171a, 0xd8d8d8, palette);
      model.write(
        new TextEncoder().encode(
          "\x1b[31mR\x1b[32mG\x1b[0mw\x1b[1;38;2;77;166;255mD\x1b[0mF",
        ),
      );
      model.consumeDamage();
      const cells = model.renderCells();

      expect(cells.foregroundPacked(0)).toBe(0xe35d5d);
      expect(cells.foregroundPacked(1)).toBe(0x6ec48f);
      // Reset returns the theme foreground, not black.
      expect(cells.foregroundPacked(2)).toBe(0xd8d8d8);
      // Directory blue is emitted as truecolor so it stays unmistakable even
      // when the host terminal palette uses a pale/white ANSI blue.
      expect(cells.foregroundPacked(3)).toBe(0x4da6ff);
      expect(cells.foregroundPacked(4)).toBe(0xd8d8d8);
    } finally {
      model.dispose();
    }
  });

  it("seeds every supported shell with a high-contrast truecolor directory style", async () => {
    const scripts = await Promise.all(
      ["bashrc.bash", "zshrc.zsh", "init.fish"].map((name) =>
        readFile(
          new URL(
            `../../../../src-tauri/src/modules/pty/scripts/${name}`,
            import.meta.url,
          ),
          "utf8",
        ),
      ),
    );
    for (const script of scripts)
      expect(script).toContain("di=01;38;2;77;166;255");
  });
});
