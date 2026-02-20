/* eslint-disable */
export const PROVIDER = process.env.OPENAI_API_KEY ? "openai" : process.env.GEMINI_API_KEY ? "gemini" : "";
export const API_KEY = PROVIDER === "openai" ? process.env.OPENAI_API_KEY : PROVIDER === "gemini" ? process.env.GEMINI_API_KEY : "";
const GEMINI_MODEL_OVERRIDE = process.env.GEMINI_MODEL || "";
const REQ_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 15000);
export const AI_CONTEXT_LIMIT = Number(process.env.AI_CONTEXT_LIMIT || 16000);
export const AI_TOKENS_CHAT = Number(process.env.AI_TOKENS_CHAT || 512);
export const AI_TOKENS_DETECT = Number(process.env.AI_TOKENS_DETECT || 384);

export function clampText(s: string, max: number) {
  const str = String(s || "");
  return str.length > max ? str.slice(0, max) : str;
}

export function tryParseStrictJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        /* ignore */
      }
    }
  }
  return null;
}

export function onlySupported(drugs: string[]) {
  const SUPPORTED = ["CODEINE", "WARFARIN", "CLOPIDOGREL", "SIMVASTATIN", "AZATHIOPRINE", "FLUOROURACIL"];
  const set = new Set(SUPPORTED);
  return Array.isArray(drugs) ? drugs.filter((d) => set.has(String(d || "").toUpperCase())) : [];
}

export function normalizeResult(json: any) {
  const SUPPORTED = ["CODEINE", "WARFARIN", "CLOPIDOGREL", "SIMVASTATIN", "AZATHIOPRINE", "FLUOROURACIL"];
  const toU = (arr: any) => (Array.isArray(arr) ? arr.map((s) => String(s || "").toUpperCase()) : []);
  let supported = onlySupported(toU(json?.supported_drugs));
  let other = toU(json?.other_drugs).filter((d: string) => !SUPPORTED.includes(d));
  supported = [...new Set(supported)];
  other = [...new Set(other)];
  let confidence = Number(json?.confidence);
  if (!Number.isFinite(confidence)) confidence = 0;
  confidence = Math.max(0, Math.min(1, confidence));
  const rationale = String(json?.rationale || "");
  return { supported_drugs: supported, other_drugs: other, confidence, rationale };
}

export function buildSystemPrompt() {
  return [
    "You are PharmaGuard Copilot. Use ONLY provided context.",
    "Never invent variants/rsIDs/genes. If missing, say unknown.",
    "Always add: Educational only. Not medical advice.",
    "When you state a genetic reason, cite at least one evidence id in brackets like [rs4244285].",
    "Only cite evidence ids that appear in the provided Evidence IDs list in the context.",
    "When asked to summarize, produce 3–6 concise bullets and include a Mechanism paragraph.",
    "Mechanism: explain gene → enzyme function → drug activation/metabolism → clinical effect.",
    "If no evidence ids exist, say: No variant evidence available in this file.",
  ].join("\n");
}

function fetchWithTimeout(url: string, opts: any = {}, ms = REQ_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(id));
}

const GEMINI_BASES = ["https://generativelanguage.googleapis.com/v1beta", "https://generativelanguage.googleapis.com/v1"];
const GEMINI_MODELS = ["gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-1.5-flash-8b-latest", "gemini-1.5-flash-8b", "gemini-2.0-flash-exp"];

async function geminiListModels() {
  for (const base of GEMINI_BASES) {
    const url = `${base}/models?key=${API_KEY}`;
    try {
      const r = await fetch(url, { method: "GET" });
      if (!r.ok) continue;
      const data = await r.json();
      const models = Array.isArray((data as any)?.models) ? (data as any).models.map((m: any) => m?.name).filter(Boolean) : [];
      if (models.length) return { base, models };
    } catch {
      /* try next */
    }
  }
  return { base: GEMINI_BASES[0], models: [] as string[] };
}

function toModelPath(base: string, modelName: string) {
  const full = modelName.startsWith("models/") ? modelName : `models/${modelName}`;
  return `${base}/${full}:generateContent?key=${API_KEY}`;
}

