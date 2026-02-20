import type { ParsedVariant, VCFParseResult, VCFValidation } from "@/types/pharma";
import { SUPPORTED_GENES } from "@/constants/pharmacogenomics";

export function parseVCF(content: string, fileName: string, fileSizeBytes: number): VCFParseResult {
  const lines = content.split("\n").map(l => l.replace(/\r$/, ""));
  const errors: string[] = [];
  const warnings: string[] = [];
  const variants: ParsedVariant[] = [];
  let patientId = "";
  let headerFound = false;
  let formatValid = false;
  let columnHeaderLine = "";
  let sampleIndex = 9; // default

  // Check file format header (accept any VCF version)
  const formatLine = lines.find(l => l.startsWith("##fileformat="));
  if (!formatLine) {
    warnings.push("Missing ##fileformat= header line — assuming VCF format");
  } else if (!formatLine.match(/VCFv4\.\d/)) {
    warnings.push(`Non-standard VCF version: ${formatLine}`);
  }
  formatValid = true;

  // Find column header
  const headerIdx = lines.findIndex(l => l.startsWith("#CHROM"));
  if (headerIdx === -1) {
    warnings.push("Missing #CHROM column header line — attempting to parse data lines");
    headerFound = true;
  } else {
    columnHeaderLine = lines[headerIdx];
    const cols = columnHeaderLine.split("\t");
    if (cols.length < 5) {
      errors.push("Column header must have at least CHROM, POS, ID, REF, ALT columns");
    } else {
      headerFound = true;
    }
    if (!cols.includes("INFO")) {
      warnings.push("INFO column not found in header — annotation-based analysis will be limited");
    }
    if (cols.length >= 10) {
      patientId = cols[9];
      sampleIndex = 9;
    } else {
      warnings.push("No sample column found in header");
    }
  }

  if (!patientId) {
    // Derive from filename
    const base = fileName.replace(/\.(vcf|txt)$/gi, "").replace(/[^a-zA-Z0-9]/g, "_");
    patientId = `PATIENT_${base.toUpperCase().slice(0, 20)}`;
  }

  // Parse data lines
  const dataStartIdx = headerIdx >= 0 ? headerIdx + 1 : lines.findIndex(l => !l.startsWith("#") && l.trim().length > 0);
  
  const genesDetected = new Set<string>();
  const missingTags: string[] = [];

  for (let i = Math.max(0, dataStartIdx); i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;

    const cols = line.split("\t");
    if (cols.length < 8) {
      warnings.push(`Line ${i + 1}: insufficient columns (${cols.length}), skipping`);
      continue;
    }

    const chrom = cols[0];
    const pos = parseInt(cols[1], 10);
    const id = cols[2] || ".";
    const ref = cols[3];
    const alt = cols[4];
    const qual = cols[5] || ".";
    const filter = cols[6] || ".";
    const infoStr = cols[7] || ".";
    const genotype = cols.length > sampleIndex ? extractGenotype(cols[sampleIndex], cols[8]) : "0/0";

    // Parse INFO field
    const info: Record<string, string> = {};
    if (infoStr !== ".") {
      for (const pair of infoStr.split(";")) {
        const eqIdx = pair.indexOf("=");
        if (eqIdx > 0) {
          info[pair.slice(0, eqIdx)] = pair.slice(eqIdx + 1);
        } else {
          info[pair] = "true";
        }
      }
    }

    const gene = info["GENE"] || undefined;
    const star = info["STAR"] || undefined;
    let rsid = info["RS"] || undefined;

    // Fallback: use ID column if it starts with rs
    if (!rsid && id.startsWith("rs")) {
      rsid = id;
    }

    if (gene) genesDetected.add(gene);

    // Track missing tags
    const lineHasAllTags = Boolean(gene && star && rsid);
    if (!lineHasAllTags) {
      const missing: string[] = [];
      if (!gene) missing.push("GENE");
      if (!star) missing.push("STAR");
      if (!rsid) missing.push("RS");
      missingTags.push(`Line ${i + 1}: missing ${missing.join(", ")}`);
    }

    variants.push({
      chrom, pos, id, ref, alt, qual, filter, info, genotype,
      gene, star, rsid,
    });
  }

  const validation: VCFValidation = {
    valid: errors.length === 0 && headerFound,
    errors,
    warnings: [...warnings, ...missingTags.slice(0, 5)],
    patientId,
    variantCount: variants.length,
    genesDetected: Array.from(genesDetected).filter((g) =>
      SUPPORTED_GENES.includes(g as unknown as (typeof SUPPORTED_GENES)[number]),
    ),
  };

  return {
    validation,
    variants,
    fileSizeMb: parseFloat((fileSizeBytes / (1024 * 1024)).toFixed(3)),
  };
}

function extractGenotype(sampleField: string, formatField?: string): string {
  if (!sampleField || sampleField === ".") return "0/0";
  if (!formatField) return sampleField.split(":")[0] || "0/0";
  
  const formatParts = formatField.split(":");
  const sampleParts = sampleField.split(":");
  const gtIdx = formatParts.indexOf("GT");
  
  if (gtIdx >= 0 && gtIdx < sampleParts.length) {
    return sampleParts[gtIdx];
  }
  return sampleParts[0] || "0/0";
}

export function generateVCFContent(patientId: string, variants: Array<{
  chrom: string; pos: number; id: string; ref: string; alt: string;
  gene: string; star: string; rs: string; genotype: string;
}>): string {
  const lines: string[] = [
    "##fileformat=VCFv4.2",
    `##fileDate=${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`,
    '##source=PharmaGuard_VCFBuilder',
    '##INFO=<ID=GENE,Number=1,Type=String,Description="Gene symbol">',
    '##INFO=<ID=STAR,Number=.,Type=String,Description="Star allele designation">',
    '##INFO=<ID=RS,Number=1,Type=String,Description="dbSNP ID">',
    '##FORMAT=<ID=GT,Number=1,Type=String,Description="Genotype">',
    `#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\t${patientId}`,
  ];

  for (const v of variants) {
    const info = `GENE=${v.gene};STAR=${v.star};RS=${v.rs}`;
    lines.push(`${v.chrom}\t${v.pos}\t${v.id}\t${v.ref}\t${v.alt}\t100\tPASS\t${info}\tGT\t${v.genotype}`);
  }

  return lines.join("\n") + "\n";
}
