export type VCFPrecheck = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  stats?: {
    hasFileformat: boolean;
    hasHeader: boolean;
    columnsOk: boolean;
    sampleName?: string;
    variantLines: number;
    missingGeneCount: number;
    missingRsidCount: number;
    missingStarCount: number;
  };
};

export function validateVCF(content: string): VCFPrecheck {
  const lines = content.split("\n").map((l) => l.replace(/\r$/, ""));
  const errors: string[] = [];
  const warnings: string[] = [];

  let hasFileformat = false;
  let hasHeader = false;
  let columnsOk = false;
  let sampleName: string | undefined;
  let variantLines = 0;
  let missingGeneCount = 0;
  let missingRsidCount = 0;
  let missingStarCount = 0;

  // Fileformat check: must start with exact VCFv4.2
  const firstNonEmpty = lines.find((l) => l.trim().length > 0) || "";
  if (firstNonEmpty.startsWith("##fileformat=VCFv4.2")) {
    hasFileformat = true;
  } else {
    errors.push('Missing VCFv4.2 header → add "##fileformat=VCFv4.2" as the first line');
  }

  // Header line with tabs
  const headerIdx = lines.findIndex((l) => l.startsWith("#CHROM"));
  if (headerIdx >= 0) {
    hasHeader = true;
    const header = lines[headerIdx];
    const cols = header.split("\t");
    const requiredPrefix = ["#CHROM", "POS", "ID", "REF", "ALT", "QUAL", "FILTER", "INFO"];
    const prefixOk = requiredPrefix.every((v, i) => cols[i] === v);
    if (!prefixOk) {
      errors.push("Header row must be TAB-separated → ensure columns are separated by tabs, not spaces");
    }
    const hasFORMAT = cols.includes("FORMAT");
    const sampleCols = cols.length - cols.indexOf("FORMAT") - 1;
    if (!hasFORMAT || sampleCols < 1) {
      errors.push("No sample column found → include FORMAT and a sample genotype column");
    } else {
      sampleName = cols[cols.length - 1];
    }
    columnsOk = prefixOk && hasFORMAT && sampleCols >= 1;
  } else {
    errors.push('Missing header line → add a line starting with "#CHROM\\tPOS\\tID\\tREF\\tALT\\tQUAL\\tFILTER\\tINFO\\tFORMAT\\t<SAMPLE>"');
  }

  // Data lines check
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.startsWith("#")) continue;
    const parts = line.split("\t");
    if (parts.length < 10) {
      errors.push(`Data line ${i + 1} has fewer than 10 TAB-separated columns → export a full VCF with FORMAT and sample genotype`);
      continue;
    }
    variantLines++;
    // INFO missing tag warnings
    const infoStr = parts[7] || ".";
    const info = parseInfo(infoStr);
    if (!info["GENE"]) missingGeneCount++;
    if (!info["RS"] && !(parts[2] || "").startsWith("rs")) missingRsidCount++;
    if (!info["STAR"]) missingStarCount++;
  }

  if (missingGeneCount > 0 || missingRsidCount > 0 || missingStarCount > 0) {
    const pieces: string[] = [];
    if (missingGeneCount > 0) pieces.push(`${missingGeneCount} without GENE`);
    if (missingRsidCount > 0) pieces.push(`${missingRsidCount} without RSID`);
    if (missingStarCount > 0) pieces.push(`${missingStarCount} without STAR`);
    warnings.push(`Some annotations are missing (${pieces.join(", ")}) — results may be Unknown`);
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: {
      hasFileformat,
      hasHeader,
      columnsOk,
      sampleName,
      variantLines,
      missingGeneCount,
      missingRsidCount,
      missingStarCount,
    },
  };
}

function parseInfo(infoStr: string): Record<string, string> {
  const info: Record<string, string> = {};
  if (!infoStr || infoStr === ".") return info;
  for (const tok of infoStr.split(";")) {
    const idx = tok.indexOf("=");
    if (idx > 0) info[tok.slice(0, idx)] = tok.slice(idx + 1);
    else info[tok] = "true";
  }
  return info;
}

