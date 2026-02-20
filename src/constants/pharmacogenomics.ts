import type { SupportedDrug, SupportedGene, RiskLabel, Severity, Phenotype } from "@/types/pharma";

export const SUPPORTED_DRUGS: SupportedDrug[] = [
  "CODEINE", "WARFARIN", "CLOPIDOGREL", "SIMVASTATIN", "AZATHIOPRINE", "FLUOROURACIL"
];

export const SUPPORTED_GENES: SupportedGene[] = [
  "CYP2D6", "CYP2C19", "CYP2C9", "SLCO1B1", "TPMT", "DPYD"
];

export const DRUG_PRIMARY_GENE: Record<SupportedDrug, SupportedGene> = {
  CODEINE: "CYP2D6",
  WARFARIN: "CYP2C9",
  CLOPIDOGREL: "CYP2C19",
  SIMVASTATIN: "SLCO1B1",
  AZATHIOPRINE: "TPMT",
  FLUOROURACIL: "DPYD",
};

export const CPIC_LINKS: Record<SupportedDrug, string[]> = {
  CODEINE: ["https://cpicpgx.org/guidelines/guideline-for-codeine-and-cyp2d6/"],
  WARFARIN: ["https://cpicpgx.org/guidelines/guideline-for-warfarin-and-cyp2c9/"],
  CLOPIDOGREL: ["https://cpicpgx.org/guidelines/guideline-for-clopidogrel-and-cyp2c19/"],
  SIMVASTATIN: ["https://cpicpgx.org/guidelines/cpic-guideline-for-statins/"],
  AZATHIOPRINE: ["https://cpicpgx.org/guidelines/guideline-for-thiopurines-and-tpmt/"],
  FLUOROURACIL: ["https://cpicpgx.org/guidelines/guideline-for-fluoropyrimidines-and-dpyd/"],
};

// Star allele function classifications
export type AlleleFunction = "normal" | "increased" | "decreased" | "no_function";

export const STAR_ALLELE_FUNCTION: Record<string, Record<string, AlleleFunction>> = {
  CYP2D6: {
    "*1": "normal", "*2": "normal", "*33": "normal", "*35": "normal",
    "*3": "no_function", "*4": "no_function", "*5": "no_function", "*6": "no_function",
    "*4x2": "no_function",
    "*9": "decreased", "*10": "decreased", "*17": "decreased", "*29": "decreased", "*41": "decreased",
  },
  CYP2C19: {
    "*1": "normal",
    "*2": "no_function", "*3": "no_function", "*4": "no_function",
    "*17": "increased",
  },
  CYP2C9: {
    "*1": "normal",
    "*2": "decreased", "*3": "decreased", "*5": "decreased", "*6": "decreased",
    "*8": "decreased", "*11": "decreased",
  },
  SLCO1B1: {
    "*1": "normal", "*1a": "normal", "*1b": "normal",
    "*5": "decreased", "*15": "decreased", "*17": "decreased",
  },
  TPMT: {
    "*1": "normal",
    "*2": "no_function", "*3A": "no_function", "*3B": "no_function", "*3C": "no_function",
  },
  DPYD: {
    "*1": "normal",
    "*2A": "no_function", "*13": "no_function",
    "HapB3": "decreased", "c.1129-5923C>G": "decreased",
  },
};

// Map two allele functions to phenotype
export function derivePhenotype(gene: string, func1: AlleleFunction, func2: AlleleFunction): Phenotype {
  const funcs = [func1, func2].sort();
  
  // Special CYP2D6 URM handling not covered here (needs DUP tag)
  
  if (funcs[0] === "no_function" && funcs[1] === "no_function") return "PM";
  if (funcs[0] === "no_function" && funcs[1] === "decreased") return "PM";
  if (funcs[0] === "no_function" && funcs[1] === "normal") return "IM";
  if (funcs[0] === "no_function" && funcs[1] === "increased") return "IM";
  if (funcs[0] === "decreased" && funcs[1] === "decreased") return "IM";
  if (funcs[0] === "decreased" && funcs[1] === "normal") return "IM";
  if (funcs[0] === "decreased" && funcs[1] === "increased") return "NM";
  if (funcs[0] === "normal" && funcs[1] === "normal") return "NM";
  if (funcs[0] === "normal" && funcs[1] === "increased") return "RM";
  if (funcs[0] === "increased" && funcs[1] === "increased") return "URM";
  
  return "Unknown";
}

