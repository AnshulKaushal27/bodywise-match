import * as React from "react";
import { X, Check, PencilSimple } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

export interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  onSelectChange?: (selected: boolean) => void;
  removable?: boolean;
  onRemove?: () => void;
  editable?: boolean;
  onEdit?: () => void;
  disabled?: boolean;
}

export const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  (
    {
      className,
      children,
      selected,
      onSelectChange,
      removable,
      onRemove,
      editable,
      onEdit,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const isInteractive = Boolean(onSelectChange || onClick);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (onSelectChange) {
        onSelectChange(!selected);
      }
      if (onClick) {
        onClick(e);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (isInteractive && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        if (onSelectChange) {
          onSelectChange(!selected);
        }
      }
    };

    return (
      <div
        ref={ref}
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive && !disabled ? 0 : undefined}
        aria-pressed={isInteractive ? selected : undefined}
        aria-disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 min-h-[44px] select-none focus-ring",
          selected
            ? "bg-accent-lime text-brand-deep shadow-sm border border-brand-deep/20 font-semibold"
            : "bg-surface-sage text-brand-deep hover:bg-surface-sage/80 border border-transparent",
          isInteractive && !disabled && "cursor-pointer active:scale-[0.98]",
          disabled && "opacity-50 pointer-events-none",
          className
        )}
        {...props}
      >
        {selected && (
          <Check className="w-3.5 h-3.5 text-brand-deep stroke-[2.5]" aria-hidden="true" />
        )}

        <span className="truncate">{children}</span>

        {editable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            aria-label="Edit item"
            className="p-1 -mr-1 rounded-full hover:bg-brand-deep/10 text-brand-deep focus-ring"
          >
            <PencilSimple className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}

        {removable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            aria-label="Remove item"
            className="p-1 -mr-1 rounded-full hover:bg-brand-deep/10 text-brand-deep focus-ring"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }
);

Chip.displayName = "Chip";
