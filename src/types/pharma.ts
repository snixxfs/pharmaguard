export type RiskLabel = "Safe" | "Adjust Dosage" | "Toxic" | "Ineffective" | "Unknown";
export type Severity = "none" | "low" | "moderate" | "high" | "critical";
export type Phenotype = "PM" | "IM" | "NM" | "RM" | "URM" | "Unknown";
export type SupportedDrug = "CODEINE" | "WARFARIN" | "CLOPIDOGREL" | "SIMVASTATIN" | "AZATHIOPRINE" | "FLUOROURACIL";
export type SupportedGene = "CYP2D6" | "CYP2C19" | "CYP2C9" | "SLCO1B1" | "TPMT" | "DPYD";

export interface DetectedVariant {
  rsid: string;
  gene: string;
  star: string;
  genotype: string;
  chrom: string;
  pos: number;
  ref: string;
  alt: string;
}

export interface PharmaResult {
  patient_id: string;
  drug: string;
  timestamp: string;
  risk_assessment: {
    risk_label: RiskLabel;
    confidence_score: number;
    severity: Severity;
  };
  pharmacogenomic_profile: {
    primary_gene: string;
    diplotype: string;
    phenotype: Phenotype;
    detected_variants: DetectedVariant[];
  };
  clinical_recommendation: {
    recommendation: string;
    dose_guidance: string;
    alternative_drugs: string[];
    guideline_source: "CPIC";
    guideline_links: string[];
  };
  llm_generated_explanation: {
    summary: string;
    mechanism: string;
    variant_citations: string[];
    what_this_means_for_patient: string;
    limitations: string;
  };
  quality_metrics: {
    vcf_parsing_success: boolean;
    file_size_mb: number;
    variants_total: number;
    variants_with_required_tags: number;
    genes_covered: string[];
    missing_required_tags: string[];
    notes: string;
  };
}

export interface VCFValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  patientId: string;
  variantCount: number;
  genesDetected: string[];
}

export interface ParsedVariant {
  chrom: string;
  pos: number;
  id: string;
  ref: string;
  alt: string;
  qual: string;
  filter: string;
  info: Record<string, string>;
  genotype: string;
  gene?: string;
  star?: string;
  rsid?: string;
}

export interface VCFParseResult {
  validation: VCFValidation;
  variants: ParsedVariant[];
  fileSizeMb: number;
}
