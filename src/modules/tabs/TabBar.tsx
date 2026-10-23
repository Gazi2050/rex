import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { AgentIcon } from "@/modules/agents/lib/agentIcon";
import {
  ALL_LANGUAGES,
  EXPOSED_LANGUAGES,
} from "@/modules/editor/lib/languageDefinitions";
import { resolveDisplayName } from "@/modules/editor/lib/languageResolver";
import { FileIcon } from "@/modules/explorer/FileIcon";
import {
  leafIds,
  ptyIdForLeaf,
  useAgentActivityStore,
} from "@/modules/terminal";
import {
  ArrowRight01Icon,
  Cancel01Icon,
  CancelCircleIcon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  ComputerTerminal02Icon,
  GitCompareIcon,
  Globe02Icon,
  IncognitoIcon,
  Message02Icon,
  PencilEdit02Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useShallow } from "zustand/react/shallow";
import {
  dragFinalIndex,
  dragGapForIndex,
  dragGapIndex,
  dragSlotLefts,
} from "./lib/dragGap";
import { selectTabAgentStatus } from "./lib/tabAgentStatus";
import { labelFor } from "./lib/tabLabel";
import type { EditorTab, Tab, TerminalTab } from "./lib/useTabs";
import { NewTabMenu } from "./NewTabMenu";

type Props = {
  tabs: Tab[];
  activeId: number;
  onSelect: (id: number) => void;
  onNew: () => void;
  onNewEditor: () => void;
  onNewGitGraph: () => void;
  onClose: (id: number) => void;
  /** Chrome-style: close every tab to the right of the given tab. */
  onCloseTabsToRight: (id: number) => void;
  /** Chrome-style: close every tab except the given tab. */
  onCloseOtherTabs: (id: number) => void;
  /** Pin (promote) a preview tab to persistent on double-click. */
  onPin: (id: number) => void;
  /** Set a terminal tab's custom label; empty string resets to default. */
  onRename: (id: number, title: string) => void;
  /** Move a dragged tab to a new position (insertion gap index 0..tabs.length). */
  onReorder: (fromId: number, toGapIndex: number) => void;
  onOverrideLanguage?: (id: number, lang: string | null) => void;
  compact?: boolean;
};

/** Mutable drag bookkeeping; lives in a ref so moves never re-render. */
type DragState = {
  pointerId: number;
  startX: number;
  /** Strip scroll at grab time, so wheel-scrolling mid-drag keeps the tab under the cursor. */
  startScroll: number;
  fromId: number;
  /** Index of the dragged tab in the real strip order (the index on drop). */
  fromIndex: number;
  active: boolean;
  el: HTMLElement | null;
  /** Layout left of the grabbed tab, which never moves while dragging. */
  slot0: number;
  lastTx: number;
  /** Left edge of the first slot; slots are rebuilt from this origin. */
  origin: number;
  /** Measured inter-tab gap, so the simulated slots match the real layout. */
  gapPx: number;
  /** Simulated strip order; the dragged tab's slot is the hole it will drop into. */
  order: number[];
  /** Index of `fromId` inside `order`. */
  index: number;
  widths: Map<number, number>;
  origLefts: Map<number, number>;
  lefts: Map<number, number>;
};

const tabEls = (root: HTMLElement | null) =>
  Array.from(root?.querySelectorAll<HTMLElement>("[data-tab-id]") ?? []);

const tabElFor = (root: HTMLElement | null, id: number) =>
  root?.querySelector<HTMLElement>(`[data-tab-id="${id}"]`) ?? null;

const clearTabTransforms = (root: HTMLElement | null) => {
  for (const el of tabEls(root)) {
    el.style.transition = "";
    el.style.transform = "";
  }
};

const settleTab = (el: HTMLElement | null, fromX: number) => {
  if (!el || Math.abs(fromX) < 0.5) return;
  // ponytail: fixed durations; WAAPI cannot read the --dur-* variables.
  el.animate([{ transform: `translateX(${fromX}px)` }, { transform: "none" }], {
    duration: 120,
    easing: "cubic-bezier(0.2, 0, 0, 1)",
  });
};

