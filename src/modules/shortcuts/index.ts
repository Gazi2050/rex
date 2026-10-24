export type { ShortcutId } from "./shortcuts";
export {
  useGlobalShortcuts,
  type ShortcutHandlers,
} from "./lib/useGlobalShortcuts";
export { useShortcutLabel } from "./lib/useShortcutLabel";
export { shouldDisablePaneSwapShortcut } from "./lib/shortcutScope";
