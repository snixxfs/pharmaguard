import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Download, Copy, ClipboardCheck, User, Clock, Dna,
  AlertTriangle, ExternalLink, FileJson, Activity, CheckCircle2, Info
} from "lucide-react";
import type { PharmaResult, RiskLabel } from "@/types/pharma";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ResultsSectionProps {
  results: PharmaResult[];
  elapsed: number;
}

const riskStyles: Record<RiskLabel, { bg: string; badge: string; text: string }> = {
  "Safe": { bg: "risk-safe-bg", badge: "risk-safe", text: "text-safe" },
  "Adjust Dosage": { bg: "risk-warning-bg", badge: "risk-warning", text: "text-warning" },
  "Toxic": { bg: "risk-danger-bg", badge: "risk-danger", text: "text-danger" },
  "Ineffective": { bg: "risk-danger-bg", badge: "risk-danger", text: "text-danger" },
  "Unknown": { bg: "risk-unknown-bg", badge: "risk-unknown", text: "text-unknown" },
};

const riskIcons: Record<RiskLabel, typeof CheckCircle2> = {
  "Safe": CheckCircle2,
  "Adjust Dosage": AlertTriangle,
  "Toxic": AlertTriangle,
  "Ineffective": AlertTriangle,
  "Unknown": Info,
};

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success(`${label} copied to clipboard`);
  });
}

