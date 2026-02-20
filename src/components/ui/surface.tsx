import * as React from "react";
import { cn } from "@/lib/utils";

type SurfaceVariant = "card" | "panel" | "ghost";
type SurfaceDepth = "flat" | "raised";

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant;
  depth?: SurfaceDepth;
}

export const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  ({ className, variant = "card", depth = "flat", ...props }, ref) => {
    const base =
      "rounded-[22px] pg-border-soft pg-hover-lift transition-all";

    const variantClass: Record<SurfaceVariant, string> = {
      card: "pg-surface",
      panel: "rounded-[22px] border bg-background/70 backdrop-blur-md",
      ghost: "rounded-[22px] border border-transparent bg-transparent",
    };

    const depthClass: Record<SurfaceDepth, string> = {
      flat: "",
      raised: "pg-surface-3d",
    };

    return (
      <div
        ref={ref}
        className={cn(base, variantClass[variant], depthClass[depth], className)}
        {...props}
      />
    );
  },
);
Surface.displayName = "Surface";

export default Surface;

