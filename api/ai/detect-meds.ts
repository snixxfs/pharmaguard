/* eslint-disable */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  API_KEY,
  PROVIDER,
  tryParseStrictJson,
  normalizeResult,
  openaiDetectMeds,
  geminiDetectMeds,
} from "./_lib";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!API_KEY) {
    res.status(500).json({ ok: false, error: "Missing server API key. Set GEMINI_API_KEY or OPENAI_API_KEY in Vercel project env." });
    return;
  }
  const { vcfText = "", resultsSummary = "", userMedsText = "" } = (req.body as any) || {};
  const SUPPORTED = ["CODEINE", "WARFARIN", "CLOPIDOGREL", "SIMVASTATIN", "AZATHIOPRINE", "FLUOROURACIL"];
  const ctx = [vcfText ? `VCF:\n${vcfText}` : "", resultsSummary ? `Results:\n${resultsSummary}` : "", userMedsText ? `UserMeds:\n${userMedsText}` : ""]
    .filter(Boolean)
    .join("\n\n");
  const sys = [
    "You are PharmaGuard Copilot.",
    "Infer medications from the provided context.",
    "Supported drugs list is fixed:",
    SUPPORTED.join(", "),
    "Return STRICT JSON ONLY with this shape and no extra text:",
    '{ "supported_drugs": string[], "other_drugs": string[], "confidence": number, "rationale": string }',
    "confidence is 0..1",
    "Only include supported_drugs that are exactly from the supported list above.",
  ].join("\n");
  try {
    const content = PROVIDER === "openai" ? await openaiDetectMeds({ sys, ctx }) : await geminiDetectMeds({ sys, ctx });
    const parsed = tryParseStrictJson(content as string);
    if (parsed && typeof parsed === "object") {
      res.json(normalizeResult(parsed));
      return;
    }
    let repairContent = "";
    if (PROVIDER === "openai") {
      const repairBody = {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Convert the following into STRICT valid JSON with keys supported_drugs, other_drugs, confidence (0..1), rationale. Output JSON only, no extra text." },
          { role: "user", content: content || "null" },
        ],
        temperature: 0,
      };
      const rr = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify(repairBody),
      });
      const repairData: any = await rr.json().catch(() => ({}));
      repairContent = repairData?.choices?.[0]?.message?.content || "";
    } else {
      // Gemini repair
      const { geminiGenerateContent } = await import("./_lib");
      repairContent = await geminiGenerateContent(
        [
          { role: "user", parts: [{ text: "Convert the following into STRICT valid JSON with keys supported_drugs, other_drugs, confidence (0..1), rationale. Output JSON only, no extra text." }] },
          { role: "user", parts: [{ text: content || "null" }] },
        ],
        { temperature: 0 },
      );
    }
    const repaired = tryParseStrictJson(repairContent as string);
    if (repaired && typeof repaired === "object") {
      res.json(normalizeResult(repaired));
      return;
    }
    res.json({ supported_drugs: [], other_drugs: [], confidence: 0, rationale: "Model returned invalid JSON" });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
}

