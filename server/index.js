/* eslint-disable */
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config({ path: "server/.env" });

const app = express();
const PORT = process.env.PORT || 8787;
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PROVIDER = process.env.OPENAI_API_KEY ? "openai" : process.env.GEMINI_API_KEY ? "gemini" : "";
const API_KEY = PROVIDER === "openai" ? process.env.OPENAI_API_KEY : PROVIDER === "gemini" ? process.env.GEMINI_API_KEY : "";
const GEMINI_MODEL_OVERRIDE = process.env.GEMINI_MODEL || "";
const REQ_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 15000);
const AI_CONTEXT_LIMIT = Number(process.env.AI_CONTEXT_LIMIT || 16000);
const AI_TOKENS_CHAT = Number(process.env.AI_TOKENS_CHAT || 512);
const AI_TOKENS_DETECT = Number(process.env.AI_TOKENS_DETECT || 384);

function clampText(s, max) {
  const str = String(s || "");
  return str.length > max ? str.slice(0, max) : str;
}

function fetchWithTimeout(url, opts = {}, ms = REQ_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(id));
}

function onlySupported(drugs) {
  const SUPPORTED = ["CODEINE", "WARFARIN", "CLOPIDOGREL", "SIMVASTATIN", "AZATHIOPRINE", "FLUOROURACIL"];
  const set = new Set(SUPPORTED);
  return Array.isArray(drugs) ? drugs.filter((d) => set.has(String(d || "").toUpperCase())) : [];
}

function normalizeResult(json) {
  const SUPPORTED = ["CODEINE", "WARFARIN", "CLOPIDOGREL", "SIMVASTATIN", "AZATHIOPRINE", "FLUOROURACIL"];
  const toU = (arr) => (Array.isArray(arr) ? arr.map((s) => String(s || "").toUpperCase()) : []);
  let supported = onlySupported(toU(json?.supported_drugs));
  let other = toU(json?.other_drugs).filter((d) => !SUPPORTED.includes(d));
  // dedupe
  supported = [...new Set(supported)];
  other = [...new Set(other)];
  let confidence = Number(json?.confidence);
  if (!Number.isFinite(confidence)) confidence = 0;
  confidence = Math.max(0, Math.min(1, confidence));
  const rationale = String(json?.rationale || "");
  return { supported_drugs: supported, other_drugs: other, confidence, rationale };
}

function tryParseStrictJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\\{[\\s\\S]*\\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        // ignore
      }
    }
  }
  return null;
}

function buildSystemPrompt() {
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

async function openaiPing() {
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
  const data = await r.json();
  const content = data?.choices?.[0]?.message?.content?.trim() || "";
  return { ok: content.toLowerCase().includes("pong") };
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
      const models = Array.isArray(data?.models) ? data.models.map((m) => m?.name).filter(Boolean) : [];
      if (models.length) return { base, models };
    } catch {
      // try next base
    }
  }
  return { base: GEMINI_BASES[0], models: [] };
}

function toModelPath(base, modelName) {
  // modelName might already include "models/"
  const full = modelName.startsWith("models/") ? modelName : `models/${modelName}`;
  return `${base}/${full}:generateContent?key=${API_KEY}`;
}

