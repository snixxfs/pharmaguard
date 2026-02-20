import { AppShell } from "@/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Surface } from "@/components/ui/surface";
import { PageHero } from "@/components/ui/page";
import { AlertTriangle, Cog, Shield, Cpu } from "lucide-react";

export default function AboutPage() {
  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 10, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -10, filter: "blur(6px)" }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="space-y-4">
        <PageHero className="pg-hero-sheen card-3d" title="About PharmaGuard" subtitle="Hackathon‑grade, explainable pharmacogenomics demo — not medical advice." />

        <div className="grid md:grid-cols-2 gap-4 lg:gap-5">
          <Surface depth="raised" className="p-5 card-3d">
            <div className="flex items-center gap-2 pb-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4" /> Problem</div>
            <div className="h-[2px] w-12 mb-3 rounded-full bg-gradient-to-r from-[hsl(var(--brand-teal))] to-[hsl(var(--brand-violet))]" />
            <div className="text-sm text-muted-foreground">
              Medication response varies due to genetics. PharmaGuard demonstrates how PGx can highlight toxicity or ineffectiveness risks and guide safer choices using deterministic logic plus explainable evidence.
            </div>
          </Surface>

          <Surface depth="raised" className="p-5 card-3d">
            <div className="flex items-center gap-2 pb-2 text-sm font-semibold"><Cog className="h-4 w-4" /> How it works</div>
            <div className="h-[2px] w-12 mb-3 rounded-full bg-gradient-to-r from-[hsl(var(--brand-teal))] to-[hsl(var(--brand-violet))]" />
            <div className="text-sm">
              <ul className="list-disc pl-5 space-y-1">
                <li>Upload VCF (v4.2) → parse variants and required INFO tags.</li>
                <li>Select medications or auto‑detect from free text (LLM or keyword fallback).</li>
                <li>Deterministic engine maps star alleles → diplotype → phenotype → CPIC‑aligned recommendation.</li>
                <li>Generates strict JSON with risk label, confidence, profile, and quality metrics.</li>
              </ul>
            </div>
          </Surface>

          <Surface depth="raised" className="p-5 md:order-last card-3d">
            <div className="flex items-center gap-2 pb-2 text-sm font-semibold"><Shield className="h-4 w-4" /> Safety & disclaimer</div>
            <div className="h-[2px] w-12 mb-3 rounded-full bg-gradient-to-r from-[hsl(var(--brand-teal))] to-[hsl(var(--brand-violet))]" />
            <div className="text-sm">
              This tool is for research and education only. It is not a medical device and must not be used for clinical decisions. Always consult certified labs and clinicians.
            </div>
          </Surface>

          <Surface depth="raised" className="p-5 card-3d">
            <div className="flex items-center gap-2 pb-2 text-sm font-semibold"><Cpu className="h-4 w-4" /> Tech stack</div>
            <div className="h-[2px] w-12 mb-3 rounded-full bg-gradient-to-r from-[hsl(var(--brand-teal))] to-[hsl(var(--brand-violet))]" />
            <div className="text-sm flex flex-wrap gap-2">
              {["Vite", "React", "TypeScript", "shadcn/ui", "Tailwind", "TanStack Query", "framer-motion", "Recharts"].map(t => (
                <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
              ))}
            </div>
          </Surface>

          <Surface depth="raised" className="p-5 md:col-span-2 card-3d">
            <div className="pb-2 text-sm font-semibold">Team credits</div>
            <div className="h-[2px] w-12 mb-3 rounded-full bg-gradient-to-r from-[hsl(var(--brand-teal))] to-[hsl(var(--brand-violet))]" />
            <div className="text-sm">
              Built for hackathon demo. Contributors: Product, Engineering, Design. CPIC acknowledged for guideline references.
            </div>
          </Surface>
        </div>
      </motion.div>
    </AppShell>
  );
}
