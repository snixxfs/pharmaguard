import { useParams, Link } from "react-router-dom";
import { AppShell } from "@/layout/AppShell";
import { getRun } from "@/state/AnalysisStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { triggerCopilot } from "@/components/copilot/CopilotButton";
import type { PharmaResult } from "@/types/pharma";
import { findGuidance, CPIC_GUIDANCE } from "@/data/cpicGuidance";
import { motion } from "framer-motion";

export default function DrugDetail() {
  const { runId = "", drugName = "" } = useParams();
  const run = getRun(runId);
  const result = (run?.results as PharmaResult[] | undefined)?.find((r) => r.drug.toUpperCase() === (drugName || "").toUpperCase());
  if (!result) {
    return <AppShell><div className="max-w-4xl mx-auto">No data for {drugName}. <Link className="underline text-primary" to={`/results/${runId}`}>Back</Link></div></AppShell>;
  }

  const expl = result.llm_generated_explanation;
  const profile = result.pharmacogenomic_profile;
  const g = findGuidance(result.drug as keyof typeof CPIC_GUIDANCE, profile.phenotype);

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl mx-auto space-y-4"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-display">{result.drug}</h2>
          <Badge className="text-xs">{result.risk_assessment.risk_label}</Badge>
        </div>

        <Tabs defaultValue="rec">
          <TabsList>
            <TabsTrigger value="rec">Recommendation</TabsTrigger>
            <TabsTrigger value="mech">Mechanism</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
            <TabsTrigger value="chain">Genotype→Phenotype</TabsTrigger>
          </TabsList>

          <TabsContent value="rec">
            <Card className="card-shadow">
              <CardHeader><CardTitle className="text-sm">Clinical Recommendation</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <div>{result.clinical_recommendation.recommendation}</div>
                <div className="text-muted-foreground text-xs">{result.clinical_recommendation.dose_guidance}</div>
                <div className="pt-2 border-t">
                  <div className="text-xs font-medium">Dosage guidance (CPIC‑aligned)</div>
                  {g ? (
                    <div className="text-sm">
                      <div className="font-medium">{g.match?.label}</div>
                      <div className="text-muted-foreground text-xs">{g.match?.details}</div>
                      <div className="text-[11px] text-muted-foreground mt-1">CPIC reference: {g.match?.cpicRefText} ({g.match?.cpicRefUrlTextOnly}) · {g.entry.generalNote}</div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">Unknown phenotype: guidance unavailable; verify annotations.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mech">
            <Card className="card-shadow">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Mechanism & Rationale</CardTitle>
                <Button size="sm" variant="outline" onClick={() => triggerCopilot({ runId, drug: result.drug, prefill: "Explain Mechanism using my evidence" })}>Explain</Button>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="font-medium">{expl.summary}</div>
                <p className="text-muted-foreground">{expl.mechanism}</p>
                <ul className="text-xs list-disc pl-5">
                  {expl.variant_citations.map((c: string) => <li key={c}>{c}</li>)}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evidence">
            <Card className="card-shadow">
              <CardHeader><CardTitle className="text-sm">Detected Variants</CardTitle></CardHeader>
              <CardContent>
                <div className="text-xs grid grid-cols-1 gap-2">
                  {profile.detected_variants.map((v) => (
                    <div key={v.rsid} className="rounded border p-2 flex flex-wrap gap-3">
                      <span className="font-mono">{v.rsid}</span>
                      <span>{v.gene}</span>
                      <span>{v.star}</span>
                      <span className="text-muted-foreground">{v.genotype}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chain">
            <Card className="card-shadow">
              <CardHeader><CardTitle className="text-sm">Diplotype → Phenotype → Risk</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <div>Gene: <span className="font-mono">{profile.primary_gene}</span></div>
                <div>Diplotype: {profile.diplotype}</div>
                <div>Phenotype: {profile.phenotype}</div>
                <div>Risk: {result.risk_assessment.risk_label} ({result.risk_assessment.severity})</div>
                <div className="text-xs text-muted-foreground">{expl.what_this_means_for_patient}</div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </AppShell>
  );
}
