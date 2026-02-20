import { z } from "zod";
import { SUPPORTED_DRUGS } from "@/constants/pharmacogenomics";
import type { SupportedDrug } from "@/types/pharma";

export const zDetectOutput = z.object({
  supported_drugs: z.array(z.string()),
  other_drugs: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1),
  notes: z.string().default(""),
});

export type DetectOutput = z.infer<typeof zDetectOutput>;

// Client-side must never call external AI APIs or embed keys.
// Always use server endpoint when available; this utility provides a local fallback only.

export async function detectDrugsFromText(input: string): Promise<DetectOutput> {
  const text = input.toUpperCase();
  const fallback = (): DetectOutput => {
    const hits: SupportedDrug[] = SUPPORTED_DRUGS.filter((d) => text.includes(d));
    return {
      supported_drugs: Array.from(new Set(hits)),
      other_drugs: [],
      confidence: hits.length > 0 ? 0.6 : 0.2,
      notes: "Keyword match fallback",
    };
  };

  return fallback();
}
