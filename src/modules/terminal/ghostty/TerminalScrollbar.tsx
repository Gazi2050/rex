import {
  ghosttyModelForLeaf,
  subscribeGhosttyFrame,
} from "@/modules/terminal/ghostty/useGhosttyTerminalSession";
import { useEffect, useRef, useState } from "react";

type ScrollMetrics = {
  offset: number;
  history: number;
  rows: number;
  hidden: boolean;
};

function readMetrics(
  model: NonNullable<ReturnType<typeof ghosttyModelForLeaf>>,
): ScrollMetrics {
  const { offset, history } = model.scrollPosition();
  const modes = model.modes();
  return {
    offset,
    history,
    rows: model.rows,
    // TUIs own the viewport (and the mouse); nothing to scroll in a snapshot.
    hidden: modes.alternateScreen || modes.mouseTracking || history <= 0,
  };
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Thin overlay scrollbar for the terminal grid. Position/size are pure
 * percentages of the buffer, so it needs no pixel measurements except at
 * drag start. Hidden while a TUI owns the screen or there is no scrollback.
 *
 * Direction: the model's `offset` counts UP from the live bottom (0 = bottom),
 * so the scrollbar works in a from-top view coordinate (`fromTop = history -
 * offset`) and converts back on every write. Drag targets are applied at most
 * once per animation frame — each `scrollTo` is a full-damage repaint, and
 * pointermoves arrive faster than frames.
 */
export function TerminalScrollbar({ leafId }: { leafId: number }) {
  const [metrics, setMetrics] = useState<ScrollMetrics | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startY: number;
    startFromTop: number;
    trackHeight: number;
    scrollHeight: number;
    history: number;
  } | null>(null);
  const pendingRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    let signature = "";
    return subscribeGhosttyFrame(leafId, () => {
      const model = ghosttyModelForLeaf(leafId);
      if (!model) {
        if (signature) {
          signature = "";
          setMetrics(null);
        }
        return;
      }
      const next = readMetrics(model);
      const sig = `${next.offset}|${next.history}|${next.rows}|${next.hidden}`;
      if (sig === signature) return;
      signature = sig;
      setMetrics(next);
    });
  }, [leafId]);

  useEffect(() => {
    const frame = frameRef.current;
    if (frame !== null) cancelAnimationFrame(frame);
  }, []);

  if (!metrics || metrics.hidden) return null;

  const scrollHeight = metrics.history + metrics.rows;
  // From-top coordinate for display; the model wants distance-from-bottom.
  const fromTop = metrics.history - metrics.offset;
  const thumbTop = (fromTop / scrollHeight) * 100;
  const thumbHeight = Math.max((metrics.rows / scrollHeight) * 100, 4);

  const applyFromTop = (fromTopTarget: number) => {
    const model = ghosttyModelForLeaf(leafId);
    model?.scrollTo(
      Math.round(clamp(metrics.history - fromTopTarget, 0, metrics.history)),
    );
  };

  const scheduleFromTop = (fromTopTarget: number) => {
    pendingRef.current = fromTopTarget;
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const pending = pendingRef.current;
      pendingRef.current = null;
      if (pending !== null) applyFromTop(pending);
    });
  };

  const flushPending = () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending !== null) applyFromTop(pending);
  };

  return (
    <div
      data-terminal-scrollbar=""
      ref={trackRef}
      className="group absolute inset-y-0 right-0 z-20 w-2.5 cursor-default"
      onPointerDown={(event) => {
        const track = trackRef.current;
        if (!track) return;
        event.preventDefault();
        event.stopPropagation();
        const rect = track.getBoundingClientRect();
        const fraction = clamp((event.clientY - rect.top) / rect.height, 0, 1);
        const startFromTop = clamp(
          fraction * scrollHeight - metrics.rows / 2,
          0,
          metrics.history,
        );
        applyFromTop(startFromTop);
        dragRef.current = {
          startY: event.clientY,
          startFromTop,
          trackHeight: rect.height,
          scrollHeight,
          history: metrics.history,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current;
        if (!drag) return;
        event.preventDefault();
        scheduleFromTop(
          clamp(
            drag.startFromTop +
              ((event.clientY - drag.startY) / drag.trackHeight) *
                drag.scrollHeight,
            0,
            drag.history,
          ),
        );
      }}
      onPointerUp={() => {
        dragRef.current = null;
        flushPending();
      }}
      onPointerCancel={() => {
        dragRef.current = null;
        flushPending();
      }}
      onWheel={(event) => {
        const model = ghosttyModelForLeaf(leafId);
        if (!model) return;
        event.preventDefault();
        event.stopPropagation();
        model.scrollBy(
          Math.sign(event.deltaY) *
            Math.max(1, Math.round(Math.abs(event.deltaY) / 40)),
        );
      }}
    >
      <div
        className="absolute left-1/2 w-1 -translate-x-1/2 rounded-full bg-foreground/25 transition-[background-color] group-hover:bg-foreground/45"
        style={{
          top: `${thumbTop}%`,
          height: `${thumbHeight}%`,
          minHeight: 20,
        }}
      />
    </div>
  );
}
