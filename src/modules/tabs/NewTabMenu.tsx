import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fmtShortcut, MOD_KEY } from "@/lib/platform";
import {
  ComputerTerminal02Icon,
  GitBranchIcon,
  PencilEdit02Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

type Props = {
  onNew: () => void;
  onNewEditor: () => void;
  onNewGitGraph: () => void;
};

export function NewTabMenu({ onNew, onNewEditor, onNewGitGraph }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="ml-1 size-6 shrink-0 rounded-full bg-foreground/[0.06] text-muted-foreground ring-1 ring-inset ring-foreground/[0.04] hover:bg-foreground/[0.12] hover:text-foreground"
          title="New tab"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={2} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        <DropdownMenuItem onSelect={onNew}>
          <HugeiconsIcon
            icon={ComputerTerminal02Icon}
            size={14}
            strokeWidth={1.75}
          />
          <span className="flex-1">Terminal</span>
          <span className="text-xs text-muted-foreground">
            {fmtShortcut(MOD_KEY, "T")}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onNewEditor}>
          <HugeiconsIcon icon={PencilEdit02Icon} size={14} strokeWidth={1.75} />
          <span className="flex-1">Editor</span>
          <span className="text-xs text-muted-foreground">
            {fmtShortcut(MOD_KEY, "E")}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onNewGitGraph}>
          <HugeiconsIcon icon={GitBranchIcon} size={14} strokeWidth={1.75} />
          <span className="flex-1">Git Graph</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
