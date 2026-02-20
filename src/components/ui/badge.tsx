import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors shadow focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        riskSafe: "border-[hsl(var(--safe)/0.35)] bg-[hsl(var(--safe)/0.12)] text-[hsl(var(--safe))]",
        riskAdjust: "border-[hsl(var(--warning)/0.35)] bg-[hsl(var(--warning)/0.14)] text-[hsl(var(--warning))]",
        riskToxic: "border-[hsl(var(--danger)/0.35)] bg-[hsl(var(--danger)/0.12)] text-[hsl(var(--danger))]",
        riskUnknown: "border-[hsl(var(--unknown)/0.35)] bg-[hsl(var(--unknown)/0.14)] text-[hsl(var(--unknown))]",
        toxic: "bg-rose-500/15 text-rose-700 border-rose-500/25",
        adjust: "bg-amber-500/15 text-amber-800 border-amber-500/25",
        safe: "bg-emerald-500/15 text-emerald-800 border-emerald-500/25",
        unknown: "bg-slate-500/10 text-slate-700 border-slate-400/25",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
