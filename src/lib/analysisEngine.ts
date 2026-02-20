import type { ParsedVariant, PharmaResult, DetectedVariant, Phenotype, SupportedDrug, SupportedGene } from "@/types/pharma";
import {
  DRUG_PRIMARY_GENE, CPIC_LINKS, STAR_ALLELE_FUNCTION,
  derivePhenotype, getDrugDecision, SUPPORTED_GENES,
} from "@/constants/pharmacogenomics";

interface GeneEvidence {
  gene: string;
  variants: ParsedVariant[];
  starAlleles: string[];
  diplotype: string;
  phenotype: Phenotype;
  hasDuplication: boolean;
}

function buildGeneEvidence(variants: ParsedVariant[]): Map<string, GeneEvidence> {
  const geneMap = new Map<string, GeneEvidence>();

  for (const v of variants) {
    if (!v.gene || !SUPPORTED_GENES.includes(v.gene as SupportedGene)) continue;

    if (!geneMap.has(v.gene)) {
      geneMap.set(v.gene, {
        gene: v.gene,
        variants: [],
        starAlleles: [],
        diplotype: "Unknown",
        phenotype: "Unknown",
        hasDuplication: false,
      });
    }

    const evidence = geneMap.get(v.gene)!;
    evidence.variants.push(v);

    // Check for duplication tag
    if (v.info["DUP"] === "yes" || v.info["DUP"] === "true") {
      evidence.hasDuplication = true;
    }

    // Collect star alleles
    if (v.star) {
      // Handle pipe-separated or diplotype format
      if (v.star.includes("/")) {
        // Direct diplotype in single record
        evidence.diplotype = v.star;
      } else if (v.star.includes("|")) {
        const parts = v.star.split("|");
        evidence.starAlleles.push(...parts);
      } else {
        evidence.starAlleles.push(v.star);
      }
    }
  }

  // Resolve diplotypes and phenotypes
  for (const [, evidence] of geneMap) {
    if (evidence.diplotype === "Unknown" && evidence.starAlleles.length > 0) {
      // Deduplicate and pick top 2
      const unique = [...new Set(evidence.starAlleles)];
      if (unique.length >= 2) {
        evidence.diplotype = `${unique[0]}/${unique[1]}`;
      } else if (unique.length === 1) {
        // Check genotypes - if homozygous alt, use same allele twice
        const isHomozygous = evidence.variants.some(v =>
          v.genotype === "1/1" || v.genotype === "1|1"
        );
        evidence.diplotype = isHomozygous
          ? `${unique[0]}/${unique[0]}`
          : `*1/${unique[0]}`; // Assume reference *1 for other allele
      }
    }

    // Derive phenotype from diplotype
    if (evidence.diplotype !== "Unknown") {
      const parts = evidence.diplotype.split("/");
      if (parts.length === 2) {
        const funcTable = STAR_ALLELE_FUNCTION[evidence.gene] || {};
        const func1 = funcTable[parts[0]] || "normal"; // default unknown alleles to normal
        const func2 = funcTable[parts[1]] || "normal";
        evidence.phenotype = derivePhenotype(evidence.gene, func1, func2);

        // CYP2D6 URM override
        if (evidence.gene === "CYP2D6" && evidence.hasDuplication && evidence.phenotype === "NM") {
          evidence.phenotype = "URM";
        }
      }
    }
  }

  return geneMap;
}

