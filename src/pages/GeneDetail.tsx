import { useParams, Link } from "react-router-dom";
import { AppShell } from "@/layout/AppShell";
import { getRun } from "@/state/AnalysisStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PharmaResult } from "@/types/pharma";
import { motion } from "framer-motion";

export default function GeneDetail() {
  const { runId = "", geneSymbol = "" } = useParams();
  const run = getRun(runId);
  const results = (run?.results as PharmaResult[] | undefined) || [];
  const affecting = results.filter((r) => r.pharmacogenomic_profile.primary_gene.toUpperCase() === (geneSymbol || "").toUpperCase());
  const first = affecting[0];
  if (!first) {
    return <AppShell><div className="max-w-4xl mx-auto">No data for {geneSymbol}. <Link className="underline text-primary" to={`/results/${runId}`}>Back</Link></div></AppShell>;
  }

  const profile = first.pharmacogenomic_profile;
  const drugs = affecting.map((r) => r.drug);

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl mx-auto space-y-4"
      >
        <h2 className="text-xl font-display">{geneSymbol}</h2>
        <Card className="card-shadow">
          <CardHeader><CardTitle className="text-sm">Genotype & Phenotype</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <div>Diplotype: {profile.diplotype}</div>
            <div>Phenotype: {profile.phenotype}</div>
            <div>Confidence: {first.risk_assessment.confidence_score}</div>
          </CardContent>
        </Card>

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

        <Card className="card-shadow">
          <CardHeader><CardTitle className="text-sm">Affected Drugs</CardTitle></CardHeader>
          <CardContent className="text-sm">
            {drugs.join(", ")}
          </CardContent>
        </Card>
      </motion.div>
    </AppShell>
  );
}