// Rebuild the simulated slots from the measured widths, then slide every
// non-dragged tab towards its new one. CSS transitions do the easing, so a
// crossing costs a handful of style writes and nothing re-renders.
const paintSimulation = (root: HTMLElement | null, st: DragState) => {
  st.lefts = dragSlotLefts(st.order, st.widths, st.origin, st.gapPx);
  for (const id of st.order) {
    if (id === st.fromId) continue;
    const el = tabElFor(root, id);
    if (!el) continue;
    const shift = (st.lefts.get(id) ?? 0) - (st.origLefts.get(id) ?? 0);
    el.style.transform = shift === 0 ? "" : `translateX(${shift}px)`;
  }
};

export function TabBar({
  tabs,
  activeId,
  onSelect,
  onNew,
  onNewEditor,
  onNewGitGraph,
  onClose,
  onCloseTabsToRight,
  onCloseOtherTabs,
  onPin,
  onRename,
  onReorder,
  onOverrideLanguage,
  compact,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  // A drag reorders a local copy of the strip (`order`) and only commits the
  // real reorder on drop: no React work per crossing, so the terminal and the
  // rest of the app never re-render mid-drag.
  const drag = useRef<DragState | null>(null);
  // Set when the drop committed a reorder: the layout effect below plays the
  // settle from where the cursor released.
  const settle = useRef<{ id: number; fromX: number } | null>(null);
  const simActive = useRef(false);

  // Play the enter animation only for tabs opened after the first paint, never
  // the restored set and never on switch/reorder (triggers are keyed, so they
  // don't remount then). The ref is seeded with the initial ids on first render.
  const seenRef = useRef<Set<number> | null>(null);
  const firstRender = seenRef.current === null;
  let seen = seenRef.current;
  if (seen === null) {
    seen = new Set(tabs.map((t) => t.id));
    seenRef.current = seen;
  }
  useEffect(() => {
    seenRef.current = new Set(tabs.map((t) => t.id));
  }, [tabs]);

  // Single shared pill slides to the active tab instead of each tab toggling
  // its own background. Measured relative to the list (its offsetParent) so it
  // scrolls with the strip for free; transform/width only, no layout on siblings.
  const [pill, setPill] = useState<{ left: number; width: number } | null>(
    null,
  );
  const [pillReady, setPillReady] = useState(false);

  const measurePill = useCallback(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      '[data-tab-active="true"]',
    );
    setPill(el ? { left: el.offsetLeft, width: el.offsetWidth } : null);
  }, []);

  useLayoutEffect(() => {
    measurePill();
  }, [measurePill, activeId, tabs]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const ro = new ResizeObserver(measurePill);
    ro.observe(list);
    return () => ro.disconnect();
  }, [measurePill]);

  // Hold the transition off until the pill is first placed, so it never slides
  // in from the origin on mount.
  useEffect(() => {
    if (pill && !pillReady) {
      const id = requestAnimationFrame(() => setPillReady(true));
      return () => cancelAnimationFrame(id);
    }
  }, [pill, pillReady]);

  // Pointer x in the strip's layout space. offsetLeft/offsetWidth are used for
  // the hit test because they ignore the dragged tab's transform; the ratio
  // converts client pixels into the same space the offsets live in (app zoom).
  const stripX = (clientX: number) => {
    const list = listRef.current;
    if (!list) return clientX;
    const rect = list.getBoundingClientRect();
    const scale = rect.width / list.offsetWidth || 1;
    return (clientX - rect.left) / scale;
  };

  const finishDrag = (currentTarget: HTMLElement, commit: boolean) => {
    const st = drag.current;
    if (!st) return;
    if (currentTarget.hasPointerCapture?.(st.pointerId)) {
      currentTarget.releasePointerCapture(st.pointerId);
    }
    drag.current = null;
    setDraggingId(null);
    document.body.style.userSelect = "";
    if (!st.active) return;

    const moved = st.index !== st.fromIndex;
    // Visual offset from the slot the tab lands in: the layout jumps to the
    // simulated order on drop, and the settle starts from where it was.
    const fromX = st.slot0 + st.lastTx - (st.lefts.get(st.fromId) ?? st.slot0);
    if (commit && moved) {
      // Real layout arrives in the next commit; the layout effect below clears
      // the simulation and settles from `fromX` in that same frame.
      settle.current = { id: st.fromId, fromX };
      onReorder(st.fromId, dragGapForIndex(st.index, st.fromIndex));
      return;
    }
    simActive.current = false;
    clearTabTransforms(scrollRef.current);
    if (commit) settleTab(st.el, fromX);
  };

  // After a committing drop, the reordered layout has just been committed with
  // the simulation transforms still on. Clear them and settle the tab before
  // paint, so nothing flashes back to the old slot.
  useLayoutEffect(() => {
    if (drag.current) return;
    if (simActive.current) {
      simActive.current = false;
      clearTabTransforms(scrollRef.current);
    }
    const s = settle.current;
    if (!s) return;
    settle.current = null;
    settleTab(tabElFor(scrollRef.current, s.id), s.fromX);
  }, [tabs]);

  // Horizontal wheel scroll without holding shift.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      if (el.scrollWidth <= el.clientWidth) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Keep the active tab visible after selection / open.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const active = el.querySelector<HTMLElement>(`[data-tab-id="${activeId}"]`);
    active?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeId]);

  return (
    <div
      ref={scrollRef}
      data-tauri-drag-region
      className="min-w-0 flex-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="flex w-max items-center gap-0.5">
        <Tabs
          value={String(activeId)}
          onValueChange={(v) => onSelect(Number(v))}
        >
          <TabsList
            ref={listRef}
            className="relative h-7 w-max gap-0.5 bg-transparent p-0"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute left-0 top-1/2 h-7 rounded-md bg-foreground/[0.07] shadow-sm ring-1 ring-inset ring-foreground/[0.05]"
              style={
                // Hidden while the active tab is dragged: the lifted tab draws
                // its own surface, so the pill would just ghost the empty slot.
                pill && draggingId !== activeId
                  ? {
                      width: pill.width,
                      transform: `translate(${pill.left}px, -50%)`,
                      transitionProperty: pillReady
                        ? "transform, width"
                        : "none",
                      transitionDuration: "var(--dur-base)",
                      transitionTimingFunction: "var(--ease-premium)",
                    }
                  : { opacity: 0 }
              }
            />
            {tabs.map((t, i) => {
              const isPreview =
                (t.kind === "editor" || t.kind === "git-diff") && t.preview;
              const isActive = t.id === activeId;
              const isNew = !firstRender && !seen.has(t.id);

              // While renaming, render a non-button cell so the <input> is not
              // nested inside the trigger <button> (invalid HTML, and WebKit
              // blocks focus/selection on inputs inside buttons).
              if (editingId === t.id && t.kind === "terminal") {
                return (
                  <Fragment key={t.id}>
                    <div
                      data-tab-id={t.id}
                      className={cn(
                        "flex h-7 shrink-0 items-center gap-1.5 rounded-md bg-accent text-xs text-foreground",
                        compact ? "px-1.5" : "px-2",
                      )}
                    >
                      <TabIcon tab={t} />
                      <TabRenameInput
                        initial={labelFor(t)}
                        onCommit={(value) => {
                          onRename(t.id, value);
                          setEditingId(null);
                        }}
                        onCancel={() => setEditingId(null)}
                      />
                    </div>
                  </Fragment>
                );
              }

              const trigger = (
                <TabsTrigger
                  value={String(t.id)}
                  data-tab-id={t.id}
                  data-tab-active={isActive ? "true" : undefined}
                  onPointerDown={(e) => {
                    if (e.button !== 0) return;
                    if ((e.target as HTMLElement).closest("[data-no-drag]"))
                      return;
                    drag.current = {
                      pointerId: e.pointerId,
                      startX: e.clientX,
                      startScroll: scrollRef.current?.scrollLeft ?? 0,
                      fromId: t.id,
                      fromIndex: 0,
                      active: false,
                      el: null,
                      slot0: 0,
                      lastTx: 0,
                      origin: 0,
                      gapPx: 0,
                      order: [],
                      index: 0,
                      widths: new Map(),
                      origLefts: new Map(),
                      lefts: new Map(),
                    };
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  onPointerMove={(e) => {
                    const st = drag.current;
                    if (!st || st.pointerId !== e.pointerId) return;
                    if (!st.active) {
                      if (Math.abs(e.clientX - st.startX) < 4) return;
                      st.active = true;
                      st.el = e.currentTarget;
                      const els = tabEls(scrollRef.current);
                      for (const el of els) {
                        const id = Number(el.dataset.tabId);
                        st.order.push(id);
                        st.widths.set(id, el.offsetWidth);
                        st.origLefts.set(id, el.offsetLeft);
                      }
                      st.fromIndex = Math.max(0, st.order.indexOf(st.fromId));
                      st.index = st.fromIndex;
                      st.origin = els[0]?.offsetLeft ?? 0;
                      // Slots are rebuilt from measured widths, so the gap has
                      // to be measured too: it is what the layout uses.
                      st.gapPx =
                        els.length > 1
                          ? els[1].offsetLeft -
                            (els[0].offsetLeft + els[0].offsetWidth)
                          : 0;
                      st.lefts = new Map(st.origLefts);
                      st.slot0 = st.el.offsetLeft;
                      st.startScroll =
                        scrollRef.current?.scrollLeft ?? st.startScroll;
                      // Siblings ease into their simulated slot; the dragged
                      // tab must track the cursor with no easing at all.
                      for (const el of els) {
                        if (el !== st.el) {
                          el.style.transition =
                            "transform 150ms cubic-bezier(0.2, 0, 0, 1)";
                        }
                      }
                      simActive.current = true;
                      setDraggingId(st.fromId);
                      document.body.style.userSelect = "none";
                    }
                    e.preventDefault();
                    const gap = dragGapIndex(
                      st.order.map((id) => ({
                        id,
                        left: st.lefts.get(id) ?? 0,
                        width: st.widths.get(id) ?? 0,
                      })),
                      stripX(e.clientX),
                      st.fromId,
                    );
                    const to = Math.max(
                      0,
                      Math.min(
                        dragFinalIndex(gap, st.index),
                        st.order.length - 1,
                      ),
                    );
                    if (to !== st.index) {
                      st.order.splice(st.index, 1);
                      st.order.splice(to, 0, st.fromId);
                      st.index = to;
                      paintSimulation(scrollRef.current, st);
                    }
                    const el = st.el;
                    if (el) {
                      // `startScroll` keeps the tab glued to the cursor when
                      // the strip scrolls underneath it mid-drag.
                      st.lastTx =
                        e.clientX -
                        st.startX +
                        (st.startScroll -
                          (scrollRef.current?.scrollLeft ?? st.startScroll));
                      el.style.transform = `translateX(${st.lastTx}px)`;
                    }
                  }}
                  onPointerUp={(e) => {
                    const st = drag.current;
                    if (st && !st.active) onSelect(t.id);
                    finishDrag(e.currentTarget, true);
                  }}
                  onPointerCancel={(e) => finishDrag(e.currentTarget, false)}
                  onDoubleClick={() => isPreview && onPin(t.id)}
                  onAuxClick={(e) => {
                    if (e.button === 1 && tabs.length > 1) {
                      e.preventDefault();
                      e.stopPropagation();
                      onClose(t.id);
                    }
                  }}
                  // Suppress Radix's switch-on-mousedown so a tab grabbed to
                  // drag (or a plain click) only activates on release.
                  onMouseDown={(e) => {
                    if (e.button === 1) {
                      e.preventDefault();
                      return;
                    }
                    if (
                      e.button === 0 &&
                      !(e.target as HTMLElement).closest("[data-no-drag]")
                    ) {
                      e.preventDefault();
                    }
                  }}
                  className={cn(
                    "group relative z-[1] h-7 shrink-0 justify-between gap-1.5 rounded-md bg-transparent text-xs transition-colors data-active:bg-transparent dark:data-active:bg-transparent",
                    isNew && "rex-tab-in",
                    isActive
                      ? "text-foreground dark:text-foreground"
                      : "text-muted-foreground hover:text-foreground/80 dark:text-muted-foreground",
                    draggingId === t.id &&
                      "z-20 bg-accent shadow-lg ring-1 ring-foreground/10 data-active:bg-accent dark:data-active:bg-accent",
                    compact
                      ? "px-1.5!"
                      : tabs.length === 1
                        ? "px-2!"
                        : "ps-2! pe-1!",
                  )}
                >
                  <span
                    className={cn(
                      "flex min-w-0 items-center gap-1.5",
                      compact ? "max-w-48" : "max-w-120",
                    )}
                  >
                    {t.kind === "editor" ? (
                      <DropdownMenu
                        onOpenChange={(open) => {
                          if (!open) setShowAllLanguages(false);
                        }}
                      >
                        <DropdownMenuTrigger asChild>
                          {/* span, not button: a button nested in the TabsTrigger button is invalid DOM and breaks WebKit focus. */}
                          <span
                            role="button"
                            tabIndex={-1}
                            data-no-drag
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-sm p-1 -m-1 transition-all hover:bg-accent hover:text-accent-foreground hover:ring-1 hover:ring-primary/30 hover:shadow-[0_0_4px_var(--color-popover-foreground)]"
                          >
                            <TabIcon tab={t} />
                          </span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          side="bottom"
                          sideOffset={6}
                          alignOffset={-4}
                          className="max-h-75 w-48 overflow-y-auto rounded-xl border border-border/40 bg-popover p-1 shadow-lg"
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          onPointerUp={(e) => e.stopPropagation()}
                        >
                          <DropdownMenuItem
                            onSelect={() => {
                              onOverrideLanguage?.(t.id, null);
                            }}
                            className="flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg cursor-default focus:bg-accent focus:text-accent-foreground"
                          >
                            <FileIcon
                              name={t.title}
                              className="size-3.5 shrink-0 object-contain"
                            />
                            <div className="flex flex-1 flex-col">
                              <span>Auto Detect</span>
                              <span className="text-[10px] text-muted-foreground italic">
                                Mode: {resolveDisplayName(t.title)}
                              </span>
                            </div>
                            {!(t as EditorTab).overrideLanguage && (
                              <HugeiconsIcon
                                icon={Tick02Icon}
                                className="size-3.5 text-primary"
                              />
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault();
                              setShowAllLanguages((v) => !v);
                            }}
                            className="w-full px-2.5 py-1.5 text-left text-xs text-primary/60 hover:text-primary rounded-lg transition-colors hover:bg-accent"
                          >
                            {showAllLanguages
                              ? "↑ Fewer languages"
                              : "↓ All languages"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1 border-t border-border/30" />
                          {(showAllLanguages
                            ? ALL_LANGUAGES
                            : EXPOSED_LANGUAGES
                          ).map((lang) => {
                            const isSelected =
                              (t as EditorTab).overrideLanguage === lang.ext;
                            return (
                              <DropdownMenuItem
                                key={lang.ext}
                                onSelect={() =>
                                  onOverrideLanguage?.(t.id, lang.ext)
                                }
                                className="flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg cursor-default focus:bg-accent focus:text-accent-foreground"
                              >
                                <FileIcon
                                  name={`dummy.${lang.ext}`}
                                  className="size-3.5 shrink-0 object-contain"
                                />
                                <span className="flex-1">{lang.name}</span>
                                {isSelected && (
                                  <HugeiconsIcon
                                    icon={Tick02Icon}
                                    className="size-3.5 text-primary"
                                  />
                                )}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <TabIcon tab={t} />
                    )}
                    {/* Preview tabs use italic to signal the transient state,
                        matching the visual convention from VSCode. */}
                    <span className={cn("truncate", isPreview && "italic")}>
                      {labelFor(t)}
                    </span>
                    {t.kind === "editor" && t.dirty ? (
                      <span
                        aria-label="Unsaved changes"
                        className="size-1.5 shrink-0 rounded-full bg-foreground/70"
                      />
                    ) : null}
                  </span>
                  {tabs.length > 1 && (
                    <span
                      role="button"
                      aria-label="Close tab"
                      data-no-drag
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose(t.id);
                      }}
                      className="rounded p-0.5 opacity-0 transition-opacity hover:bg-accent hover:opacity-100 group-hover:opacity-60"
                    >
                      <HugeiconsIcon
                        icon={Cancel01Icon}
                        size={11}
                        strokeWidth={2}
                      />
                    </span>
                  )}
                </TabsTrigger>
              );

              const hasTabsToRight = i < tabs.length - 1;

              const tabNode = (
                <ContextMenu>
                  <ContextMenuTrigger asChild>{trigger}</ContextMenuTrigger>
                  <ContextMenuContent
                    className="min-w-32 p-1"
                    onCloseAutoFocus={(e) => e.preventDefault()}
                  >
                    {t.kind === "terminal" && (
                      <>
                        <ContextMenuItem
                          className="gap-2 rounded-xl px-2.5 py-1.5 text-[13px]"
                          onSelect={() => setEditingId(t.id)}
                        >
                          <HugeiconsIcon
                            icon={PencilEdit02Icon}
                            size={13}
                            strokeWidth={1.75}
                          />
                          <span className="flex-1">Rename</span>
                        </ContextMenuItem>
                        {tabs.length > 1 && (
                          <>
                            <ContextMenuSeparator />
                            <ContextMenuItem
                              className="gap-2 rounded-xl px-2.5 py-1.5 text-[13px]"
                              onSelect={() => onClose(t.id)}
                            >
                              <HugeiconsIcon
                                icon={Cancel01Icon}
                                size={13}
                                strokeWidth={1.75}
                              />
                              <span className="flex-1">Close</span>
                            </ContextMenuItem>
                          </>
                        )}
                      </>
                    )}
                    <ContextMenuItem
                      className="gap-2 rounded-xl px-2.5 py-1.5 text-[13px]"
                      disabled={!hasTabsToRight}
                      onSelect={() => onCloseTabsToRight(t.id)}
                    >
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        size={13}
                        strokeWidth={1.75}
                      />
                      <span className="flex-1">Close tabs to the right</span>
                    </ContextMenuItem>
                    <ContextMenuItem
                      className="gap-2 rounded-xl px-2.5 py-1.5 text-[13px]"
                      disabled={tabs.length <= 1}
                      onSelect={() => onCloseOtherTabs(t.id)}
                    >
                      <HugeiconsIcon
                        icon={CancelCircleIcon}
                        size={13}
                        strokeWidth={1.75}
                      />
                      <span className="flex-1">Close other tabs</span>
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );

              return <Fragment key={t.id}>{tabNode}</Fragment>;
            })}
          </TabsList>
        </Tabs>
        <NewTabMenu
          onNew={onNew}
          onNewEditor={onNewEditor}
          onNewGitGraph={onNewGitGraph}
        />
      </div>
    </div>
  );
}

/** Live pty ids behind a terminal tab; resolved at read time, not render time. */
function terminalPtyIds(tab: TerminalTab): number[] {
  const ptyIds: number[] = [];
  for (const leaf of leafIds(tab.paneTree)) {
    const id = ptyIdForLeaf(leaf);
    if (id !== null) ptyIds.push(id);
  }
  return ptyIds;
}

/**
 * Agent-aware terminal tab icon. The selector reduces the global activity maps
 * to this tab's own `{ state, agent }`, and `useShallow` keeps that result
 * stable, so an agent signal on one tab re-renders only that tab's icon.
 * Non-terminal tabs never reach this component and subscribe to nothing.
 */
function TerminalTabIcon({ tab }: { tab: TerminalTab }) {
  const agentStatus = useAgentActivityStore(
    useShallow((s) => selectTabAgentStatus(s, terminalPtyIds(tab))),
  );
  if (agentStatus.state === "attention") {
    return (
      <HugeiconsIcon
        icon={Message02Icon}
        size={14}
        strokeWidth={2}
        className="shrink-0"
      />
    );
  }
  if (agentStatus.state === "finished") {
    return (
      <HugeiconsIcon
        icon={CheckmarkCircle01Icon}
        size={14}
        strokeWidth={2}
        className="shrink-0"
      />
    );
  }
  if (
    (agentStatus.state === "working" || agentStatus.state === "idle") &&
    agentStatus.agent
  ) {
    return (
      <AgentIcon agent={agentStatus.agent} size={14} className="shrink-0" />
    );
  }
  return (
    <HugeiconsIcon
      icon={ComputerTerminal02Icon}
      size={14}
      strokeWidth={2}
      className="shrink-0"
    />
  );
}

export function TabIcon({ tab }: { tab: Tab }) {
  if (tab.kind === "editor" || tab.kind === "markdown") {
    return (
      <FileIcon
        name={
          tab.kind === "editor" && tab.overrideLanguage
            ? `dummy.${tab.overrideLanguage}`
            : tab.title
        }
        className="size-3.5 shrink-0 object-contain"
      />
    );
  }
  if (tab.kind === "preview") {
    return (
      <HugeiconsIcon
        icon={Globe02Icon}
        size={14}
        strokeWidth={2}
        className="shrink-0"
      />
    );
  }
  if (tab.kind === "ai-diff") {
    return (
      <HugeiconsIcon
        icon={GitCompareIcon}
        size={14}
        strokeWidth={2}
        className="shrink-0"
      />
    );
  }
  if (tab.kind === "terminal" && tab.private) {
    return (
      <HugeiconsIcon
        icon={IncognitoIcon}
        size={14}
        strokeWidth={2}
        className="shrink-0"
      />
    );
  }
  if (tab.kind === "git-diff" || tab.kind === "git-commit-file") {
    return (
      <HugeiconsIcon
        icon={GitCompareIcon}
        size={14}
        strokeWidth={2}
        className="shrink-0"
      />
    );
  }
  if (tab.kind === "git-history") {
    return (
      <HugeiconsIcon
        icon={Clock01Icon}
        size={14}
        strokeWidth={2}
        className="shrink-0"
      />
    );
  }
  return <TerminalTabIcon tab={tab} />;
}

function TabRenameInput({
  initial,
  onCommit,
  onCancel,
}: {
  initial: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  // Guards against a trailing blur re-resolving an edit that Enter/Escape
  // already finished (Escape must never commit).
  const done = useRef(false);

  useEffect(() => {
    // Focus on the next frame so it runs after the context menu restores focus
    // to its trigger when closing; a synchronous focus would be stolen.
    const raf = requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.select();
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const finish = (fn: () => void) => {
    if (done.current) return;
    done.current = true;
    fn();
  };

  // explicit = the user pressed Enter, which pins even the unchanged label. A
  // plain blur with no change must not freeze the cwd-derived default into a
  // custom title.
  const commit = (value: string, explicit: boolean) => {
    if (!explicit && value.trim() === initial.trim()) finish(onCancel);
    else finish(() => onCommit(value));
  };

  return (
    <input
      ref={ref}
      defaultValue={initial}
      aria-label="Rename tab"
      className={cn(
        "w-28 min-w-0 rounded-sm bg-background px-1 text-xs text-foreground",
        "outline-none ring-1 ring-border focus:ring-ring",
      )}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") commit(e.currentTarget.value, true);
        else if (e.key === "Escape") finish(onCancel);
      }}
      onBlur={(e) => {
        // Switching windows/apps blurs the input; keep the edit open instead
        // of resolving it on the way out.
        if (!document.hasFocus()) return;
        commit(e.currentTarget.value, false);
      }}
    />
  );
}
