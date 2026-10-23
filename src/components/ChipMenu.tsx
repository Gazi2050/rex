import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ReactNode } from "react";

type Props = {
  label: string;
  title?: string;
  icon?: typeof ArrowDown01Icon;
  disabled?: boolean;
  /** Default true; false shows the full value (e.g. the cwd chip). */
  truncate?: boolean;
  side?: "top" | "bottom";
  /** Fired when the menu opens/closes, for lazy menu data. */
  onOpenChange?: (open: boolean) => void;
  /** Rendered inside DropdownMenuContent. */
  children: ReactNode;
};

/** A Chip that opens a menu. Same visual language as the static `Chip`, but
 *  interactive and with a caret so it reads as a control. */
export function ChipMenu({
  label,
  title,
  icon,
  disabled,
  truncate = true,
  side = "top",
  onOpenChange,
  children,
}: Props) {
  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          title={title ?? label}
          className="inline-flex h-[22px] items-center gap-1.5 rounded-md border border-border/40 bg-foreground/[0.03] px-2 text-[11px] leading-none text-foreground/75 transition-colors hover:bg-foreground/[0.07] focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-45 data-[state=open]:bg-foreground/[0.09]"
        >
          {icon && (
            <HugeiconsIcon
              icon={icon}
              size={11}
              strokeWidth={1.75}
              className="shrink-0 text-foreground/60"
            />
          )}
          <span
            className={
              truncate ? "max-w-[10rem] truncate font-medium" : "font-medium"
            }
          >
            {label}
          </span>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={10}
            strokeWidth={2}
            className="shrink-0 opacity-50"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side={side}
        className="min-w-52 max-w-72"
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
