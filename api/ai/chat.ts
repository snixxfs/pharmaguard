/* eslint-disable */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { API_KEY, PROVIDER, AI_CONTEXT_LIMIT, clampText, buildSystemPrompt, openaiChat, geminiChat } from "./_lib";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!API_KEY) {
    res.status(500).json({ ok: false, error: "Missing server API key. Set GEMINI_API_KEY or OPENAI_API_KEY in Vercel project env." });
    return;
  }
  const { messages = [], context = "", mode = "student" } = (req.body as any) || {};
  const sys = buildSystemPrompt();
  try {
    const safeContext = clampText(String(context || ""), AI_CONTEXT_LIMIT);
    const content =
      PROVIDER === "openai"
        ? await openaiChat({ messages, sys, context: safeContext, mode })
        : await geminiChat({ messages, sys, context: safeContext, mode });
    res.json({ role: "assistant", content });
  } catch (e) {
    const text =
      "Copilot error. Context-only fallback:\n\n" +
      String(context || "").slice(0, 2000) +
      "\n\nEducational only. Not medical advice.";
    res.json({ role: "assistant", content: text, offline: true });
  }
}

