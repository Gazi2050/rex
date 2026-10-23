import { homeRelativePath } from "@/lib/homeRelativePath";
import { nodeVersionsFor, pickNodeManager } from "@/lib/nodeProbe";
import { AiInputBarConnect } from "@/modules/ai";
import { Chip } from "@/modules/ai/components/Chip";
import { ChipsRow } from "@/modules/ai/components/ChipsRow";
import { useComposer } from "@/modules/ai/lib/composer";
import {
  CodeIcon,
  CommandLineIcon,
  Folder01Icon,
  GitBranchIcon,
} from "@hugeicons/core-free-icons";
import { lazy, Suspense, useEffect, useState } from "react";
import { OsIcon } from "./OsIcon";
import { useLeafNodeEnv } from "./useLeafNodeEnv";
import { useNodeEnv } from "./useNodeEnv";
import { useRepoBranches } from "./useRepoBranches";
import { useSystemInfo } from "./useSystemInfo";

const AiComposerInput = lazy(() =>
  import("@/modules/ai/components/AiComposerInput").then((m) => ({
    default: m.AiComposerInput,
  })),
);

type Props = {
  isTerminalTab: boolean;
  activeLeafId: number | null;
  cwd: string | null;
  home: string | null;
  hasComposer: boolean;
  panelOpen: boolean;
  keysLoaded: boolean;
  onConnect: () => void;
};

export function WorkspaceInputBar({
  isTerminalTab,
  activeLeafId,
  cwd,
  home,
  hasComposer,
  panelOpen,
  keysLoaded,
  onConnect,
}: Props) {
  const c = useComposer();
  const { os, shell } = useSystemInfo();

  const { branch: repoBranch } = useRepoBranches(isTerminalTab ? cwd : null);
  const nodeEnv = useNodeEnv(isTerminalTab ? cwd : null);
  const shellEnv = useLeafNodeEnv(isTerminalTab ? activeLeafId : null);
  // Shell-reported values win: they reflect THIS terminal (nvm use, checkout),
  // where the filesystem probe only sees the app's env.
  const branch = shellEnv.branch ?? repoBranch;
  const nodeCurrent = shellEnv.node ?? nodeEnv?.current ?? null;
  const nodeManager = nodeEnv ? pickNodeManager(nodeEnv, nodeCurrent) : null;
  const nodeVersions = nodeEnv ? nodeVersionsFor(nodeEnv, nodeManager) : [];

  // Subdirectories for the path chip's cd menu; fetched lazily on open.
  const mounted = keysLoaded;
  const open = keysLoaded && panelOpen;

  const [aiLoaded, setAiLoaded] = useState(false);
  useEffect(() => {
    if (open) setAiLoaded(true);
  }, [open]);
  const renderAi = hasComposer && aiLoaded;

  if (!mounted) return null;

  const terminalChips = isTerminalTab ? (
    <>
      {os && <Chip tone="neutral" iconNode={<OsIcon os={os} />} title={os} />}
      {nodeCurrent && nodeManager && nodeVersions.length > 0 && (
        <Chip tone="neutral" icon={CodeIcon} title="Node version">
          {nodeCurrent}
        </Chip>
      )}
      {cwd && <Chip tone="blue" icon={Folder01Icon} title={cwd} truncate={false}>{homeRelativePath(cwd, home)}</Chip>}
      {branch && <Chip tone="violet" icon={GitBranchIcon} title={`Branch: ${branch}`}>{branch}</Chip>}
      {shell && (
        <Chip tone="emerald" icon={CommandLineIcon}>
          {shell}
        </Chip>
      )}
    </>
  ) : null;

  const content =
    !hasComposer ? (
      <AiInputBarConnect onAdd={onConnect} />
    ) : (
      <div className="shrink-0 border-t border-border/60 bg-foreground/[0.02] px-3 py-2">
        <div className="flex flex-col gap-2 rounded-lg px-1 py-1">
          <ChipsRow
            leading={terminalChips}
            files={c.files}
            onRemoveFile={c.removeFile}
            snippets={c.pickedSnippets}
            onRemoveSnippet={(id) => {
              const snip = c.pickedSnippets.find((s) => s.id === id);
              c.removeSnippet(id);
              if (!snip) return;
              const re = new RegExp(`(^|\\s)#${snip.handle}\\b ?`);
              c.setValue((v) => v.replace(re, (_m, lead: string) => lead));
            }}
            commands={c.pickedCommands}
            onRemoveCommand={(name) => c.removeCommand(name)}
          />

          <div className="flex items-end gap-2.5 rounded-lg px-2 py-1 ring-1 ring-border/30 transition-colors focus-within:bg-foreground/[0.02] focus-within:ring-border/60">
            <div className="relative min-w-0 flex-1">
              {renderAi && (
                <div>
                  <Suspense fallback={null}>
                    <AiComposerInput />
                  </Suspense>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div
      data-ai-input-bar
      data-state={open ? "open" : "closed"}
      className="rex-reveal"
      aria-hidden={!open}
    >
      <div>{content}</div>
    </div>
  );
}
