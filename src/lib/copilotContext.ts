import { DRUG_INFO, GENE_INFO } from "@/data/knowledge";
import { getRun } from "@/state/AnalysisStore";
import type { PharmaResult } from "@/types/pharma";

export function getLastRunId(): string | null {
  const idx = JSON.parse(localStorage.getItem("pharmaguard:history") || "[]") as string[];
  return idx.length ? idx[idx.length - 1] : null;
}

export function buildCopilotContext(runId?: string, focus?: { drug?: string; gene?: string }): string {
  const id = runId || getLastRunId() || "";
  const run = id ? getRun(id) : null;
  const results = (run?.results as PharmaResult[] | undefined) || [];
  const meta = run
    ? {
        patient: results[0]?.patient_id || "unknown",
        timestamp: run.createdAt,
      }
    : null;

  const pick = focus?.drug
    ? results.filter((r) => r.drug.toUpperCase() === (focus!.drug || "").toUpperCase())
    : focus?.gene
    ? results.filter((r) => r.pharmacogenomic_profile.primary_gene.toUpperCase() === (focus!.gene || "").toUpperCase())
    : results;

  const riskCounts = {
    safe: results.filter((r) => r.risk_assessment.risk_label === "Safe").length,
    adjust: results.filter((r) => r.risk_assessment.risk_label === "Adjust Dosage").length,
    high: results.filter((r) => ["Toxic", "Ineffective"].includes(r.risk_assessment.risk_label)).length,
    unknown: results.filter((r) => r.risk_assessment.risk_label === "Unknown").length,
  };

  const lines: string[] = [];
  if (meta) lines.push(`Patient: ${meta.patient} | Timestamp: ${meta.timestamp}`);
  lines.push(`Summary: High=${riskCounts.high}, Adjust=${riskCounts.adjust}, Safe=${riskCounts.safe}, Unknown=${riskCounts.unknown}`);
  lines.push(`Results (${pick.length}):`);
  pick.forEach((r) => {
    const vars = r.pharmacogenomic_profile.detected_variants.map((v) => v.rsid).join(", ");
    lines.push(
      `- ${r.drug} | Gene=${r.pharmacogenomic_profile.primary_gene} | Phenotype=${r.pharmacogenomic_profile.phenotype} | Risk=${r.risk_assessment.risk_label} (${r.risk_assessment.severity}) | Variants=${vars}`
    );
    const ev = r.pharmacogenomic_profile.detected_variants.map((v) => v.rsid).filter(Boolean);
    lines.push(`Evidence IDs for ${r.drug}: ${ev.length ? ev.join(", ") : "None"}`);
  });

  const genes = Array.from(new Set(pick.map((r) => r.pharmacogenomic_profile.primary_gene)));
  const drugs = Array.from(new Set(pick.map((r) => r.drug)));

  lines.push("Knowledge:");
  genes.forEach((g) => {
    const k = GENE_INFO[g];
    if (k) {
      lines.push(`GENE ${g}: ${k.about}`);
      lines.push(`Phenotypes: ${k.phenotypes.join("; ")}`);
    }
  });
  drugs.forEach((d) => {
    const k = DRUG_INFO[d.toUpperCase() as keyof typeof DRUG_INFO];
    if (k) {
      lines.push(`DRUG ${d}: primary genes ${k.primaryGenes.join(", ")}; actions: ${k.actions.join("; ")}`);
    }
  });
  lines.push("Rules:");
  lines.push("- Cite at least one evidence id for any genetic rationale using brackets, e.g., [rs4244285].");
  lines.push("- Do not cite ids not present in the Evidence IDs list above.");
  lines.push('- Add a Mechanism paragraph: gene → enzyme function → drug activation/metabolism → clinical effect.');
  lines.push('- If no evidence ids are available, explicitly state: "No variant evidence available in this file."');
  lines.push("End of context.");
  return lines.join("\n");
}

export function saveAIArtifact(runId: string, kind: "summary" | "checklist" | "mode", content: string) {
  const key = `pharmaguard:ai:${runId}`;
  const obj = JSON.parse(localStorage.getItem(key) || "{}");
  obj[kind] = content;
  localStorage.setItem(key, JSON.stringify(obj));
}

export function loadAIArtifact(runId: string) {
  const key = `pharmaguard:ai:${runId}`;
  return JSON.parse(localStorage.getItem(key) || "{}");
}