// Drug decision rules
export interface DrugDecision {
  riskLabel: RiskLabel;
  severity: Severity;
  confidenceBase: number;
  recommendation: string;
  doseGuidance: string;
  alternativeDrugs: string[];
}

export function getDrugDecision(drug: SupportedDrug, phenotype: Phenotype): DrugDecision {
  const unknown: DrugDecision = {
    riskLabel: "Unknown",
    severity: "low",
    confidenceBase: 0.25,
    recommendation: "Insufficient pharmacogenomic data available. Standard prescribing applies pending further genetic testing.",
    doseGuidance: "Follow standard dosing guidelines. Consider pharmacogenomic testing for personalized dosing.",
    alternativeDrugs: [],
  };

  if (phenotype === "Unknown") return unknown;

  const rules: Record<SupportedDrug, Partial<Record<Phenotype, DrugDecision>>> = {
    CODEINE: {
      PM: { riskLabel: "Ineffective", severity: "high", confidenceBase: 0.90, recommendation: "Avoid codeine. CYP2D6 poor metabolizer status results in insufficient conversion to morphine, leading to inadequate pain relief.", doseGuidance: "Do not prescribe codeine. Consider alternative analgesics not dependent on CYP2D6 metabolism.", alternativeDrugs: ["morphine", "oxycodone", "non-opioid analgesics"] },
      IM: { riskLabel: "Ineffective", severity: "moderate", confidenceBase: 0.85, recommendation: "Codeine may provide reduced analgesia. CYP2D6 intermediate metabolizer status leads to decreased morphine formation.", doseGuidance: "Consider alternative analgesics. If codeine is used, monitor closely for efficacy.", alternativeDrugs: ["tramadol", "morphine", "non-opioid analgesics"] },
      NM: { riskLabel: "Safe", severity: "none", confidenceBase: 0.90, recommendation: "Standard codeine metabolism expected. Normal CYP2D6 activity provides adequate morphine conversion.", doseGuidance: "Use standard dosing per clinical guidelines.", alternativeDrugs: [] },
      RM: { riskLabel: "Safe", severity: "low", confidenceBase: 0.85, recommendation: "Rapid metabolism may lead to slightly higher morphine levels. Monitor for enhanced response.", doseGuidance: "Use standard or slightly reduced dosing. Monitor for increased opioid effects.", alternativeDrugs: [] },
      URM: { riskLabel: "Toxic", severity: "critical", confidenceBase: 0.92, recommendation: "AVOID codeine. Ultrarapid CYP2D6 metabolism causes excessive morphine formation, risking life-threatening respiratory depression.", doseGuidance: "Do NOT prescribe codeine. This is a critical safety concern.", alternativeDrugs: ["morphine (at reduced dose with monitoring)", "non-opioid analgesics", "acetaminophen"] },
    },
    CLOPIDOGREL: {
      PM: { riskLabel: "Ineffective", severity: "critical", confidenceBase: 0.90, recommendation: "Clopidogrel is a prodrug requiring CYP2C19 activation. Poor metabolizer status results in significantly reduced antiplatelet effect and increased cardiovascular risk.", doseGuidance: "Avoid clopidogrel. Use alternative antiplatelet agents.", alternativeDrugs: ["prasugrel", "ticagrelor"] },
      IM: { riskLabel: "Ineffective", severity: "high", confidenceBase: 0.85, recommendation: "Reduced clopidogrel activation expected. Intermediate metabolizer status may lead to suboptimal antiplatelet response.", doseGuidance: "Consider alternative antiplatelet therapy or increased monitoring.", alternativeDrugs: ["prasugrel", "ticagrelor"] },
      NM: { riskLabel: "Safe", severity: "none", confidenceBase: 0.90, recommendation: "Normal CYP2C19 metabolism supports standard clopidogrel activation and antiplatelet efficacy.", doseGuidance: "Use standard dosing per clinical guidelines.", alternativeDrugs: [] },
      RM: { riskLabel: "Safe", severity: "none", confidenceBase: 0.88, recommendation: "Enhanced clopidogrel activation. Standard efficacy expected.", doseGuidance: "Use standard dosing.", alternativeDrugs: [] },
      URM: { riskLabel: "Safe", severity: "none", confidenceBase: 0.85, recommendation: "Ultrarapid metabolism may enhance clopidogrel activation. Standard efficacy expected.", doseGuidance: "Use standard dosing.", alternativeDrugs: [] },
    },
    WARFARIN: {
      PM: { riskLabel: "Adjust Dosage", severity: "high", confidenceBase: 0.85, recommendation: "CYP2C9 poor metabolizer status results in significantly reduced warfarin clearance, increasing bleeding risk at standard doses.", doseGuidance: "Consider 50-80% dose reduction. Initiate at lower dose with frequent INR monitoring.", alternativeDrugs: ["direct oral anticoagulants (DOACs)", "apixaban", "rivaroxaban"] },
      IM: { riskLabel: "Adjust Dosage", severity: "moderate", confidenceBase: 0.82, recommendation: "CYP2C9 intermediate metabolizer status leads to decreased warfarin clearance. Dose adjustment recommended.", doseGuidance: "Consider 20-50% dose reduction. Monitor INR closely during initiation.", alternativeDrugs: ["apixaban", "rivaroxaban"] },
      NM: { riskLabel: "Safe", severity: "none", confidenceBase: 0.80, recommendation: "Normal CYP2C9 metabolism. Note: VKORC1 genotype (not tested here) also significantly affects warfarin sensitivity.", doseGuidance: "Use standard dosing algorithm. Consider VKORC1 testing for comprehensive dosing.", alternativeDrugs: [] },
      RM: { riskLabel: "Safe", severity: "low", confidenceBase: 0.75, recommendation: "Normal to rapid warfarin metabolism. Standard dosing likely appropriate.", doseGuidance: "Use standard dosing. May require higher maintenance dose.", alternativeDrugs: [] },
      URM: { riskLabel: "Safe", severity: "low", confidenceBase: 0.70, recommendation: "Rapid warfarin clearance possible. May need higher doses.", doseGuidance: "Monitor INR and adjust dose upward if needed.", alternativeDrugs: [] },
    },
    SIMVASTATIN: {
      PM: { riskLabel: "Adjust Dosage", severity: "high", confidenceBase: 0.88, recommendation: "SLCO1B1 poor function leads to significantly increased simvastatin plasma levels, greatly elevating myopathy/rhabdomyolysis risk.", doseGuidance: "Prescribe a lower dose of simvastatin (≤20mg) or use an alternative statin with lower SLCO1B1 dependence.", alternativeDrugs: ["pravastatin", "rosuvastatin", "fluvastatin"] },
      IM: { riskLabel: "Adjust Dosage", severity: "moderate", confidenceBase: 0.85, recommendation: "SLCO1B1 decreased function increases simvastatin exposure and myopathy risk.", doseGuidance: "Avoid simvastatin doses >20mg. Consider alternative statin. Monitor for muscle symptoms.", alternativeDrugs: ["pravastatin", "rosuvastatin"] },
      NM: { riskLabel: "Safe", severity: "none", confidenceBase: 0.88, recommendation: "Normal SLCO1B1 transporter function. Standard simvastatin metabolism expected.", doseGuidance: "Use standard dosing per clinical guidelines.", alternativeDrugs: [] },
      RM: { riskLabel: "Safe", severity: "none", confidenceBase: 0.85, recommendation: "Normal statin transport function.", doseGuidance: "Use standard dosing.", alternativeDrugs: [] },
      URM: { riskLabel: "Safe", severity: "none", confidenceBase: 0.82, recommendation: "Enhanced transporter function may reduce drug exposure.", doseGuidance: "Use standard dosing. May need dose verification.", alternativeDrugs: [] },
    },
    AZATHIOPRINE: {
      PM: { riskLabel: "Toxic", severity: "critical", confidenceBase: 0.92, recommendation: "TPMT deficiency causes dangerous accumulation of thioguanine nucleotides, leading to severe, potentially fatal myelosuppression.", doseGuidance: "Drastically reduce dose (use ≤10% of standard dose) or avoid azathioprine entirely. If used, requires very close hematologic monitoring.", alternativeDrugs: ["mycophenolate mofetil", "alternative immunosuppressants"] },
      IM: { riskLabel: "Toxic", severity: "high", confidenceBase: 0.88, recommendation: "Reduced TPMT activity increases risk of myelosuppression with standard azathioprine doses.", doseGuidance: "Reduce dose by 30-70% of standard dose. Monitor CBC frequently.", alternativeDrugs: ["mycophenolate mofetil"] },
      NM: { riskLabel: "Safe", severity: "none", confidenceBase: 0.90, recommendation: "Normal TPMT activity. Standard azathioprine metabolism expected.", doseGuidance: "Use standard dosing with routine monitoring.", alternativeDrugs: [] },
      RM: { riskLabel: "Safe", severity: "none", confidenceBase: 0.85, recommendation: "Normal to high TPMT activity.", doseGuidance: "Use standard dosing.", alternativeDrugs: [] },
      URM: { riskLabel: "Safe", severity: "low", confidenceBase: 0.78, recommendation: "High TPMT activity may reduce drug efficacy.", doseGuidance: "Standard dosing. Monitor therapeutic response; may need dose increase.", alternativeDrugs: [] },
    },
    FLUOROURACIL: {
      PM: { riskLabel: "Toxic", severity: "critical", confidenceBase: 0.93, recommendation: "DPYD deficiency causes severely impaired fluorouracil catabolism, leading to life-threatening toxicity including severe mucositis, myelosuppression, and neurotoxicity.", doseGuidance: "AVOID fluorouracil and capecitabine entirely. If essential, use ≤25% of standard dose with intensive monitoring.", alternativeDrugs: ["raltitrexed", "alternative non-fluoropyrimidine regimens"] },
      IM: { riskLabel: "Toxic", severity: "high", confidenceBase: 0.88, recommendation: "Partial DPYD deficiency increases risk of severe fluorouracil toxicity.", doseGuidance: "Reduce initial dose by ≥50%. Closely monitor for toxicity signs and titrate cautiously.", alternativeDrugs: ["raltitrexed"] },
      NM: { riskLabel: "Safe", severity: "none", confidenceBase: 0.88, recommendation: "Normal DPYD activity. Standard fluorouracil catabolism expected.", doseGuidance: "Use standard dosing per oncology protocol.", alternativeDrugs: [] },
      RM: { riskLabel: "Safe", severity: "none", confidenceBase: 0.85, recommendation: "Normal DPYD function.", doseGuidance: "Use standard dosing.", alternativeDrugs: [] },
      URM: { riskLabel: "Safe", severity: "none", confidenceBase: 0.80, recommendation: "Enhanced DPYD activity. May have reduced fluorouracil efficacy.", doseGuidance: "Standard dosing; monitor therapeutic response.", alternativeDrugs: [] },
    },
  };

  return rules[drug]?.[phenotype] ?? unknown;
}

