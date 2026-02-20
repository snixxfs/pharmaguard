import { PropsWithChildren, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { PageContainer } from "@/components/ui/page";
import Searchbar from "@/components/ui/searchbar";
import CopilotButton from "@/components/copilot/CopilotButton";
import CopilotDrawer from "@/components/copilot/CopilotDrawer";
import { getLastRunId } from "@/lib/copilotContext";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import AppBackground from "@/components/visual/AppBackground";

export function AppShell({ children }: PropsWithChildren) {
  const resultsHref = useMemo(() => {
    const id = getLastRunId();
    return id ? `/results/${id}` : "/history";
  }, []);
  const location = useLocation();
  const reduce = useReducedMotion();
  return (
    <div className="min-h-screen page-bg">
      <AppBackground />
      <header className="sticky top-0 z-50">
        <PageContainer className="py-3">
          <div className="relative flex items-center justify-between gap-3 rounded-full px-3 py-2 glass-card pg-borderGlow shadow">
            <div className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-r from-[hsl(var(--brand-teal)/0.6)] via-[hsl(var(--brand-cyan)/0.4)] to-[hsl(var(--brand-violet)/0.6)]" />
            <div className="flex items-center gap-2 pl-1">
              <NavLink to="/analyze" className="flex items-center gap-2 font-bold tracking-tight rounded-full px-2 py-1 hover:pg-hover-lift">
                <Shield className="h-5 w-5 text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]" />
                <span className="text-[15px]">PharmaGuard</span>
              </NavLink>
            </div>
            <nav className="hidden md:flex items-center justify-center">
              <div className="flex items-center gap-1 rounded-full border bg-background/80 backdrop-blur px-1.5 py-1 shadow-pgSoft pg-border-soft">
                <NavLink to="/analyze" className={({isActive}) => [
                  "px-3 py-1.5 rounded-full text-sm transition-all",
                  "hover:pg-hover-lift",
                  isActive ? "text-white bg-gradient-to-r from-[hsl(var(--brand-teal))] to-[hsl(var(--brand-violet))] shadow hover:saturate-110 border border-[hsl(var(--brand-teal)/0.4)]" : "text-slate-700 hover:bg-[hsl(var(--brand-teal)/0.10)] hover:border hover:border-[hsl(var(--brand-teal)/0.20)]"
                ].join(" ")}>Analyze</NavLink>
                <NavLink to={resultsHref} className={({isActive}) => [
                  "px-3 py-1.5 rounded-full text-sm transition-all",
                  "hover:pg-hover-lift",
                  isActive ? "text-white bg-gradient-to-r from-[hsl(var(--brand-teal))] to-[hsl(var(--brand-violet))] shadow hover:saturate-110 border border-[hsl(var(--brand-teal)/0.4)]" : "text-slate-700 hover:bg-[hsl(var(--brand-teal)/0.10)] hover:border hover:border-[hsl(var(--brand-teal)/0.20)]"
                ].join(" ")}>Results</NavLink>
                <NavLink to="/knowledge" className={({isActive}) => [
                  "px-3 py-1.5 rounded-full text-sm transition-all",
                  "hover:pg-hover-lift",
                  isActive ? "text-white bg-gradient-to-r from-[hsl(var(--brand-teal))] to-[hsl(var(--brand-violet))] shadow hover:saturate-110 border border-[hsl(var(--brand-teal)/0.4)]" : "text-slate-700 hover:bg-[hsl(var(--brand-teal)/0.10)] hover:border hover:border-[hsl(var(--brand-teal)/0.20)]"
                ].join(" ")}>Knowledge</NavLink>
                <NavLink to="/history" className={({isActive}) => [
                  "px-3 py-1.5 rounded-full text-sm transition-all",
                  "hover:pg-hover-lift",
                  isActive ? "text-white bg-gradient-to-r from-[hsl(var(--brand-teal))] to-[hsl(var(--brand-violet))] shadow hover:saturate-110 border border-[hsl(var(--brand-teal)/0.4)]" : "text-slate-700 hover:bg-[hsl(var(--brand-teal)/0.10)] hover:border hover:border-[hsl(var(--brand-teal)/0.20)]"
                ].join(" ")}>History</NavLink>
                <NavLink to="/about" className={({isActive}) => [
                  "px-3 py-1.5 rounded-full text-sm transition-all",
                  "hover:pg-hover-lift",
                  isActive ? "text-white bg-gradient-to-r from-[hsl(var(--brand-teal))] to-[hsl(var(--brand-violet))] shadow hover:saturate-110 border border-[hsl(var(--brand-teal)/0.4)]" : "text-slate-700 hover:bg-[hsl(var(--brand-teal)/0.10)] hover:border hover:border-[hsl(var(--brand-teal)/0.20)]"
                ].join(" ")}>About</NavLink>
              </div>
            </nav>
            <div className="flex items-center gap-2">
              <div className="hidden md:block w-[280px]">
                <Searchbar className="glass-card bg-white/60" placeholder="Search drugs, genes, rsIDs…" />
              </div>
              <CopilotButton className="hidden md:inline-flex" />
              <NavLink to="/analyze"><Button variant="outline" className="rounded-full px-4 py-1.5">Demo</Button></NavLink>
              <ThemeToggle />
            </div>
          </div>
        </PageContainer>
      </header>
      <main className="py-8">
        <AnimatePresence mode="wait" initial={!reduce}>
          <motion.div
            key={location.pathname}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={reduce ? {} : { opacity: 1, y: 0 }}
            exit={reduce ? {} : { opacity: 0, y: 6 }}
            transition={reduce ? undefined : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <PageContainer className="space-y-4">{children}</PageContainer>
          </motion.div>
        </AnimatePresence>
      </main>
      <div className="fixed bottom-6 right-6 md:hidden">
        <CopilotButton />
      </div>
      <CopilotDrawer />
      <footer className="py-6 text-center text-xs text-muted-foreground">
        Educational only. Not medical advice.
      </footer>
    </div>
  );
}
