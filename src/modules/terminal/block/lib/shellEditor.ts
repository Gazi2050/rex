import "@/modules/terminal/block/block.css";

import { buildTerminalTheme } from "@/styles/terminalTheme";
import {
  defaultKeymap,
  history,
  historyKeymap,
  insertNewline,
} from "@codemirror/commands";
import {
  HighlightStyle,
  StreamLanguage,
  syntaxHighlighting,
} from "@codemirror/language";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import { Compartment, EditorState, Prec } from "@codemirror/state";
import {
  crosshairCursor,
  drawSelection,
  EditorView,
  keymap,
  placeholder,
  rectangularSelection,
  tooltips,
} from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import { historyPopover } from "./historyPopover";
import { inlineSuggestion } from "./inlineSuggest";

const shellLanguage = StreamLanguage.define(shell);

export type ShellEditorOptions = {
  parent: HTMLElement;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  placeholderText?: string;
  onSubmit: (text: string) => void;
  onInterrupt: () => void;
  /** Escape with no completion open; return true when handled. */
  onEscape?: () => boolean;
  /**
   * Raw-keyboard mode for a running foreground program: keydowns are
   * forwarded to the PTY instead of editing the document. `rawKey` returns
   * true when the key was consumed; `rawMode()` must return true exactly
   * when `rawKey` is active so the submit bindings can defer to it.
   */
  rawMode?: () => boolean;
  rawKey?: (event: KeyboardEvent) => boolean;
  rawPaste?: (text: string) => boolean;
  /** Fish-style full-command autosuggestion for the current input line. */
  suggest?: (line: string) => Promise<string | null>;
  /** Recency-ranked history for the ArrowUp popover (Ctrl-R style). */
  historyList?: (query: string, limit: number) => Promise<string[]>;
  /** Fires on every edit with the current text (used to gate empty-state UI). */
  onChange?: (text: string) => void;
};

export type ShellEditorHandle = {
  readonly view: EditorView;
  focus(): void;
  getValue(): string;
  setValue(text: string): void;
  clear(): void;
  setEditable(editable: boolean): void;
  retheme(fontFamily: string, fontSize: number, fontWeight: string): void;
  destroy(): void;
};

// Map legacy-shell token styles to the live terminal palette so the input
// line is colored by the same theme the terminal grid uses.
function highlightStyle(): HighlightStyle {
  const c = buildTerminalTheme();
  const fg = c.foreground ?? "inherit";
  return HighlightStyle.define([
    { tag: t.keyword, color: c.magenta ?? fg },
    { tag: t.string, color: c.green ?? fg },
    { tag: t.comment, color: c.brightBlack ?? fg, fontStyle: "italic" },
    { tag: [t.number, t.bool, t.atom], color: c.yellow ?? fg },
    { tag: t.standard(t.variableName), color: c.cyan ?? fg },
    { tag: t.special(t.variableName), color: c.blue ?? fg },
    { tag: t.variableName, color: fg },
    { tag: t.operator, color: c.brightBlack ?? fg },
  ]);
}

function baseTheme(fontFamily: string, fontSize: number, fontWeight: string) {
  const c = buildTerminalTheme();
  const caret = c.cursor ?? c.foreground ?? "currentColor";
  return EditorView.theme({
    "&": {
      backgroundColor: "transparent",
      color: c.foreground ?? "inherit",
      fontSize: `${fontSize}px`,
      minHeight: "1.5em",
    },
    ".cm-content": {
      padding: "0 2px",
      fontFamily,
      fontWeight,
      caretColor: caret,
      lineHeight: "1.5",
      minHeight: "1.5em",
    },
    ".cm-placeholder": { color: "rgba(128,128,128,0.5)" },
    ".cm-ghost": { opacity: "0.4" },
    ".cm-line": { padding: "0", lineHeight: "1.5", minHeight: "1.5em" },
    ".cm-scroller": {
      fontFamily,
      lineHeight: "1.5",
      overflow: "auto",
      minHeight: "1.5em",
      maxHeight: "200px",
      // Reset the global `scrollbar-width: none` kill: without `auto` here,
      // Chromium takes the standard-property path and ignores the webkit
      // pseudo rules below (and `none` wins, bar invisible).
      scrollbarWidth: "auto",
    },
    // Grabber-only bar for long pastes. Webkit pseudo rules only — setting
    // standard scrollbar-* here would make WebView2 ignore these and paint a
    // native strip instead (Chromium disables the pseudos when they're set).
    ".cm-scroller::-webkit-scrollbar": {
      width: "6px",
      height: "6px",
      display: "block",
    },
    ".cm-scroller::-webkit-scrollbar-track": { background: "transparent" },
    ".cm-scroller::-webkit-scrollbar-thumb": {
      borderRadius: "999px",
      background: "rgba(128,128,128,0.35)",
    },
    ".cm-scroller::-webkit-scrollbar-thumb:hover": {
      background: "rgba(128,128,128,0.55)",
    },
    "&.cm-focused": { outline: "none" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: caret },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      { backgroundColor: c.selectionBackground ?? "rgba(255,255,255,0.15)" },
    ".cm-tooltip": {
      backgroundColor: "var(--popover)",
      color: "var(--popover-foreground)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
    },
  });
}

