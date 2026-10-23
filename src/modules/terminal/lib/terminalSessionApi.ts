import type { BlockMode } from "@/modules/terminal/block/lib/modeMachine";
import {
  disposeGhosttyBlocks,
  ensureGhosttyBlocks,
  ghosttyBlocks,
} from "@/modules/terminal/ghostty/ghosttyBlockSessions";
import { encodeRawKey } from "@/modules/terminal/ghostty/input/GhosttyInputController";
import {
  clearGhosttySession,
  disposeGhosttySession,
  focusGhosttySession,
  ghosttyCwdForLeaf,
  ghosttyFocusedLeaf,
  ghosttyLeafHasForegroundProcess,
  ghosttyLeafIdForPty,
  ghosttyModelForLeaf,
  ghosttyPtyIdForLeaf,
  ghosttySelectionForLeaf,
  hasGhosttySession,
  interruptGhosttySession,
  pasteIntoGhosttySession,
  pasteRawToGhosttySession,
  submitToGhosttySession,
  whenGhosttySessionReady,
  writeBytesToLeaf,
  writeToGhosttySession,
} from "@/modules/terminal/ghostty/useGhosttyTerminalSession";

export type { WatermarkState } from "@/modules/terminal/ghostty/ghosttyBlockSessions";

import type { WatermarkState } from "@/modules/terminal/ghostty/ghosttyBlockSessions";
import { forgetLeafPresentation } from "@/modules/terminal/lib/ptyPresentation";

export async function whenSessionReady(
  leafId: number,
  timeoutMs = 4_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const remaining = Math.max(0, deadline - Date.now());
    if (hasGhosttySession(leafId)) {
      await withTimeout(whenGhosttySessionReady(leafId), remaining);
      return;
    }
    await delay(Math.min(10, remaining));
  }
}

export function writeToSession(leafId: number, data: string): boolean {
  return writeToGhosttySession(leafId, data);
}

export function submitToLeaf(leafId: number, text: string): void {
  submitToGhosttySession(leafId, text);
}

export function interruptLeaf(leafId: number): void {
  interruptGhosttySession(leafId);
}

export function pasteIntoSession(leafId: number, text: string): boolean {
  return pasteIntoGhosttySession(leafId, text);
}

export function leafCwd(leafId: number): string | null {
  return ghosttyCwdForLeaf(leafId);
}

export function navigateFocusedBlocks(direction: -1 | 1): boolean {
  const leaf = ghosttyFocusedLeaf();
  return (
    leaf !== null &&
    (ghosttyBlocks(leaf)?.controller?.navigate(direction) ?? false)
  );
}

export function clearLeafBlockSelection(leafId: number): boolean {
  return ghosttyBlocks(leafId)?.controller?.clearSelection() ?? false;
}

export function leafGridSelection(leafId: number): string | null {
  return ghosttySelectionForLeaf(leafId);
}

export function getLeafBlockMode(leafId: number): BlockMode {
  return ghosttyBlocks(leafId)?.getMode() ?? "plain";
}

export function subscribeLeafBlockMode(
  leafId: number,
  callback: () => void,
): () => void {
  return ensureGhosttyBlocks(leafId).subscribeMode(callback);
}

export function setLeafInputFocus(
  leafId: number,
  callback: (() => void) | null,
): void {
  const state = callback ? ensureGhosttyBlocks(leafId) : ghosttyBlocks(leafId);
  if (state) state.focus = callback;
}

export function setLeafInputPaste(
  leafId: number,
  paste: ((text: string) => void) | null,
): void {
  const state = paste ? ensureGhosttyBlocks(leafId) : ghosttyBlocks(leafId);
  if (state) state.paste = paste;
}

export function setLeafInputKeyDown(
  leafId: number,
  handler: ((event: KeyboardEvent) => boolean) | null,
): void {
  const state = handler ? ensureGhosttyBlocks(leafId) : ghosttyBlocks(leafId);
  if (state) state.keyDown = handler;
}

export function focusLeafInput(leafId: number): void {
  const state = ghosttyBlocks(leafId);
  // The shell input is the keyboard surface for block terminals in every
  // mode (raw keys while a program runs), so prefer it whenever registered.
  if (state?.focus) state.focus();
  else focusGhosttySession(leafId);
}

/** Forwards one keydown to the leaf's PTY, encoded exactly like the grid
 *  surface used to (app-cursor sequences, ctrl codes). False when the key
 *  produces no input or no live session — lets CM handle it instead. */
export function sendRawKeyToLeaf(
  leafId: number,
  event: KeyboardEvent,
): boolean {
  const model = ghosttyModelForLeaf(leafId);
  if (!model) return false;
  const bytes = encodeRawKey(event, model);
  if (!bytes) return false;
  return writeBytesToLeaf(leafId, bytes);
}

/** Paste during raw mode: bracketed when the program asked for it, no \r. */
export function pasteRawToLeaf(leafId: number, text: string): boolean {
  return pasteRawToGhosttySession(leafId, text);
}

export function getLeafDraft(leafId: number): string {
  return ghosttyBlocks(leafId)?.draft ?? "";
}

export function setLeafDraft(leafId: number, text: string): void {
  const state = ghosttyBlocks(leafId);
  if (state) state.draft = text;
}

export function setLeafInputActivity(leafId: number, active: boolean): void {
  const blocks = ghosttyBlocks(leafId);
  if (!blocks || blocks.inputActive === active) return;
  blocks.inputActive = active;
  blocks.changed();
}

export function blockWatermarkState(leafId: number): WatermarkState {
  return ghosttyBlocks(leafId)?.watermark() ?? "hidden";
}

export function clearFocusedTerminal(): boolean {
  const ghosttyLeaf = ghosttyFocusedLeaf();
  if (ghosttyLeaf !== null) return clearGhosttySession(ghosttyLeaf);
  return false;
}

export function leafIdForPty(ptyId: number): number | null {
  return ghosttyLeafIdForPty(ptyId);
}

export function ptyIdForLeaf(leafId: number): number | null {
  return ghosttyPtyIdForLeaf(leafId);
}

export async function leafHasForegroundProcess(
  leafId: number,
): Promise<boolean> {
  return ghosttyLeafHasForegroundProcess(leafId);
}

export function disposeSession(leafId: number): void {
  disposeGhosttySession(leafId);
  disposeGhosttyBlocks(leafId);
  forgetLeafPresentation(leafId);
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function withTimeout(
  promise: Promise<unknown>,
  timeoutMs: number,
): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      promise,
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
