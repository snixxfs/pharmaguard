import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors transition-transform will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "text-primary-foreground bg-gradient-to-r from-[hsl(var(--brand-teal))] via-[hsl(var(--brand-cyan))] to-[hsl(var(--brand-violet))] shadow transition-shadow hover:shadow-[0_8px_24px_-8px_hsl(var(--pg-glow)/0.4)] hover:saturate-125 hover:-translate-y-[1px] active:translate-y-[0px]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-[hsl(var(--brand-teal)/0.08)] hover:text-foreground",
        secondary: "border border-[hsl(var(--brand-violet)/0.35)] bg-[hsl(var(--brand-violet)/0.08)] text-foreground hover:bg-[hsl(var(--brand-violet)/0.14)]",
        ghost: "hover:bg-[hsl(var(--brand-teal)/0.08)] hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    if (asChild) {
      return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
    }
    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 600, damping: 30, mass: 0.2 }}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
