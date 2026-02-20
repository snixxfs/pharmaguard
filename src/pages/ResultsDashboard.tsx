import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { AppShell } from "@/layout/AppShell";
import { getRun } from "@/state/AnalysisStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Dna, Clock, Activity, Copy, AlertTriangle, Gauge } from "lucide-react";
import { zPharmaResults } from "@/schemas/pharma";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Button as UIButton } from "@/components/ui/button";
import { triggerCopilot } from "@/components/copilot/CopilotButton";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "@/components/ui/sonner";
 
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Surface } from "@/components/ui/surface";
import { PageHero } from "@/components/ui/page";

type MetricTone = "red" | "amber" | "teal";
type MetricCardProps = {
  title: string;
  valueText: string;
  subtitle: string;
  tone: MetricTone;
  percent: number;
  icon: React.ComponentType<{ className?: string }>;
};

function MetricCard({ title, valueText, subtitle, tone, percent, icon: Icon }: MetricCardProps) {
  const clampPct = Math.max(0, Math.min(1, Number.isFinite(percent) ? percent : 0));
  const r = 26;
  const C = 2 * Math.PI * r;
  const tones: Record<MetricTone, { wrap: string; text: string; iconCircle: string; ring: string; gradFrom: string }> = {
    red:   { wrap: "bg-red-500/10 border-red-500/20", text: "text-red-800 dark:text-red-300", iconCircle: "from-red-500/20 to-transparent", ring: "text-red-500", gradFrom: "from-red-500/10" },
    amber: { wrap: "bg-amber-500/10 border-amber-500/20", text: "text-amber-800 dark:text-amber-200", iconCircle: "from-amber-500/20 to-transparent", ring: "text-amber-500", gradFrom: "from-amber-500/10" },
    teal:  { wrap: "bg-teal-500/10 border-teal-500/20", text: "text-teal-800 dark:text-teal-200", iconCircle: "from-teal-500/20 to-transparent", ring: "text-teal-500", gradFrom: "from-teal-500/10" },
  };
  const t = tones[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl border p-4 card-shadow hover:card-shadow-hover transition-transform hover:-translate-y-0.5 ${t.wrap}`}
    >
      <div className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${t.gradFrom} to-transparent`} />
      <div className="relative flex items-center gap-3">
        <div className={`shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${t.iconCircle}`}>
          <Icon className={`h-6 w-6 ${t.text}`} />
        </div>
        <div className="flex-1">
          <div className={`text-4xl font-bold leading-tight ${t.text}`}>{valueText}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
        <div className="relative h-16 w-16">
          <svg className="absolute inset-0 h-16 w-16 rotate-[-90deg]" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r={r} strokeWidth="6" className="stroke-muted-foreground/20 fill-none" />
            <motion.circle
              cx="32"
              cy="32"
              r={r}
              strokeWidth="6"
              strokeLinecap="round"
              className={`fill-none ${t.ring}`}
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: C * (1 - clampPct) }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">{`${Math.round(clampPct * 100)}%`}</div>
        </div>
      </div>
      <div className="mt-3">
        <div className="h-1.5 w-full rounded bg-muted overflow-hidden">
          <motion.div
            className={`h-full rounded bg-gradient-to-r ${t.gradFrom} to-transparent`}
            initial={{ width: 0 }}
            animate={{ width: `${clampPct * 100}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">{title}</div>
      </div>
    </motion.div>
  );
}

export default function ResultsDashboard() {
  const { runId = "" } = useParams();
  const run = getRun(runId);
  const results = run?.results || [];
  const valid = zPharmaResults.safeParse(results).success;
  const reduce = useReducedMotion();
  const gridVariants = reduce ? undefined : {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06, ease: [0.16, 1, 0.3, 1] } },
  };
  const itemVariants = reduce ? undefined : {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
  };

  const meta = useMemo(() => {
    const first = results[0];
    if (!first) return null;
    const genes = new Set<string>();
    results.forEach((r) => r.quality_metrics.genes_covered.forEach((g) => genes.add(g)));
    return {
      patient: first.patient_id,
      timestamp: first.timestamp,
      genes: Array.from(genes),
    };
  }, [results]);

  const actionNeeded = useMemo(() => {
    const sevOrder: Record<string, number> = { none: 0, low: 1, moderate: 2, high: 3, critical: 4 };
    const need = results.filter((r) => ["Toxic", "Ineffective", "Adjust Dosage"].includes(r.risk_assessment.risk_label));
    return need.sort((a, b) => (sevOrder[b.risk_assessment.severity] - sevOrder[a.risk_assessment.severity])).slice(0, 3);
  }, [results]);

  const mix = [
    { name: "Safe", value: results.filter((r) => r.risk_assessment.risk_label === "Safe").length, color: "#10B981" },
    { name: "Adjust", value: results.filter((r) => r.risk_assessment.risk_label === "Adjust Dosage").length, color: "#F59E0B" },
    { name: "Toxic/Ineff", value: results.filter((r) => ["Toxic", "Ineffective"].includes(r.risk_assessment.risk_label)).length, color: "#F43F5E" },
    { name: "Unknown", value: results.filter((r) => r.risk_assessment.risk_label === "Unknown").length, color: "#6B7280" },
  ];

  function downloadAll() {
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pharmaguard_${runId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function copyAll() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(results, null, 2));
      toast.success("Copied JSON to clipboard ✅");
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 10, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -10, filter: "blur(6px)" }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
        <PageHero
          title="Results"
          subtitle="Patient summary, risks and recommendations with explainable evidence."
        >
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">Run: {runId}</Badge>
            {valid ? <Badge className="text-xs risk-safe">Schema OK</Badge> : <Badge className="text-xs risk-warning">Schema</Badge>}
          </div>
        </PageHero>
        <div className="space-y-5">
          <div className="grid grid-cols-12 gap-4 lg:gap-5 items-start">
            {meta && (
              <div className="col-span-12">
                <Surface depth="raised" className="p-5 text-sm">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2"><Dna className="h-4 w-4" /> Patient: <span className="font-mono">{meta.patient}</span></div>
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> {new Date(meta.timestamp).toLocaleString()}</div>
                    <div className="text-muted-foreground">Genes: {meta.genes.join(", ") || "—"}</div>
                    <div className="flex-1" />
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={copyAll}><Copy className="h-4 w-4 mr-1" /> Copy JSON</Button>
                      <Button size="sm" onClick={downloadAll}><Download className="h-4 w-4 mr-1" /> Download JSON</Button>
                    </div>
                  </div>
                </Surface>
              </div>
            )}
          </div>

          <div className="grid grid-cols-12 gap-6 items-start">
            <motion.div className="col-span-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch" variants={gridVariants} initial={reduce ? undefined : "hidden"} animate={reduce ? undefined : "show"}>
          <motion.div variants={itemVariants} className="h-full">
            <MetricCard
            title="High risk"
            valueText={`${results.filter((r) => ["Toxic", "Ineffective"].includes(r.risk_assessment.risk_label)).length}`}
            subtitle={`of ${results.length} drugs`}
            tone="red"
            percent={results.length ? results.filter((r) => ["Toxic", "Ineffective"].includes(r.risk_assessment.risk_label)).length / results.length : 0}
            icon={AlertTriangle}
          />
          </motion.div>
              <motion.div variants={itemVariants} className="h-full">
              <MetricCard
            title="Action needed"
            valueText={`${results.filter((r) => ["Toxic", "Ineffective", "Adjust Dosage"].includes(r.risk_assessment.risk_label)).length}`}
            subtitle={`of ${results.length} drugs`}
            tone="amber"
            percent={results.length ? results.filter((r) => ["Toxic", "Ineffective", "Adjust Dosage"].includes(r.risk_assessment.risk_label)).length / results.length : 0}
            icon={Activity}
          />
              </motion.div>
              <motion.div variants={itemVariants} className="h-full">
              <MetricCard
            title="Avg confidence"
            valueText={`${(results.length ? results.reduce((s, r) => s + (r.risk_assessment.confidence_score || 0), 0) / results.length : 0).toFixed(2)}`}
            subtitle={`${Math.round((results.length ? results.reduce((s, r) => s + (r.risk_assessment.confidence_score || 0), 0) / results.length : 0) * 100)}% confidence`}
            tone="teal"
            percent={Math.max(0, Math.min(1, results.length ? results.reduce((s, r) => s + (r.risk_assessment.confidence_score || 0), 0) / results.length : 0))}
            icon={Gauge}
          />
              </motion.div>
              <motion.div variants={itemVariants} className="h-full">
              <Surface depth="raised" className="p-4 card-3d h-full">
            <div className="pb-2 text-sm font-medium">Risk Mix</div>
              <div className="h-28">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={mix} dataKey="value" innerRadius={22} outerRadius={42}>
                      {mix.map((m,i)=> <Cell key={m.name} fill={m.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
                {mix.map((m) => (
                  <div key={m.name} className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: m.color }} />
                    <span className="text-muted-foreground">{m.name}</span>
                    <span className="font-mono ml-auto">{m.value}</span>
                  </div>
                ))}
              </div>
            </Surface>
              </motion.div>
            </motion.div>
          </div>

        <div className="grid grid-cols-12 gap-6 items-start">
          <div className="col-span-12">
            <Surface depth="raised" className="p-4 card-3d">
              <div className="pb-2 text-sm font-semibold tracking-tight">Top Risks</div>
              <div className="divide-y">
                {actionNeeded.map((r) => {
                  const chips = r.pharmacogenomic_profile.detected_variants.slice(0, 3);
                  return (
                    <div key={r.drug} className="grid grid-cols-12 items-center gap-3 py-2">
                      <div className="col-span-12 md:col-span-4 flex items-center gap-2 min-w-0">
                        <span className="font-semibold truncate">{r.drug}</span>
                        <Badge className="px-1.5 py-0.5 text-[11px]">{r.risk_assessment.risk_label}</Badge>
                      </div>
                      <div className="col-span-12 md:col-span-6">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{r.risk_assessment.severity}</span>
                          <span className="text-sm font-medium text-muted-foreground">{r.pharmacogenomic_profile.primary_gene}</span>
                          <div className="flex flex-wrap gap-1.5">
                            {chips.map((v) => (
                              <span key={v.rsid} className="px-1.5 py-0.5 rounded-full border text-[10px]">{v.rsid}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="col-span-12 md:col-span-2 flex md:justify-end">
                        <UIButton size="sm" variant="outline" onClick={() => triggerCopilot({ runId, drug: r.drug, prefill: `Explain the risk for ${r.drug} using my evidence and phenotype.` })}>
                          Explain
                        </UIButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Surface>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 lg:gap-5 items-start">
          <div className="col-span-12 lg:col-span-7">
            <Surface depth="raised" className="p-5 h-full card-3d min-h-[320px]">
              <div className="pb-2 text-sm font-semibold tracking-tight">Genes & Phenotypes</div>
              <div className="grid grid-cols-2 md:grid-cols-3 md:grid-rows-2 auto-rows-fr items-stretch content-stretch gap-3 h-full">
                {["CYP2D6","CYP2C19","CYP2C9","SLCO1B1","TPMT","DPYD"].map((g) => {
                  const r = results.find((x) => x.pharmacogenomic_profile.primary_gene === g);
                  const ph = r?.pharmacogenomic_profile.phenotype || "—";
                  const conf = r?.risk_assessment.confidence_score?.toFixed(2) || "—";
                  return (
                    <Link key={g} to={`/results/${runId}/gene/${g}`} className="rounded border p-4 card-3d hover:card-shadow-hover transition-transform hover:-translate-y-0.5 h-full">
                      <div className="text-sm font-semibold font-mono">{g}</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-sm px-2 py-1">{ph}</Badge>
                        <span className="text-sm text-muted-foreground">Conf {conf}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Surface>
          </div>
          <div className="col-span-12 lg:col-span-5">
            <Surface depth="raised" className="p-4 h-full card-3d min-h-[320px]">
              <div className="pb-2 text-sm font-semibold tracking-tight">Drugs by Risk</div>
                <div className="divide-y">
                  {results.map((r) => (
                    <div key={r.drug} className="grid grid-cols-12 items-center gap-2 py-2">
                      <div className="col-span-6 pr-2 font-semibold truncate">{r.drug}</div>
                      <div className="col-span-4"><Badge className="px-1.5 py-0.5 text-xs">{r.risk_assessment.risk_label}</Badge></div>
                      <div className="col-span-2 text-right text-[11px] text-muted-foreground font-mono truncate">{r.pharmacogenomic_profile.primary_gene}</div>
                    </div>
                  ))}
                </div>
            </Surface>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 items-start">
          <motion.div className="col-span-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" variants={gridVariants} initial={reduce ? undefined : "hidden"} animate={reduce ? undefined : "show"}>
          {results.map((r) => {
            const label = r.risk_assessment.risk_label;
            const riskClass =
              label === "Safe" ? "risk-safe-bg" :
              label === "Adjust Dosage" ? "risk-warning-bg" :
              (label === "Toxic" || label === "Ineffective") ? "risk-danger-bg" : "risk-unknown-bg";
            return (
              <motion.div key={r.drug} variants={itemVariants}>
                <Surface depth="raised" className={`p-4 card-3d ${riskClass}`}>
                  <div className="pb-2">
                    <div className="text-base font-semibold flex items-center gap-2">
                      <span>{r.drug}</span>
                      <Badge className="text-xs">{label}</Badge>
                    </div>
                  </div>
                  <div className="text-sm space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Gene</span>
                      <span className="font-mono">{r.pharmacogenomic_profile.primary_gene}</span>
                      <span className="text-muted-foreground">Phenotype</span>
                      <span>{r.pharmacogenomic_profile.phenotype}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Evidence: {r.pharmacogenomic_profile.detected_variants.slice(0,3).map(v=>v.rsid).join(", ") || "—"}</div>
                    <Accordion type="single" collapsible>
                      <AccordionItem value="d">
                        <AccordionTrigger className="text-xs py-2">Details</AccordionTrigger>
                        <AccordionContent className="text-xs space-y-1">
                          <div>
                            <span className="font-medium">Recommendation: </span>{r.clinical_recommendation.recommendation}
                          </div>
                          {r.clinical_recommendation.dose_guidance && (
                            <div className="text-muted-foreground">{r.clinical_recommendation.dose_guidance}</div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link to={`/results/${runId}/drug/${r.drug}`}>View Drug</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/results/${runId}/gene/${r.pharmacogenomic_profile.primary_gene}`}>View Gene</Link>
                      </Button>
                      <UIButton size="sm" variant="outline" onClick={() => triggerCopilot({ runId, drug: r.drug, prefill: `Explain ${r.drug} risk and phenotype` })}>Explain</UIButton>
                    </div>
                  </div>
                </Surface>
              </motion.div>
            );
          })}
          </motion.div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12">
            <Surface depth="raised" className="p-4 card-3d">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Copilot Insights can explain risks and evidence for any drug.</div>
                <UIButton size="sm" onClick={() => triggerCopilot({ runId, drug: undefined, prefill: "Explain high‑risk drugs from my current run." })}>Open Copilot</UIButton>
              </div>
            </Surface>
          </div>
        </div>
      </div>
      </motion.div>
    </AppShell>
  );
}
