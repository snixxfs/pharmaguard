/* eslint-disable */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { API_KEY, PROVIDER, openaiPing, geminiPing } from "./_lib";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!API_KEY) {
    res.status(500).json({ ok: false, error: "Missing server API key. Set GEMINI_API_KEY or OPENAI_API_KEY in Vercel project env." });
    return;
  }
  try {
    const r = PROVIDER === "openai" ? await openaiPing() : await geminiPing();
    res.json(r);
  } catch (e) {
    res.json({ ok: false, error: "Network error" });
  }
}