export function createShellEditor(opts: ShellEditorOptions): ShellEditorHandle {
  const themeComp = new Compartment();
  const highlightComp = new Compartment();
  const editableComp = new Compartment();

  const clear = (view: EditorView) =>
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: "" },
    });

  const submitKeys = Prec.highest(
    keymap.of([
      {
        key: "Enter",
        run: (view) => {
          // Enter always runs the line (Tab accepts the ghost suggestion).
          // Predictable shell UX — except in raw mode, where the key belongs
          // to the running program (the raw keydown handler consumes it).
          if (opts.rawMode?.()) return false;
          if (view.state.readOnly) return false;
          const text = view.state.doc.toString();
          if (!text.trim()) return true;
          opts.onSubmit(text);
          clear(view);
          return true;
        },
      },
      {
        key: "Shift-Enter",
        run: (view) => (opts.rawMode?.() ? false : insertNewline(view)),
      },
      {
        key: "Ctrl-c",
        run: (view) => {
          opts.onInterrupt();
          clear(view);
          return true;
        },
        preventDefault: true,
      },
    ]),
  );

  const rawKeys =
    opts.rawKey || opts.rawPaste
      ? Prec.highest(
          EditorView.domEventHandlers({
            keydown: (event) => {
              // Let the browser's paste flow reach the paste handler.
              if ((event.ctrlKey || event.metaKey) && event.key === "v")
                return false;
              return opts.rawKey?.(event) ?? false;
            },
            paste: (event) => {
              const text = event.clipboardData?.getData("text/plain") ?? "";
              if (!text) return false;
              return opts.rawPaste?.(text) ?? false;
            },
          }),
        )
      : [];

  const state = EditorState.create({
    doc: "",
    extensions: [
      history(),
      drawSelection({ cursorBlinkRate: 1100 }),
      rectangularSelection(),
      crosshairCursor(),
      EditorState.allowMultipleSelections.of(true),
      EditorView.lineWrapping,
      tooltips({ parent: document.body }),
      shellLanguage,
      highlightComp.of(syntaxHighlighting(highlightStyle())),
      rawKeys,
      ...(opts.suggest ? inlineSuggestion(opts.suggest) : []),
      ...(opts.historyList ? historyPopover(opts.historyList) : []),
      placeholder(opts.placeholderText ?? "Run a command"),
      ...(opts.onChange
        ? [
            EditorView.updateListener.of((u) => {
              if (u.docChanged) opts.onChange?.(u.state.doc.toString());
            }),
          ]
        : []),
      submitKeys,
      keymap.of([...defaultKeymap, ...historyKeymap]),
      ...(opts.onEscape
        ? [
            Prec.lowest(
              keymap.of([
                { key: "Escape", run: () => opts.onEscape?.() ?? false },
              ]),
            ),
          ]
        : []),
      editableComp.of([
        EditorView.editable.of(true),
        EditorState.readOnly.of(false),
      ]),
      themeComp.of(baseTheme(opts.fontFamily, opts.fontSize, opts.fontWeight)),
    ],
  });

  const view = new EditorView({ state, parent: opts.parent });

  return {
    view,
    focus: () => view.focus(),
    getValue: () => view.state.doc.toString(),
    setValue: (text) =>
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: text },
        selection: { anchor: text.length },
      }),
    clear: () => clear(view),
    setEditable: (editable) =>
      view.dispatch({
        effects: editableComp.reconfigure([
          EditorView.editable.of(editable),
          EditorState.readOnly.of(!editable),
        ]),
      }),
    retheme: (fontFamily, fontSize, fontWeight) =>
      view.dispatch({
        effects: [
          themeComp.reconfigure(baseTheme(fontFamily, fontSize, fontWeight)),
          highlightComp.reconfigure(syntaxHighlighting(highlightStyle())),
        ],
      }),
    destroy: () => view.destroy(),
  };
}
