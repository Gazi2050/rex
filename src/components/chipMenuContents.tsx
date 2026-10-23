import {
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import type { GitBranchEntry } from "@/modules/ai/lib/native";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

/**
 * Menu bodies shared by the footer chips and the block-header chips. Each is
 * props-only: callers own the data fetch and the "run it in the terminal"
 * callback (both surfaces run visible commands via the leaf's controller).

 */
export function BranchMenuContent({
  entries,
  current,
  onCheckout,
}: {
  entries: GitBranchEntry[];
  current: string | null;
  onCheckout: (name: string) => void;
}) {
  return (
    <>
      <DropdownMenuLabel className="text-[11px] text-muted-foreground">
        Switch branch
      </DropdownMenuLabel>
      {entries.map((entry) => (
        <DropdownMenuItem
          key={`${entry.kind}:${entry.worktreePath ?? ""}:${entry.name}`}
          disabled={entry.isHead || entry.name === current}
          onSelect={() => onCheckout(entry.name)}
          className="gap-2 text-xs"
        >
          <span className="min-w-0 flex-1 truncate">{entry.name}</span>
          {entry.kind === "worktree" && (
            <span className="shrink-0 text-[10px] text-muted-foreground">
              worktree
            </span>
          )}
          {(entry.isHead || entry.name === current) && (
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              size={12}
              strokeWidth={1.75}
              className="shrink-0 text-primary"
            />
          )}
        </DropdownMenuItem>
      ))}
    </>
  );
}

export function NodeMenuContent({
  manager,
  versions,
  current,
  onUse,
}: {
  manager: string;
  versions: string[];
  current: string | null;
  onUse: (version: string) => void;
}) {
  return (
    <>
      <DropdownMenuLabel className="text-[11px] text-muted-foreground">
        Node version ({manager})
      </DropdownMenuLabel>
      {versions.map((version) => (
        <DropdownMenuItem
          key={version}
          disabled={version === current}
          onSelect={() => onUse(version)}
          className="gap-2 text-xs"
        >
          <span className="min-w-0 flex-1 truncate">{version}</span>
          {version === current && (
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              size={12}
              strokeWidth={1.75}
              className="shrink-0 text-primary"
            />
          )}
        </DropdownMenuItem>
      ))}
    </>
  );
}

export function DirectoryMenuContent({
  entries,
  onCd,
}: {
  /** Subdirectories of the chip's cwd (names only). */
  entries: string[];
  /** Receives ".." for the parent entry. */
  onCd: (name: string) => void;
}) {
  return (
    <>
      <DropdownMenuLabel className="text-[11px] text-muted-foreground">
        Change directory
      </DropdownMenuLabel>
      <DropdownMenuItem
        onSelect={() => onCd("..")}
        className="gap-2 text-xs text-muted-foreground"
      >
        <span className="min-w-0 flex-1 truncate">.. (Parent Directory)</span>
      </DropdownMenuItem>
      {entries.map((name) => (
        <DropdownMenuItem
          key={name}
          onSelect={() => onCd(name)}
          className="gap-2 text-xs"
        >
          <span className="min-w-0 flex-1 truncate">{name}</span>
        </DropdownMenuItem>
      ))}
    </>
  );
}
