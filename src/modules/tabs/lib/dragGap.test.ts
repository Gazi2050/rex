import { describe, expect, it } from "vitest";
import {
  type DragGapEntry,
  dragFinalIndex,
  dragGapForIndex,
  dragGapIndex,
  dragSlotLefts,
} from "./dragGap";
import { reorderTabsByGap, type Tab } from "./useTabs";

// Full order: A(1) | B(2, dragged) | C(3), each 100px wide.
const strip: DragGapEntry[] = [
  { id: 1, left: 0, width: 100 },
  { id: 2, left: 100, width: 100 },
  { id: 3, left: 200, width: 100 },
];

describe("dragGapIndex", () => {
  it("ignores the dragged tab and keeps its current slot", () => {
    expect(dragGapIndex(strip, 120, 2)).toBe(2);
    expect(dragGapIndex(strip, 180, 2)).toBe(2);
  });

  it("does not use the dragged tab's own midpoint", () => {
    expect(dragGapIndex(strip, 140, 2)).toBe(2);
  });

  it("moves before the first tab", () => {
    expect(dragGapIndex(strip, 20, 2)).toBe(0);
  });

  it("returns a no-op gap left of the next tab", () => {
    expect(dragGapIndex(strip, 60, 2)).toBe(2);
  });

  it("moves past the last tab", () => {
    expect(dragGapIndex(strip, 280, 2)).toBe(3);
    expect(dragGapIndex(strip, 999, 2)).toBe(3);
  });

  it("handles a single dragged tab", () => {
    expect(dragGapIndex([{ id: 7, left: 0, width: 100 }], 50, 7)).toBe(1);
  });
});

describe("drag drop target", () => {
  const term = (id: number): Tab =>
    ({
      id,
      kind: "terminal",
      spaceId: "a",
      title: "shell",
      paneTree: { kind: "leaf", id: id * 10 },
      activeLeafId: id * 10,
    }) as Tab;
  const ids = [11, 22, 33, 44];

  it("lands the tab on every simulated slot", () => {
    for (let fromIndex = 0; fromIndex < ids.length; fromIndex++) {
      for (let toIndex = 0; toIndex < ids.length; toIndex++) {
        const simulated = [...ids];
        simulated.splice(fromIndex, 1);
        simulated.splice(toIndex, 0, ids[fromIndex]);
        const reordered = reorderTabsByGap(
          ids.map(term),
          ids[fromIndex],
          dragGapForIndex(toIndex, fromIndex),
        );
        expect(reordered.map((t) => t.id)).toEqual(simulated);
      }
    }
  });

  it("maps a hovered gap back to its final index", () => {
    // gaps 0..3 for a tab currently at index 1
    expect([0, 1, 2, 3].map((g) => dragFinalIndex(g, 1))).toEqual([0, 1, 1, 2]);
  });

  it("rebuilds slot lefts from widths and the measured gap", () => {
    const lefts = dragSlotLefts(
      [33, 11, 22],
      new Map([
        [11, 100],
        [22, 50],
        [33, 20],
      ]),
      10,
      2,
    );
    expect([...lefts]).toEqual([
      [33, 10],
      [11, 32],
      [22, 134],
    ]);
  });
});
