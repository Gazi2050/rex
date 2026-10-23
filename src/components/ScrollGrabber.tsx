import { type ReactNode, useEffect, useRef, useState } from "react";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

type Props = {
  /** The scrolling element this grabber overlays and drives. */
  viewport: HTMLElement | null;
  /** Rendered inside the strip; defaults to the thumb. */
  className?: string;
  children?: ReactNode;
};

/**
 * DOM overlay scrollbar for scroll containers whose native bars are invisible
 * (overlay-scrollbar webviews ignore ::-webkit-scrollbar styling). Paints a
 * small grabber over the viewport's right edge and drives scrollTop on
 * drag/track-click/wheel, so it works identically on every engine.
 * The nearest positioned ancestor must match the viewport's box (the parent
 * that lays the viewport out).
 */
export function ScrollGrabber({ viewport, className, children }: Props) {
  const stripRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startY: number;
    startTop: number;
    trackHeight: number;
    scrollHeight: number;
  } | null>(null);
  const [thumb, setThumb] = useState<{ top: number; height: number } | null>(
    null,
  );

  useEffect(() => {
    if (!viewport) return;
    let signature = "";
    const update = () => {
      const scrollable = viewport.scrollHeight > viewport.clientHeight + 1;
      const next = scrollable
        ? {
            top: (viewport.scrollTop / viewport.scrollHeight) * 100,
            height: Math.max(
              (viewport.clientHeight / viewport.scrollHeight) * 100,
              10,
            ),
          }
        : null;
      const sig = next ? `${next.top}|${next.height}` : "none";
      if (sig === signature) return;
      signature = sig;
      setThumb(next);
    };
    update();
    viewport.addEventListener("scroll", update, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(viewport);
    const mutations = new MutationObserver(update);
    mutations.observe(viewport, { childList: true, subtree: true });
    return () => {
      viewport.removeEventListener("scroll", update);
      resize.disconnect();
      mutations.disconnect();
    };
  }, [viewport]);

  if (!viewport || !thumb) return null;

  const applyFraction = (fraction: number) => {
    viewport.scrollTop =
      fraction * viewport.scrollHeight - viewport.clientHeight / 2;
  };

  return (
    <div
      ref={stripRef}
      className={
        className ??
        "group absolute inset-y-0 right-0 z-20 w-2.5 cursor-default"
      }
      onPointerDown={(event) => {
        const strip = stripRef.current;
        if (!strip) return;
        event.preventDefault();
        event.stopPropagation();
        const rect = strip.getBoundingClientRect();
        applyFraction(clamp((event.clientY - rect.top) / rect.height, 0, 1));
        dragRef.current = {
          startY: event.clientY,
          startTop: viewport.scrollTop,
          trackHeight: rect.height,
          scrollHeight: viewport.scrollHeight,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current;
        if (!drag) return;
        event.preventDefault();
        viewport.scrollTop = clamp(
          drag.startTop +
            ((event.clientY - drag.startY) / drag.trackHeight) *
              drag.scrollHeight,
          0,
          drag.scrollHeight - viewport.clientHeight,
        );
      }}
      onPointerUp={() => {
        dragRef.current = null;
      }}
      onPointerCancel={() => {
        dragRef.current = null;
      }}
      onWheel={(event) => {
        event.preventDefault();
        viewport.scrollTop += event.deltaY;
      }}
    >
      <div
        className="absolute left-1/2 w-1 -translate-x-1/2 rounded-full bg-foreground/30 transition-[background-color] group-hover:bg-foreground/50"
        style={{ top: `${thumb.top}%`, height: `${thumb.height}%` }}
      />
      {children}
    </div>
  );
}
