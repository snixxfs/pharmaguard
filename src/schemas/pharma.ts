import { z } from "zod";

export const zDetectedVariant = z.object({
  rsid: z.string(),
  gene: z.string(),
  star: z.string(),
  genotype: z.string(),
  chrom: z.string(),
  pos: z.number(),
  ref: z.string(),
  alt: z.string(),
});

export const zPharmaResult = z.object({
  patient_id: z.string(),
  drug: z.string(),
  timestamp: z.string(),
  risk_assessment: z.object({
    risk_label: z.enum(["Safe", "Adjust Dosage", "Toxic", "Ineffective", "Unknown"]),
    confidence_score: z.number(),
    severity: z.enum(["none", "low", "moderate", "high", "critical"]),
  }),
  pharmacogenomic_profile: z.object({
    primary_gene: z.string(),
    diplotype: z.string(),
    phenotype: z.enum(["PM", "IM", "NM", "RM", "URM", "Unknown"]),
    detected_variants: z.array(zDetectedVariant),
  }),
  clinical_recommendation: z.object({
    recommendation: z.string(),
    dose_guidance: z.string(),
    alternative_drugs: z.array(z.string()),
    guideline_source: z.literal("CPIC"),
    guideline_links: z.array(z.string().url().or(z.string())), // allow plain strings too
  }),
  llm_generated_explanation: z.object({
    summary: z.string(),
    mechanism: z.string(),
    variant_citations: z.array(z.string()),
    what_this_means_for_patient: z.string(),
    limitations: z.string(),
  }),
  quality_metrics: z.object({
    vcf_parsing_success: z.boolean(),
    file_size_mb: z.number(),
    variants_total: z.number(),
    variants_with_required_tags: z.number(),
    genes_covered: z.array(z.string()),
    missing_required_tags: z.array(z.string()),
    notes: z.string(),
  }),
});

export const zPharmaResults = z.array(zPharmaResult);

export type PharmaResultZod = z.infer<typeof zPharmaResult>;