async function geminiGenerateContent(contents, generationConfig) {
  const body = { contents, generationConfig };
  let lastErr = null;
  for (const base of GEMINI_BASES) {
    const modelsToTry = GEMINI_MODEL_OVERRIDE ? [GEMINI_MODEL_OVERRIDE, ...GEMINI_MODELS] : GEMINI_MODELS;
    for (const model of modelsToTry) {
      const url = toModelPath(base, model);
      try {
        const r = await fetchWithTimeout(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (!r.ok) {
          lastErr = new Error(`Gemini error ${r.status} at ${url.replace(API_KEY, "KEY")}`);
          continue;
        }
        const data = await r.json();
        const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join("\n") || "";
        return text;
      } catch (e) {
        lastErr = e;
      }
    }
  }
  // Fallback: discover models and try exact returned names (some projects expose different model slugs)
  try {
    const { base, models } = await geminiListModels();
    const prefs = models.filter((m) => /flash/i.test(m)).concat(models);
    for (const m of prefs) {
      const url = toModelPath(base, m);
      try {
        const r = await fetchWithTimeout(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (!r.ok) {
          lastErr = new Error(`Gemini error ${r.status} at ${url.replace(API_KEY, "KEY")}`);
          continue;
        }
        const data = await r.json();
        const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join("\n") || "";
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

async function geminiPing() {
  try {
    const text = await geminiGenerateContent([{ role: "user", parts: [{ text: "Reply with exactly: pong" }] }], { temperature: 0, maxOutputTokens: 8 });
    return { ok: text.toLowerCase().includes("pong") };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

app.get("/api/ai/ping", async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({ ok: false, error: "Missing server API key. Set OPENAI_API_KEY (or GEMINI_API_KEY) in server/.env" });
  }
  try {
    const r = PROVIDER === "openai" ? await openaiPing() : await geminiPing();
    return res.json(r);
  } catch (e) {
    return res.json({ ok: false, error: "Network error" });
  }
});

async function openaiChat({ messages, sys, context, mode }) {
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
  const r = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const err = await r.text().catch(() => "");
    throw new Error(`OpenAI error ${r.status}: ${err || "unknown"}`);
  }
  const data = await r.json();
  return data?.choices?.[0]?.message?.content || "No response.";
}

function mapToGeminiContents({ messages, sys, context, mode }) {
  const contents = [];
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

async function geminiChat({ messages, sys, context, mode }) {
  const contents = mapToGeminiContents({ messages, sys, context, mode });
  const text = await geminiGenerateContent(contents, { temperature: 0.2, maxOutputTokens: AI_TOKENS_CHAT });
  return text || "No response.";
}

app.post("/api/ai/chat", async (req, res) => {
  const { messages = [], context = "", mode = "student" } = req.body || {};
  const sys = buildSystemPrompt();
  if (!API_KEY) {
    return res.status(500).json({ ok: false, error: "Missing server API key. Set OPENAI_API_KEY (or GEMINI_API_KEY) in server/.env" });
  }
  try {
    const safeContext = clampText(context, AI_CONTEXT_LIMIT);
    const content =
      PROVIDER === "openai"
        ? await openaiChat({ messages, sys, context: safeContext, mode })
        : await geminiChat({ messages, sys, context: safeContext, mode });
    res.json({ role: "assistant", content });
  } catch (e) {
    const text =
      "Copilot error. Context-only fallback:\\n\\n" +
      String(context || "").slice(0, 2000) +
      "\\n\\nEducational only. Not medical advice.";
    res.json({ role: "assistant", content: text, offline: true });
  }
});

async function openaiDetectMeds({ sys, ctx }) {
  const body = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: sys },
      { role: "user", content: ctx || "No additional context." },
    ],
    temperature: 0.2,
    max_tokens: AI_TOKENS_DETECT,
  };
  const r = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const errTxt = await r.text().catch(() => "");
    throw new Error(`OpenAI error ${r.status}: ${errTxt || "unknown"}`);
  }
  const data = await r.json();
  return data?.choices?.[0]?.message?.content || "";
}

async function geminiDetectMeds({ sys, ctx }) {
  const contents = [
    { role: "user", parts: [{ text: sys }] },
    { role: "user", parts: [{ text: ctx || "No additional context." }] },
  ];
  const text = await geminiGenerateContent(contents, { temperature: 0.2, maxOutputTokens: AI_TOKENS_DETECT });
  return text;
}

app.post("/api/ai/detect-meds", async (req, res) => {
  const { vcfText = "", resultsSummary = "", userMedsText = "" } = req.body || {};
  if (!API_KEY) {
    return res.status(500).json({ ok: false, error: "Missing server API key. Set OPENAI_API_KEY (or GEMINI_API_KEY) in server/.env" });
  }
  const SUPPORTED = ["CODEINE", "WARFARIN", "CLOPIDOGREL", "SIMVASTATIN", "AZATHIOPRINE", "FLUOROURACIL"];
  const ctx =
    [
      vcfText ? `VCF:\n${vcfText}` : "",
      resultsSummary ? `Results:\n${resultsSummary}` : "",
      userMedsText ? `UserMeds:\n${userMedsText}` : "",
    ]
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
  ].join("\\n");
  try {
    const content =
      PROVIDER === "openai" ? await openaiDetectMeds({ sys, ctx }) : await geminiDetectMeds({ sys, ctx });
    const parsed = tryParseStrictJson(content);
    if (parsed && typeof parsed === "object") {
      return res.json(normalizeResult(parsed));
    }
    // Attempt repair via secondary instruction
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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify(repairBody),
      });
      const repairData = await rr.json().catch(() => ({}));
      repairContent = repairData?.choices?.[0]?.message?.content || "";
    } else {
      repairContent = await geminiGenerateContent(
        [
          { role: "user", parts: [{ text: "Convert the following into STRICT valid JSON with keys supported_drugs, other_drugs, confidence (0..1), rationale. Output JSON only, no extra text." }] },
          { role: "user", parts: [{ text: content || "null" }] },
        ],
        { temperature: 0 },
      );
    }
    const repaired = tryParseStrictJson(repairContent);
    if (repaired && typeof repaired === "object") {
      return res.json(normalizeResult(repaired));
    }
    return res.json({
      supported_drugs: [],
      other_drugs: [],
      confidence: 0,
      rationale: "Model returned invalid JSON",
    });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`[copilot] listening on ${PORT}`);
  if (!API_KEY) {
    console.log("Missing server API key. Create server/.env and set OPENAI_API_KEY=... (or GEMINI_API_KEY=...).");
  } else {
    console.log(`AI provider: ${PROVIDER}`);
  }
});