function generateExplanation(
  drug: SupportedDrug,
  geneEvidence: GeneEvidence | undefined,
  decision: ReturnType<typeof getDrugDecision>,
  detectedVariants: DetectedVariant[]
): PharmaResult["llm_generated_explanation"] {
  const variantCitations = detectedVariants.map(v =>
    `${v.rsid} (${v.gene} ${v.star})`
  );

  if (!geneEvidence || geneEvidence.phenotype === "Unknown") {
    return {
      summary: `Analysis for ${drug}: Insufficient pharmacogenomic data available for the primary metabolizing gene. The risk assessment is based on limited variant information.`,
      mechanism: `${drug} metabolism depends on enzymatic activity that could not be fully characterized from the provided genetic data.`,
      variant_citations: variantCitations,
      what_this_means_for_patient: "Without clear genetic variant data for the relevant gene, standard prescribing guidelines should be followed. Consider comprehensive pharmacogenomic testing.",
      limitations: "Limited variant data available. This analysis may not capture all relevant genetic variations. VKORC1, HLA, and other modifier genes are not assessed.",
    };
  }

  const gene = geneEvidence.gene;
  const phenotype = geneEvidence.phenotype;
  const diplotype = geneEvidence.diplotype;

  const mechanismMap: Record<string, string> = {
    CODEINE: `Codeine is a prodrug that requires CYP2D6-mediated O-demethylation to morphine for analgesic effect. The ${diplotype} diplotype results in ${phenotype} metabolizer status, which ${phenotype === "URM" ? "causes excessive and rapid morphine formation" : phenotype === "PM" || phenotype === "IM" ? "results in insufficient morphine production" : "provides normal morphine conversion"}.`,
    CLOPIDOGREL: `Clopidogrel is a prodrug requiring CYP2C19-mediated bioactivation to its active thiol metabolite. The ${diplotype} diplotype produces ${phenotype} metabolizer status, ${phenotype === "PM" || phenotype === "IM" ? "leading to reduced formation of the active metabolite and diminished antiplatelet effect" : "supporting adequate prodrug activation"}.`,
    WARFARIN: `Warfarin's S-enantiomer (the more potent form) is primarily metabolized by CYP2C9. The ${diplotype} diplotype yields ${phenotype} metabolizer status, ${phenotype === "PM" || phenotype === "IM" ? "reducing warfarin clearance and increasing sensitivity, requiring lower doses to achieve therapeutic INR" : "supporting standard warfarin metabolism"}. Note: VKORC1 pharmacodynamic effects are not assessed here.`,
    SIMVASTATIN: `SLCO1B1 encodes the hepatic uptake transporter OATP1B1, which mediates simvastatin acid uptake into hepatocytes. The ${diplotype} diplotype results in ${phenotype === "PM" || phenotype === "IM" ? "decreased transporter function, increasing systemic simvastatin exposure and myopathy risk" : "normal hepatic uptake of simvastatin"}.`,
    AZATHIOPRINE: `TPMT catalyzes the S-methylation of thiopurine drugs, diverting metabolism away from cytotoxic thioguanine nucleotides. The ${diplotype} diplotype indicates ${phenotype} activity, ${phenotype === "PM" ? "causing dangerous accumulation of cytotoxic metabolites leading to severe myelosuppression" : phenotype === "IM" ? "resulting in elevated thioguanine nucleotide levels with increased toxicity risk" : "providing adequate drug inactivation"}.`,
    FLUOROURACIL: `DPYD encodes dihydropyrimidine dehydrogenase, responsible for catabolizing >80% of administered fluorouracil. The ${diplotype} diplotype indicates ${phenotype} enzyme activity, ${phenotype === "PM" || phenotype === "IM" ? "severely impairing fluorouracil degradation and leading to prolonged drug exposure with high toxicity risk" : "supporting normal fluorouracil catabolism"}.`,
  };

  return {
    summary: `Based on ${gene} ${diplotype} (${phenotype} metabolizer), the patient's predicted response to ${drug} is: ${decision.riskLabel}. ${decision.recommendation}`,
    mechanism: mechanismMap[drug] || `${drug} is metabolized by ${gene}. The ${diplotype} diplotype results in ${phenotype} metabolizer phenotype.`,
    variant_citations: variantCitations,
    what_this_means_for_patient: decision.riskLabel === "Safe"
      ? `Your genetic profile suggests normal ${gene} function. Standard ${drug.toLowerCase()} dosing is expected to be appropriate for you.`
      : decision.riskLabel === "Adjust Dosage"
        ? `Your genetic profile indicates altered ${gene} function that may affect how your body processes ${drug.toLowerCase()}. A dose adjustment may be needed to optimize safety and effectiveness.`
        : decision.riskLabel === "Toxic"
          ? `Your genetic profile indicates significantly altered ${gene} function that increases the risk of serious adverse effects with ${drug.toLowerCase()}. Alternative medications or substantial dose modifications should be strongly considered.`
          : decision.riskLabel === "Ineffective"
            ? `Your genetic profile suggests that ${drug.toLowerCase()} may not work effectively for you due to altered ${gene} function. Alternative medications should be considered.`
            : "Insufficient data to determine how your body processes this medication. Standard guidelines should be followed.",
    limitations: `This analysis is based on ${gene} genotype only. Other genes, environmental factors, drug interactions, organ function, and clinical context are not assessed. ${drug === "WARFARIN" ? "VKORC1 genotype, which significantly affects warfarin sensitivity, is not included in this analysis. " : ""}This is for educational purposes and should not replace clinical judgment.`,
  };
}