export async function geminiGenerateContent(contents: any[], generationConfig: any) {
  const body = { contents, generationConfig };
  let lastErr: any = null;
  for (const base of GEMINI_BASES) {
    const modelsToTry = GEMINI_MODEL_OVERRIDE ? [GEMINI_MODEL_OVERRIDE, ...GEMINI_MODELS] : GEMINI_MODELS;
    for (const model of modelsToTry) {
      const url = toModelPath(base, model);
      try {
        const r = await fetchWithTimeout(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (!r.ok) {
          lastErr = new Error(`Gemini error ${r.status} at ${url.replace(String(API_KEY), "KEY")}`);
          continue;
        }
        const data: any = await r.json();
        const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join("\n") || "";
        return text;
      } catch (e) {
        lastErr = e;
      }
    }
  }
  try {
    const { base, models } = await geminiListModels();
    const prefs = models.filter((m) => /flash/i.test(m)).concat(models);
    for (const m of prefs) {
      const url = toModelPath(base, m);
      try {
        const r = await fetchWithTimeout(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (!r.ok) {
          lastErr = new Error(`Gemini error ${r.status} at ${url.replace(String(API_KEY), "KEY")}`);
          continue;
        }
        const data: any = await r.json();
        const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join("\n") || "";
        return text;
      } catch (e) {
        lastErr = e;
      }
    }
  } catch (e) {
    lastErr = e;
  }
  throw lastErr || new Error("Gemini generateContent failed");
}

export async function openaiPing() {
  const body = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Reply with exactly: pong" },
      { role: "user", content: "ping" },
    ],
    temperature: 0,
    max_tokens: 5,
  };
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify(body),
  });
  if (!r.ok) return { ok: false, error: `OpenAI error ${r.status}` };
  const data: any = await r.json();
  const content = data?.choices?.[0]?.message?.content?.trim() || "";
  return { ok: content.toLowerCase().includes("pong") };
}

export async function geminiPing() {
  try {
    const text = await geminiGenerateContent([{ role: "user", parts: [{ text: "Reply with exactly: pong" }] }], { temperature: 0, maxOutputTokens: 8 });
    return { ok: text.toLowerCase().includes("pong") };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e) };
  }
}

export async function openaiChat({ messages, sys, context, mode }: any) {
  const body = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: sys + `\nMode: ${mode}` },
      { role: "system", content: `Context:\n${context}` },
      ...messages,
    ],
    temperature: 0.2,
    max_tokens: AI_TOKENS_CHAT,
  };
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const err = await r.text().catch(() => "");
    throw new Error(`OpenAI error ${r.status}: ${err || "unknown"}`);
  }
  const data: any = await r.json();
  return data?.choices?.[0]?.message?.content || "No response.";
}

export function mapToGeminiContents({ messages, sys, context, mode }: any) {
  const contents: any[] = [];
  contents.push({
    role: "user",
    parts: [{ text: `${sys}\nMode: ${mode}\nContext:\n${context}` }],
  });
  for (const m of messages) {
    if (!m?.content) continue;
    const role = m.role === "assistant" ? "model" : "user";
    contents.push({ role, parts: [{ text: String(m.content) }] });
  }
  return contents;
}

export async function geminiChat({ messages, sys, context, mode }: any) {
  const contents = mapToGeminiContents({ messages, sys, context, mode });
  const text = await geminiGenerateContent(contents, { temperature: 0.2, maxOutputTokens: AI_TOKENS_CHAT });
  return text || "No response.";
}

export async function openaiDetectMeds({ sys, ctx }: any) {
  const body = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: sys },
      { role: "user", content: ctx || "No additional context." },
    ],
    temperature: 0.2,
    max_tokens: AI_TOKENS_DETECT,
  };
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const errTxt = await r.text().catch(() => "");
    throw new Error(`OpenAI error ${r.status}: ${errTxt || "unknown"}`);
  }
  const data: any = await r.json();
  return data?.choices?.[0]?.message?.content || "";
}

export async function geminiDetectMeds({ sys, ctx }: any) {
  const contents = [
    { role: "user", parts: [{ text: sys }] },
    { role: "user", parts: [{ text: ctx || "No additional context." }] },
  ];
  const text = await geminiGenerateContent(contents, { temperature: 0.2, maxOutputTokens: AI_TOKENS_DETECT });
  return text;
}

