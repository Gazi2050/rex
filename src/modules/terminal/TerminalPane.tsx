import { usePreferencesStore } from "@/modules/settings/preferences";
import type { TerminalSearchController } from "@/modules/terminal/search/TerminalSearchController";
import { useTheme } from "@/modules/theme";
import {
  forwardRef,
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { TerminalBackendKind } from "./backend/contracts";
import { resolvedTerminalBackend } from "./backend/selection";
import { TerminalScrollbar } from "./ghostty/TerminalScrollbar";
import {
  ghosttyTerminalGeometry,
  useGhosttyTerminalSession,
} from "./ghostty/useGhosttyTerminalSession";
import { cleanPathToken, wordRangeAt } from "./lib/terminalPathHit";
import { resolvePathToken } from "./lib/terminalPathResolve";
import { leafCwd } from "./lib/terminalSessionApi";

export type TerminalPaneHandle = {
  write: (data: string) => void;
  focus: () => void;
  getBuffer: (maxLines?: number) => string | null;
  getSelection: () => string | null;
};

export type TerminalPaneProps = {
  /** Stable identifier for this leaf (passed back through callbacks). */
  leafId: number;
  /** Tab containing this pane is on screen. */
  visible: boolean;
  /** This leaf is the active pane within its tab and receives auto-focus. */
  focused?: boolean;
  initialCwd?: string;
  onSearchReady?: (leafId: number, addon: TerminalSearchController) => void;
  onExit?: (leafId: number, code: number) => void;
  onCwd?: (leafId: number, cwd: string) => void;
  /** Click-to-open: a clicked file opens in the editor, a folder in the explorer. */
  onOpenPath?: (path: string, kind: "file" | "dir") => void;
};

const TerminalAccessibleOutput = lazy(
  () => import("./ghostty/TerminalAccessibleOutput"),
);

const GhosttyTerminalPane = memo(
  forwardRef<
    TerminalPaneHandle,
    TerminalPaneProps & {
      backend: Extract<TerminalBackendKind, `ghostty-${string}`>;
    }
  >(function GhosttyTerminalPane(
    {
      leafId,
      visible,
      focused = true,
      initialCwd,
      onSearchReady,
      onExit,
      onCwd,
      onOpenPath,
      backend,
    },
    ref,
  ) {
    const screenReader = usePreferencesStore(
      (state) => state.terminalScreenReader,
    );
    const containerRef = useRef<HTMLDivElement>(null);
    const down = useRef<{ x: number; y: number } | null>(null);
    const { resolvedMode, activeTheme } = useTheme();
    const session = useGhosttyTerminalSession({
      leafId,
      backend,
      container: containerRef,
      visible,
      focused,
      initialCwd,
      onSearchReady: (search) => onSearchReady?.(leafId, search),
      onExit: (code) => onExit?.(leafId, code),
      onCwd: (cwd) => onCwd?.(leafId, cwd),
    });
    useEffect(() => {
      void resolvedMode;
      void activeTheme;
      const id = requestAnimationFrame(() => session.applyTheme());
      return () => cancelAnimationFrame(id);
    }, [resolvedMode, activeTheme, session]);

    useImperativeHandle(
      ref,
      () => ({
        write: session.write,
        focus: session.focus,
        getBuffer: session.getBuffer,
        getSelection: session.getSelection,
      }),
      [session],
    );

    // Click-to-open: a clicked token that stats to a real file/folder opens
    // in the editor/explorer. Hover adds an underline under the token using
    // the same measured cell geometry as hit-testing.
    const lastTokenRef = useRef<string | null>(null);
    const resolvedTokenRef = useRef<string | null>(null);
    const hoverSeqRef = useRef(0);
    const pointerRef = useRef<{ x: number; y: number } | null>(null);
    const [linkHint, setLinkHint] = useState<{
      left: number;
      top: number;
      width: number;
    } | null>(null);

    const hitTest = useCallback(
      (clientX: number, clientY: number) => {
        const geometry = ghosttyTerminalGeometry(leafId);
        const model = session.model;
        const paneRect = containerRef.current?.getBoundingClientRect();
        if (
          !geometry ||
          !model ||
          !paneRect ||
          geometry.cellWidth <= 0 ||
          geometry.height <= 0
        )
          return null;
        const col = Math.floor((clientX - geometry.left) / geometry.cellWidth);
        const row = Math.floor((clientY - geometry.top) / geometry.height);
        if (col < 0 || row < 0 || row >= model.rows) return null;
        const cells = model.readCellLine?.(model.bufferLineAtViewportRow(row));
        if (!cells) return null;
        const line = cells.join("");
        const range = wordRangeAt(line, col);
        if (!range) return null;
        const token = cleanPathToken(line.slice(range.start, range.end));
        if (!token || token.length > 512) return null;
        return {
          token,
          rect: {
            left:
              geometry.left - paneRect.left + range.start * geometry.cellWidth,
            // Place the rule just above the cell's lower edge, clear of glyphs.
            top: geometry.top - paneRect.top + (row + 1) * geometry.height - 2,
            width: (range.end - range.start) * geometry.cellWidth,
          },
        };
      },
      [leafId, session.model],
    );

    const openHit = async (hit: { token: string }): Promise<boolean> => {
      const resolved = await resolvePathToken(hit.token, leafCwd(leafId));
      if (!resolved) return false;
      hoverSeqRef.current += 1;
      lastTokenRef.current = null;
      resolvedTokenRef.current = null;
      setLinkHint(null);
      onOpenPath?.(resolved.path, resolved.kind);
      return true;
    };

    useEffect(() => {
      const reposition = () => {
        const pointer = pointerRef.current;
        if (!pointer) return;
        const hit = hitTest(pointer.x, pointer.y);
        if (hit && hit.token === lastTokenRef.current) {
          if (hit.token === resolvedTokenRef.current) setLinkHint(hit.rect);
          return;
        }
        setLinkHint(null);
      };
      window.addEventListener("resize", reposition);
      return () => window.removeEventListener("resize", reposition);
    }, [hitTest]);

    return (
      <div
        className="zoom-exempt relative h-full w-full overflow-hidden"
        style={{
          visibility: visible ? "visible" : "hidden",
          pointerEvents: visible ? "auto" : "none",
          cursor: linkHint ? "pointer" : undefined,
        }}
        onPointerDownCapture={
          (event) => {
            down.current =
              event.button === 0 &&
              event.detail === 1 &&
              !event.shiftKey &&
              !event.altKey &&
              !event.metaKey &&
              !event.ctrlKey &&
              containerRef.current?.contains(event.target as Node)
                ? { x: event.clientX, y: event.clientY }
                : null;
          }
        }
        onPointerUp={
          (event) => {
            if (
              (event.target as HTMLElement | null)?.closest(
                "[data-terminal-scrollbar]",
              )
            )
              return;
            const origin = down.current;
            down.current = null;
            if (
              origin &&
              Math.hypot(event.clientX - origin.x, event.clientY - origin.y) <=
                4 &&
              !session.getSelection()
            ) {
              session.focus();
              const hit = hitTest(event.clientX, event.clientY);
              void (async () => {
                if (hit && (await openHit(hit))) return;
              })();
            }
          }
        }
        onPointerMove={
          (event) => {
            pointerRef.current = { x: event.clientX, y: event.clientY };
            const hit = hitTest(event.clientX, event.clientY);
            if (hit && hit.token === lastTokenRef.current) {
              if (hit.token === resolvedTokenRef.current)
                setLinkHint(hit.rect);
              return;
            }
            lastTokenRef.current = hit?.token ?? null;
            resolvedTokenRef.current = null;
            setLinkHint(null);
            if (!hit) return;
            const seq = ++hoverSeqRef.current;
            void (async () => {
              const resolved = await resolvePathToken(
                hit.token,
                leafCwd(leafId),
              );
              if (hoverSeqRef.current !== seq) return;
              if (!resolved) return;
              lastTokenRef.current = hit.token;
              resolvedTokenRef.current = hit.token;
              setLinkHint(hit.rect);
            })();
          }
        }
        onPointerLeave={
          () => {
            pointerRef.current = null;
            lastTokenRef.current = null;
            resolvedTokenRef.current = null;
            hoverSeqRef.current += 1;
            setLinkHint(null);
          }
        }
        data-terminal-backend={backend}
      >
        <div ref={containerRef} className="absolute inset-0" />
        {linkHint && (
          <div
            aria-hidden
            className="pointer-events-none absolute z-10 h-[2px] rounded-full bg-primary shadow-[0_0_3px_var(--primary)]"
            style={{
              left: `${linkHint.left}px`,
              top: `${linkHint.top}px`,
              width: `${linkHint.width}px`,
            }}
          />
        )}
        {screenReader && session.model && (
          <Suspense fallback={null}>
            <TerminalAccessibleOutput
              model={session.model}
              visible={visible}
              focused={focused}
              onExit={session.focus}
            />
          </Suspense>
        )}
        <TerminalScrollbar leafId={leafId} />
        {session.error && (
          <div
            role="alert"
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background p-6 text-center text-sm"
          >
            <strong>
              {session.error.kind === "renderer"
                ? "Unable to display terminal"
                : "Unable to start terminal"}
            </strong>
            <p className="max-w-md break-words text-muted-foreground">
              {session.error.message}
            </p>
            {session.error.kind === "renderer" && (
              <p className="text-muted-foreground">
                Your terminal session is preserved. Retry to restore its
                display.
              </p>
            )}
            <button
              type="button"
              className="rounded-md border px-3 py-1.5 hover:bg-accent focus-visible:outline-2"
              onClick={session.retry}
            >
              {session.error.kind === "renderer" ? "Retry display" : "Retry"}
            </button>
          </div>
        )}
      </div>
    );
  }),
);

export const TerminalPane = memo(
  forwardRef<TerminalPaneHandle, TerminalPaneProps>(
    function TerminalPane(props, ref) {
      const [backend] = useState(() =>
        usePreferencesStore.getState().terminalRenderer === "webgl"
          ? ("ghostty-webgl" as const)
          : resolvedTerminalBackend(),
      );
      return <GhosttyTerminalPane ref={ref} {...props} backend={backend} />;
    },
  ),
);