// VCF Builder presets
export interface VCFBuilderVariant {
  chrom: string;
  pos: number;
  id: string;
  ref: string;
  alt: string;
  gene: SupportedGene;
  star: string;
  rs: string;
  genotype: string;
}

export const AVAILABLE_VARIANTS: Record<SupportedGene, VCFBuilderVariant[]> = {
  CYP2D6: [
    { chrom: "chr22", pos: 42128945, id: "rs3892097", ref: "C", alt: "T", gene: "CYP2D6", star: "*4", rs: "rs3892097", genotype: "0/1" },
    { chrom: "chr22", pos: 42126611, id: "rs16947", ref: "G", alt: "A", gene: "CYP2D6", star: "*2", rs: "rs16947", genotype: "0/1" },
    { chrom: "chr22", pos: 42127941, id: "rs1135840", ref: "C", alt: "G", gene: "CYP2D6", star: "*1", rs: "rs1135840", genotype: "0/1" },
    { chrom: "chr22", pos: 42130692, id: "rs5030655", ref: "T", alt: ".", gene: "CYP2D6", star: "*6", rs: "rs5030655", genotype: "0/1" },
    { chrom: "chr22", pos: 42127803, id: "rs1065852", ref: "C", alt: "T", gene: "CYP2D6", star: "*10", rs: "rs1065852", genotype: "0/1" },
    { chrom: "chr22", pos: 42126938, id: "rs28371706", ref: "C", alt: "T", gene: "CYP2D6", star: "*17", rs: "rs28371706", genotype: "0/1" },
  ],
  CYP2C19: [
    { chrom: "chr10", pos: 96541616, id: "rs4244285", ref: "G", alt: "A", gene: "CYP2C19", star: "*2", rs: "rs4244285", genotype: "0/1" },
    { chrom: "chr10", pos: 96540410, id: "rs4986893", ref: "G", alt: "A", gene: "CYP2C19", star: "*3", rs: "rs4986893", genotype: "0/1" },
    { chrom: "chr10", pos: 96522463, id: "rs12248560", ref: "C", alt: "T", gene: "CYP2C19", star: "*17", rs: "rs12248560", genotype: "0/1" },
  ],
  CYP2C9: [
    { chrom: "chr10", pos: 96702047, id: "rs1799853", ref: "C", alt: "T", gene: "CYP2C9", star: "*2", rs: "rs1799853", genotype: "0/1" },
    { chrom: "chr10", pos: 96741053, id: "rs1057910", ref: "A", alt: "C", gene: "CYP2C9", star: "*3", rs: "rs1057910", genotype: "0/1" },
  ],
  SLCO1B1: [
    { chrom: "chr12", pos: 21331549, id: "rs4149056", ref: "T", alt: "C", gene: "SLCO1B1", star: "*5", rs: "rs4149056", genotype: "0/1" },
    { chrom: "chr12", pos: 21329738, id: "rs2306283", ref: "A", alt: "G", gene: "SLCO1B1", star: "*1b", rs: "rs2306283", genotype: "0/1" },
  ],
  TPMT: [
    { chrom: "chr6", pos: 18130918, id: "rs1800462", ref: "C", alt: "G", gene: "TPMT", star: "*2", rs: "rs1800462", genotype: "0/1" },
    { chrom: "chr6", pos: 18143724, id: "rs1800460", ref: "T", alt: "C", gene: "TPMT", star: "*3B", rs: "rs1800460", genotype: "0/1" },
    { chrom: "chr6", pos: 18139228, id: "rs1142345", ref: "A", alt: "G", gene: "TPMT", star: "*3C", rs: "rs1142345", genotype: "0/1" },
  ],
  DPYD: [
    { chrom: "chr1", pos: 97915614, id: "rs3918290", ref: "C", alt: "T", gene: "DPYD", star: "*2A", rs: "rs3918290", genotype: "0/1" },
    { chrom: "chr1", pos: 97981395, id: "rs55886062", ref: "A", alt: "C", gene: "DPYD", star: "*13", rs: "rs55886062", genotype: "0/1" },
    { chrom: "chr1", pos: 97547947, id: "rs75017182", ref: "G", alt: "C", gene: "DPYD", star: "HapB3", rs: "rs75017182", genotype: "0/1" },
  ],
};

export interface SampleProfile {
  name: string;
  description: string;
  patientId: string;
  variants: VCFBuilderVariant[];
}

export const SAMPLE_PROFILES: SampleProfile[] = [
  {
    name: "Codeine URM Risk",
    description: "CYP2D6 ultrarapid metabolizer — high morphine conversion risk with codeine",
    patientId: "PATIENT_CYP2D6_URM",
    variants: [
      { ...AVAILABLE_VARIANTS.CYP2D6[1], genotype: "1/1" }, // *2/*2 homozygous (normal function but with DUP)
      { ...AVAILABLE_VARIANTS.CYP2D6[2], genotype: "1/1" }, // *1 homozygous
    ],
  },
  {
    name: "Fluorouracil DPYD Risk",
    description: "DPYD deficiency — severe fluorouracil toxicity risk",
    patientId: "PATIENT_DPYD_RISK",
    variants: [
      { ...AVAILABLE_VARIANTS.DPYD[0], genotype: "0/1" }, // *2A heterozygous
      { ...AVAILABLE_VARIANTS.DPYD[2], genotype: "0/1" }, // HapB3
    ],
  },
];
