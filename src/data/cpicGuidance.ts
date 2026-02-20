import type { Phenotype } from "@/types/pharma";

type PhenotypeGuidance = {
  phenotype: Phenotype;
  label: string;
  details: string;
  cpicRefText: "CPIC guideline";
  cpicRefUrlTextOnly: "cpicpgx.org";
};

type GuidanceEntry = {
  drug: "CODEINE" | "WARFARIN" | "CLOPIDOGREL" | "SIMVASTATIN" | "AZATHIOPRINE" | "FLUOROURACIL";
  gene: "CYP2D6" | "CYP2C9" | "CYP2C19" | "SLCO1B1" | "TPMT" | "DPYD";
  phenotypeGuidance: PhenotypeGuidance[];
  generalNote: string;
};

const genericNotes =
  "Educational only. Always consult the latest CPIC guideline and a qualified clinician.";

export const CPIC_GUIDANCE: Record<GuidanceEntry["drug"], GuidanceEntry> = {
  CODEINE: {
    drug: "CODEINE",
    gene: "CYP2D6",
    phenotypeGuidance: [
      { phenotype: "PM", label: "Avoid codeine; consider alternative", details: "Poor metabolizers have reduced activation to morphine; use alternative analgesic.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
      { phenotype: "IM", label: "Consider alternative or standard dose with caution", details: "Intermediate activity may reduce analgesia; monitor response.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
      { phenotype: "NM", label: "Use standard dosing", details: "Normal CYP2D6 activity; routine monitoring.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
      { phenotype: "RM", label: "Consider lower dose / increased monitoring", details: "Rapid metabolizers may have increased morphine exposure; monitor for adverse effects.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
      { phenotype: "URM", label: "Avoid codeine; consider alternative", details: "Ultra-rapid conversion can cause toxicity; choose non‑CYP2D6 analgesic.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
      { phenotype: "Unknown", label: "Unknown phenotype: guidance unavailable", details: "Verify annotations and consider standard care with monitoring.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
    ],
    generalNote: genericNotes,
  },
  WARFARIN: {
    drug: "WARFARIN",
    gene: "CYP2C9",
    phenotypeGuidance: [
      { phenotype: "PM", label: "Reduce starting dose / increased monitoring", details: "Reduced clearance increases bleeding risk; lower initial dose and monitor INR closely.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
      { phenotype: "IM", label: "Consider dose reduction", details: "Intermediate activity may require lower dose; monitor INR.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
      { phenotype: "NM", label: "Use standard dosing with usual monitoring", details: "Normal CYP2C9 activity; routine INR checks.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
      { phenotype: "RM", label: "Consider standard dose; monitor", details: "Rare phenotype for CYP2C9; tailor to INR response.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
      { phenotype: "URM", label: "Standard to higher dose may be required; monitor", details: "If increased metabolism suspected, adjust per INR response.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
      { phenotype: "Unknown", label: "Unknown phenotype: guidance unavailable", details: "Verify annotations and follow standard warfarin dosing with INR monitoring.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
    ],
    generalNote: genericNotes,
  },
  CLOPIDOGREL: {
    drug: "CLOPIDOGREL",
    gene: "CYP2C19",
    phenotypeGuidance: [
      { phenotype: "PM", label: "Consider alternative antiplatelet", details: "Reduced activation decreases antiplatelet effect; consider prasugrel or ticagrelor if appropriate.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
      { phenotype: "IM", label: "Consider alternative or enhanced monitoring", details: "Intermediate activation may reduce efficacy; assess thrombosis risk.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
      { phenotype: "NM", label: "Use standard dosing", details: "Normal activation; routine care.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
      { phenotype: "RM", label: "Use standard dosing", details: "Faster activation typically acceptable; monitor bleeding risk as usual.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
      { phenotype: "URM", label: "Use standard dosing", details: "Higher activation generally acceptable; standard monitoring.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
      { phenotype: "Unknown", label: "Unknown phenotype: guidance unavailable", details: "Verify annotations and consider standard therapy with clinical judgment.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
    ],
    generalNote: genericNotes,
  },
  SIMVASTATIN: {
    drug: "SIMVASTATIN",
    gene: "SLCO1B1",
    phenotypeGuidance: [
      { phenotype: "PM", label: "Consider lower dose or alternative statin", details: "Reduced hepatic uptake increases myopathy risk; consider dose reduction or alternate statin.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
      { phenotype: "IM", label: "Consider lower dose", details: "Intermediate function may elevate exposure; monitor for muscle symptoms.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
      { phenotype: "NM", label: "Use standard dosing", details: "Normal transporter function; routine monitoring.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
      { phenotype: "RM", label: "Use standard dosing", details: "Higher function typically not clinically significant; standard care.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
      { phenotype: "URM", label: "Use standard dosing", details: "Limited evidence for ultra-rapid; monitor clinically.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
      { phenotype: "Unknown", label: "Unknown phenotype: guidance unavailable", details: "Verify annotations; use standard statin care and monitoring.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
    ],
    generalNote: genericNotes,
  },
  AZATHIOPRINE: {
    drug: "AZATHIOPRINE",
    gene: "TPMT",
    phenotypeGuidance: [
      { phenotype: "PM", label: "Consider alternative therapy or drastically reduced dose", details: "Low TPMT activity raises toxicity risk; alternative or reduced dosing with close monitoring.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
      { phenotype: "IM", label: "Consider dose reduction", details: "Intermediate activity increases myelosuppression risk; reduce dose and monitor counts.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
      { phenotype: "NM", label: "Use standard dosing", details: "Normal TPMT activity; routine monitoring.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
      { phenotype: "RM", label: "Use standard dosing", details: "Rapid phenotype uncommon; treat as normal unless otherwise indicated.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
      { phenotype: "URM", label: "Use standard dosing", details: "Treat as normal; evidence limited.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
      { phenotype: "Unknown", label: "Unknown phenotype: guidance unavailable", details: "Verify annotations; use clinical judgment and monitoring.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
    ],
    generalNote: genericNotes,
  },
  FLUOROURACIL: {
    drug: "FLUOROURACIL",
    gene: "DPYD",
    phenotypeGuidance: [
      { phenotype: "PM", label: "Avoid or greatly reduce dose; consider alternative", details: "Absent/low DPD activity risks severe toxicity; avoid or drastically reduce with specialist oversight.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
      { phenotype: "IM", label: "Consider dose reduction", details: "Reduced DPD activity increases toxicity risk; use lowered dose and monitor closely.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
      { phenotype: "NM", label: "Use standard dosing", details: "Normal DPD activity; routine monitoring.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
      { phenotype: "RM", label: "Use standard dosing", details: "Rapid phenotype uncommon/uncertain; standard care with monitoring.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
      { phenotype: "URM", label: "Use standard dosing", details: "Evidence limited; manage as normal with caution.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
      { phenotype: "Unknown", label: "Unknown phenotype: guidance unavailable", details: "Verify annotations; follow standard practice with monitoring.", cpicRefText: "CPIC guideline", cpicRefUrlTextOnly: "cpicpgx.org" },
    ],
    generalNote: genericNotes,
  },
};

export function findGuidance(drug: keyof typeof CPIC_GUIDANCE, phenotype: Phenotype) {
  const entry = CPIC_GUIDANCE[drug];
  if (!entry) return null;
  const match = entry.phenotypeGuidance.find((p) => p.phenotype === phenotype) || entry.phenotypeGuidance.find((p) => p.phenotype === "Unknown");
  return { entry, match };
}

