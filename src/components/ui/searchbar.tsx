import * as React from "react";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

type SearchbarProps = React.InputHTMLAttributes<HTMLInputElement>;

const Searchbar = React.forwardRef<HTMLInputElement, SearchbarProps>(({ className, ...props }, ref) => {
  return (
    <div className={cn("relative group", className)}>
      <div className="pointer-events-none absolute inset-0 rounded-full shadow-pgInset" />
      <div className="flex items-center gap-2 rounded-full border bg-background/70 backdrop-blur px-3 py-1.5 pg-border-soft focus-within:ring-2 focus-within:ring-[hsl(var(--ring))] focus-within:shadow-[0_0_0_4px_hsl(var(--pg-brand-cyan)/0.15)] transition-shadow">
        <Search className="h-4 w-4 text-foreground/70" />
        <input
          ref={ref}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-foreground/60"
          placeholder="Search drugs, genes, rsIDs…"
          {...props}
        />
        <kbd className="hidden md:inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium text-foreground/70 border bg-background/70">
          ⌘K
        </kbd>
      </div>
    </div>
  );
});
Searchbar.displayName = "Searchbar";

export default Searchbar;