export function analyzeVariants(
  variants: ParsedVariant[],
  drugs: SupportedDrug[],
  patientId: string,
  fileSizeMb: number
): PharmaResult[] {
  const timestamp = new Date().toISOString();
  const geneEvidence = buildGeneEvidence(variants);

  const variantsWithTags = variants.filter(v => v.gene && v.star && v.rsid);
  const allGenesCovered = Array.from(geneEvidence.keys());
  const allMissingTags: string[] = [];
  
  variants.forEach((v, i) => {
    const missing: string[] = [];
    if (!v.gene) missing.push("GENE");
    if (!v.star) missing.push("STAR");
    if (!v.rsid) missing.push("RS");
    if (missing.length > 0) allMissingTags.push(`Variant ${i + 1}: ${missing.join(", ")}`);
  });

  return drugs.map(drug => {
    const primaryGene = DRUG_PRIMARY_GENE[drug];
    const evidence = geneEvidence.get(primaryGene);
    const decision = getDrugDecision(drug, evidence?.phenotype || "Unknown");

    const detectedVariants: DetectedVariant[] = (evidence?.variants || []).map(v => ({
      rsid: v.rsid || `pos:${v.chrom}:${v.pos}`,
      gene: v.gene || "Unknown",
      star: v.star || "unknown",
      genotype: v.genotype,
      chrom: v.chrom,
      pos: v.pos,
      ref: v.ref,
      alt: v.alt,
    }));

    // Confidence adjustment
    let confidence = decision.confidenceBase;
    if (!evidence) confidence = 0.15;
    else if (evidence.diplotype === "Unknown") confidence = Math.min(confidence, 0.35);
    else if (evidence.phenotype === "Unknown") confidence = Math.min(confidence, 0.30);

    const explanation = generateExplanation(drug, evidence, decision, detectedVariants);

    const result: PharmaResult = {
      patient_id: patientId,
      drug: drug,
      timestamp: timestamp,
      risk_assessment: {
        risk_label: decision.riskLabel,
        confidence_score: parseFloat(confidence.toFixed(2)),
        severity: decision.severity,
      },
      pharmacogenomic_profile: {
        primary_gene: primaryGene,
        diplotype: evidence?.diplotype || "Unknown",
        phenotype: evidence?.phenotype || "Unknown",
        detected_variants: detectedVariants,
      },
      clinical_recommendation: {
        recommendation: decision.recommendation,
        dose_guidance: decision.doseGuidance,
        alternative_drugs: decision.alternativeDrugs,
        guideline_source: "CPIC",
        guideline_links: CPIC_LINKS[drug],
      },
      llm_generated_explanation: explanation,
      quality_metrics: {
        vcf_parsing_success: true,
        file_size_mb: fileSizeMb,
        variants_total: variants.length,
        variants_with_required_tags: variantsWithTags.length,
        genes_covered: allGenesCovered,
        missing_required_tags: allMissingTags.slice(0, 10),
        notes:
          (variants.some(v => !v.star) ? "Some variants missing STAR; phenotype confidence reduced. " : "") +
          (evidence
            ? `Primary gene ${primaryGene} detected with ${evidence.variants.length} variant(s). Diplotype: ${evidence.diplotype}, Phenotype: ${evidence.phenotype}.`
            : `Primary gene ${primaryGene} not detected in VCF data. Risk assessment based on insufficient data.`),
      },
    };

    return result;
  });
}
