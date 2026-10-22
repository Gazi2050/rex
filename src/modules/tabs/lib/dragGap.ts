export type DragGapEntry = {
  id: number;
  left: number;
  width: number;
};

/**
 * Gap index (0..entries.length) for a live tab drag, in strip order.
 *
 * The dragged tab is skipped: its rendered rect is transformed to follow the
 * cursor, so feeding it back into the hit test would make the target slot chase
 * itself. The returned index is the first remaining tab whose midpoint is right
 * of `x`; when the dragged tab already sits on that gap, reorderTabsByGap
 * treats it as a no-op.
 */
export function dragGapIndex(
  entries: DragGapEntry[],
  x: number,
  draggedId: number,
): number {
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry.id === draggedId) continue;
    if (x < entry.left + entry.width / 2) return i;
  }
  return entries.length;
}

/** Final index of the dragged tab when the cursor asked for `gap`. */
export function dragFinalIndex(gap: number, index: number): number {
  return gap > index ? gap - 1 : gap;
}

/**
 * Gap index in the *original* strip order that drops the tab at `index`.
 * `reorderTabsByGap` reads the gap with the dragged tab still in the array, so
 * anything to its right shifts by one.
 */
export function dragGapForIndex(index: number, fromIndex: number): number {
  return index < fromIndex ? index : index + 1;
}

/** Left edge of every slot for `order`, measured from the strip origin. */
export function dragSlotLefts(
  order: number[],
  widths: Map<number, number>,
  origin: number,
  gapPx: number,
): Map<number, number> {
  const lefts = new Map<number, number>();
  let x = origin;
  for (const id of order) {
    lefts.set(id, x);
    x += (widths.get(id) ?? 0) + gapPx;
  }
  return lefts;
}
