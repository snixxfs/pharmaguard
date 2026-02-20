import { useMemo, useState } from "react";
import { AppShell } from "@/layout/AppShell";
import { listRuns, getRun } from "@/state/AnalysisStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate, Link } from "react-router-dom";
import { Trash2, Download, ArrowRightLeft } from "lucide-react";
import type { PharmaResult } from "@/types/pharma";
import { zPharmaResults } from "@/schemas/pharma";
import { motion } from "framer-motion";
import { Surface } from "@/components/ui/surface";
import { PageHero } from "@/components/ui/page";

export default function HistoryPage() {
  const nav = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const runs = useMemo(() => listRuns(), []);

  function del(id: string) {
    localStorage.removeItem(`pharmaguard:run:${id}`);
    const idx = JSON.parse(localStorage.getItem("pharmaguard:history") || "[]") as string[];
    localStorage.setItem("pharmaguard:history", JSON.stringify(idx.filter((x) => x !== id)));
    location.reload();
  }

  function dl(id: string) {
    const run = getRun(id);
    if (!run) return;
    const blob = new Blob([JSON.stringify(run.results, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pharmaguard_${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const compareReady = selected.length === 2;
  const comp = compareReady
    ? (() => {
        const a = getRun(selected[0])?.results as PharmaResult[] | undefined;
        const b = getRun(selected[1])?.results as PharmaResult[] | undefined;
        if (!a || !b) return null;
        const ahigh = a.filter((r) => ["Toxic", "Ineffective"].includes(r.risk_assessment.risk_label)).map((r) => r.drug);
        const bhigh = b.filter((r) => ["Toxic", "Ineffective"].includes(r.risk_assessment.risk_label)).map((r) => r.drug);
        return { onlyA: ahigh.filter((d) => !bhigh.includes(d)), onlyB: bhigh.filter((d) => !ahigh.includes(d)) };
      })()
    : null;

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 10, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -10, filter: "blur(6px)" }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="space-y-4">
        <PageHero className="pg-hero-sheen" title="History" subtitle="Browse past analyses and compare high‑risk outcomes." />

        {runs.length === 0 ? (
          <Surface depth="raised" className="p-6 text-center text-muted-foreground glass-card card-3d">
            <div className="h-24 rounded-xl bg-gradient-to-r from-[hsl(var(--brand-teal)/0.15)] via-[hsl(var(--brand-cyan)/0.12)] to-[hsl(var(--brand-violet)/0.15)] mb-3" />
            No runs yet. <Link className="underline text-primary" to="/analyze">Analyze a VCF</Link>
          </Surface>
        ) : (
          <div className="relative pl-4">
            <div className="absolute left-1 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-3">
              {runs.map((r: { runId: string; createdAt: string; results: PharmaResult[] }, idx) => {
                const res = r.results;
                const valid = zPharmaResults.safeParse(res).success;
                const first = res[0];
                const highRisk = res.filter((x) => ["Toxic", "Ineffective"].includes(x.risk_assessment.risk_label)).length;
                const geneSet = new Set<string>();
                res.forEach((x) => x.quality_metrics.genes_covered.forEach((g) => geneSet.add(g)));
                return (
                  <motion.div key={r.runId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                    <div className="relative pl-6">
                      <span className="absolute left-0 top-4 inline-block h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/20" />
                      <Surface depth="raised" className="p-4 hover:card-shadow-hover transition-transform hover:-translate-y-0.5 glass-card card-3d">
                          <div className="grid grid-cols-12 items-center gap-3">
                            <div className="col-span-12 md:col-span-7 space-y-1">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={selected.includes(r.runId)}
                                  onChange={(e) =>
                                    setSelected((old) => (e.target.checked ? [...old, r.runId] : old.filter((x) => x !== r.runId)))
                                  }
                                />
                                <div className="font-mono text-xs rounded px-2 py-0.5 border bg-muted">{new Date(r.createdAt).toLocaleString()}</div>
                              </div>
                              <div className="text-sm">Patient: <span className="font-mono">{first?.patient_id}</span></div>
                              <div className="text-xs text-muted-foreground truncate">Drugs: {res.map((x) => x.drug).join(", ")}</div>
                            </div>
                            <div className="col-span-12 md:col-span-5 flex md:justify-end items-center gap-2">
                              <Badge variant="outline" className="text-xs">High risk: {highRisk}</Badge>
                              <Badge variant="outline" className="text-xs">Gene coverage: {geneSet.size}/6</Badge>
                              {valid ? <Badge className="text-xs risk-safe">Schema OK</Badge> : <Badge className="text-xs risk-warning">Schema</Badge>}
                              <Button size="sm" onClick={() => nav(`/results/${r.runId}`)}>Open</Button>
                              <Button size="sm" variant="secondary" onClick={() => dl(r.runId)}><Download className="h-4 w-4 mr-1" /> JSON</Button>
                              <Button size="sm" variant="outline" onClick={() => del(r.runId)}><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
                            </div>
                          </div>
                      </Surface>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        <Surface depth="raised" className="p-4">
          <div className="pb-2 text-sm flex items-center gap-2 font-semibold tracking-tight"><ArrowRightLeft className="h-4 w-4" /> Compare mode</div>
          <div className="text-sm">
            <div className="text-xs text-muted-foreground mb-2">Select any two runs above to compare high‑risk drugs.</div>
            {compareReady && comp ? (
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <div className="font-medium mb-1">Only in first run</div>
                  <div className="text-xs">{comp.onlyA.join(", ") || "None"}</div>
                </div>
                <div>
                  <div className="font-medium mb-1">Only in second run</div>
                  <div className="text-xs">{comp.onlyB.join(", ") || "None"}</div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">Pick two runs to see differences.</div>
            )}
          </div>
        </Surface>
      </motion.div>
    </AppShell>
  );
}
