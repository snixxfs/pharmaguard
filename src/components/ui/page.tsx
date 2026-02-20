import * as React from "react";
import { cn } from "@/lib/utils";

type PageContainerProps = React.HTMLAttributes<HTMLDivElement>;

export const PageContainer = React.forwardRef<HTMLDivElement, PageContainerProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("max-w-[1280px] mx-auto px-4 md:px-6", className)}
        {...props}
      />
    );
  },
);
PageContainer.displayName = "PageContainer";

export interface PageHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  media?: React.ReactNode;
}

export const PageHero = React.forwardRef<HTMLDivElement, PageHeroProps>(
  ({ className, title, subtitle, media, children, ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-[22px] border pg-border-soft bg-background/60 backdrop-blur-md shadow-pgSoft pg-surface-3d",
          "px-6 md:px-10 py-10 md:py-16",
          className,
        )}
        {...props}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 blur-2xl opacity-70">
          <div className="h-full w-full bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20" />
        </div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 items-center">
          <div className="md:col-span-7 space-y-5">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-base md:text-lg text-muted-foreground max-w-prose">
                {subtitle}
              </p>
            ) : null}
            {children}
          </div>
          {media ? (
            <div className="md:col-span-5 flex items-center justify-center">
              <div className="rounded-[22px] border pg-border-soft bg-card/70 backdrop-blur p-4 shadow-pgSoft">
                {media}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    );
  },
);
PageHero.displayName = "PageHero";

export default PageContainer;