function downloadJSON(result: PharmaResult, filename: string) {
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadAllJSON(results: PharmaResult[]) {
  const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pharmaguard_results_${results[0]?.patient_id || "unknown"}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ResultsSection({ results, elapsed }: ResultsSectionProps) {
  const [activeTab, setActiveTab] = useState(results[0]?.drug || "");
  const activeResult = results.find(r => r.drug === activeTab) || results[0];

  if (!activeResult) return null;

  const style = riskStyles[activeResult.risk_assessment.risk_label];
  const RiskIcon = riskIcons[activeResult.risk_assessment.risk_label];
  const qm = activeResult.quality_metrics;
  const profile = activeResult.pharmacogenomic_profile;
  const rec = activeResult.clinical_recommendation;
  const expl = activeResult.llm_generated_explanation;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-display text-foreground">Analysis Results</h2>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" /> {elapsed}ms
        </span>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr_320px] gap-6">
        {/* Left: Patient Summary */}
        <Card className="card-shadow h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Patient Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <div>
              <span className="text-muted-foreground">Patient ID</span>
              <p className="font-mono font-semibold">{activeResult.patient_id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Variants total</span>
              <p className="font-semibold">{qm.variants_total}</p>
            </div>
            <div>
              <span className="text-muted-foreground">With required tags</span>
              <p className="font-semibold">{qm.variants_with_required_tags}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Genes covered</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {qm.genes_covered.map(g => (
                  <Badge key={g} variant="outline" className="text-[10px] px-1.5 py-0">
                    {g}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Timestamp</span>
              <p className="font-mono text-[10px]">{activeResult.timestamp}</p>
            </div>
            <div>
              <span className="text-muted-foreground">File size</span>
              <p className="font-semibold">{qm.file_size_mb} MB</p>
            </div>
          </CardContent>
        </Card>

        {/* Middle: Per-drug Risk Panels */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted p-1">
              {results.map(r => {
                const s = riskStyles[r.risk_assessment.risk_label];
                return (
                  <TabsTrigger key={r.drug} value={r.drug} className="text-xs data-[state=active]:shadow-sm">
                    <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${s.badge}`} />
                    {r.drug}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {results.map(r => {
              const rs = riskStyles[r.risk_assessment.risk_label];
              const Icon = riskIcons[r.risk_assessment.risk_label];
              return (
                <TabsContent key={r.drug} value={r.drug}>
                  <Card className={`border ${rs.bg}`}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className={`h-6 w-6 ${rs.text}`} />
                            <span className={`text-2xl font-bold font-display ${rs.text}`}>
                              {r.risk_assessment.risk_label}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Confidence: <strong>{(r.risk_assessment.confidence_score * 100).toFixed(0)}%</strong>
                            {" · "}Severity: <strong>{r.risk_assessment.severity}</strong>
                          </p>
                        </div>
                        <Badge className={`${rs.badge} text-xs`}>{r.drug}</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-muted-foreground">Primary gene</span>
                          <p className="font-semibold font-mono">{r.pharmacogenomic_profile.primary_gene}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Diplotype</span>
                          <p className="font-semibold font-mono">{r.pharmacogenomic_profile.diplotype}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Phenotype</span>
                          <p className="font-semibold">{r.pharmacogenomic_profile.phenotype}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Guideline</span>
                          <p className="font-semibold">{r.clinical_recommendation.guideline_source}</p>
                        </div>
                      </div>

                      <p className="text-sm leading-relaxed border-t pt-3 border-border/50">
                        {r.clinical_recommendation.recommendation}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => copyToClipboard(JSON.stringify(r, null, 2), "JSON")}>
                          <Copy className="h-3 w-3 mr-1" /> Copy JSON
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => downloadJSON(r, `${r.patient_id}_${r.drug}.json`)}>
                          <Download className="h-3 w-3 mr-1" /> Download JSON
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => copyToClipboard(r.llm_generated_explanation.summary, "Explanation")}>
                          <ClipboardCheck className="h-3 w-3 mr-1" /> Copy Explanation
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>

        {/* Right: Evidence & Explainability */}
        <Card className="card-shadow h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <Dna className="h-4 w-4 text-primary" />
              Evidence & Explainability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full" defaultValue={["variants", "recommendation"]}>
              <AccordionItem value="variants">
                <AccordionTrigger className="text-xs font-medium">Detected Variants</AccordionTrigger>
                <AccordionContent>
                  {profile.detected_variants.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No variants detected for {profile.primary_gene}</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px]">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-1 pr-2">Gene</th>
                            <th className="text-left py-1 pr-2">rsID</th>
                            <th className="text-left py-1 pr-2">Star</th>
                            <th className="text-left py-1 pr-2">GT</th>
                            <th className="text-left py-1">Pos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {profile.detected_variants.map((v, i) => (
                            <tr key={i} className="border-b border-border/50">
                              <td className="py-1 pr-2 font-mono">{v.gene}</td>
                              <td className="py-1 pr-2 font-mono">{v.rsid}</td>
                              <td className="py-1 pr-2 font-mono">{v.star}</td>
                              <td className="py-1 pr-2 font-mono">{v.genotype}</td>
                              <td className="py-1 font-mono">{v.chrom}:{v.pos}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="pgx-profile">
                <AccordionTrigger className="text-xs font-medium">Pharmacogenomic Profile</AccordionTrigger>
                <AccordionContent className="text-xs space-y-1">
                  <p><span className="text-muted-foreground">Gene:</span> {profile.primary_gene}</p>
                  <p><span className="text-muted-foreground">Diplotype:</span> <span className="font-mono">{profile.diplotype}</span></p>
                  <p><span className="text-muted-foreground">Phenotype:</span> {profile.phenotype}</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="recommendation">
                <AccordionTrigger className="text-xs font-medium">Clinical Recommendation</AccordionTrigger>
                <AccordionContent className="text-xs space-y-2">
                  <p>{rec.dose_guidance}</p>
                  {rec.alternative_drugs.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Alternatives:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {rec.alternative_drugs.map(d => (
                          <Badge key={d} variant="outline" className="text-[10px]">{d}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    {rec.guideline_links.map((link, i) => (
                      <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 text-[10px]">
                        <ExternalLink className="h-3 w-3" /> CPIC Guideline
                      </a>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="explanation">
                <AccordionTrigger className="text-xs font-medium">Explanation</AccordionTrigger>
                <AccordionContent className="text-xs space-y-2">
                  <p className="leading-relaxed">{expl.summary}</p>
                  <div>
                    <span className="font-medium text-muted-foreground">Mechanism:</span>
                    <p className="mt-0.5 leading-relaxed">{expl.mechanism}</p>
                  </div>
                  {expl.variant_citations.length > 0 && (
                    <div>
                      <span className="font-medium text-muted-foreground">Variant citations:</span>
                      <ul className="mt-0.5 space-y-0.5">
                        {expl.variant_citations.map((c, i) => (
                          <li key={i} className="font-mono">{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-muted-foreground">What this means:</span>
                    <p className="mt-0.5 leading-relaxed">{expl.what_this_means_for_patient}</p>
                  </div>
                  <div className="text-muted-foreground italic">{expl.limitations}</div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="quality">
                <AccordionTrigger className="text-xs font-medium">Quality Metrics</AccordionTrigger>
                <AccordionContent className="text-xs space-y-1">
                  <p>Parsing: {qm.vcf_parsing_success ? "✓ Success" : "✗ Failed"}</p>
                  <p>File: {qm.file_size_mb} MB</p>
                  <p>Total variants: {qm.variants_total}</p>
                  <p>Tagged variants: {qm.variants_with_required_tags}</p>
                  {qm.missing_required_tags.length > 0 && (
                    <details>
                      <summary className="text-warning cursor-pointer">Missing tags ({qm.missing_required_tags.length})</summary>
                      <ul className="mt-1 space-y-0.5 text-muted-foreground">
                        {qm.missing_required_tags.map((t, i) => <li key={i}>• {t}</li>)}
                      </ul>
                    </details>
                  )}
                  <p className="text-muted-foreground">{qm.notes}</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>

      {/* Download Center */}
      <Card className="card-shadow">
        <CardContent className="py-4 flex flex-wrap items-center gap-3">
          <FileJson className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Download Center</span>
          <div className="flex-1" />
          <Button size="sm" variant="outline" className="text-xs" onClick={() => downloadJSON(activeResult, `${activeResult.patient_id}_${activeResult.drug}.json`)}>
            <Download className="h-3 w-3 mr-1" /> Current Drug JSON
          </Button>
          <Button size="sm" onClick={() => downloadAllJSON(results)} className="text-xs">
            <Download className="h-3 w-3 mr-1" /> All Results JSON
          </Button>
        </CardContent>
      </Card>
    </motion.section>
  );
}
