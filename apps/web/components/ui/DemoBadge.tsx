import * as React from "react";
import { Badge } from "./Badge";
import { cn } from "@/lib/utils";

export interface DemoBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  label?: string;
}

export const DemoBadge = React.forwardRef<HTMLSpanElement, DemoBadgeProps>(
  ({ className, label = "Demo data", ...props }, ref) => {
    return (
      <Badge
        ref={ref}
        variant="demo"
        className={cn("shadow-none", className)}
        {...props}
      >
        {label}
      </Badge>
    );
  }
);

DemoBadge.displayName = "DemoBadge";
