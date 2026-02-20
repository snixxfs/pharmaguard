# PharmaGuard 🛡️

Educational only — Not medical advice.

[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18-149ECA.svg?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Deploy on Vercel](https://img.shields.io/badge/Deploy-Vercel-000.svg?logo=vercel&logoColor=white)](https://vercel.com/)

Hackathon‑grade pharmacogenomics (PGx) tool that validates a VCF, maps variants → phenotypes, and outputs CPIC‑aligned guidance with evidence traceability — plus an optional LLM Copilot (server‑side env key only).

---

## What It Does

- Upload VCF v4.2 and validate with clear, human‑friendly errors.
- Deterministic PGx analysis (no randomness): variant parsing → phenotype mapping → risk labels per drug.
- CPIC‑aligned recommendations and dosage guidance (when available in‑app).
- Export JSON results (download + copy‑to‑clipboard).
- History of runs to compare, re‑open, download, or delete.
- Knowledge section: offline reference for supported genes and drugs.
- Optional Copilot: grounded explanations using the current run context; server‑side AI key only.

---

## Supported Coverage

| Genes     | Drugs         |
|-----------|---------------|
| CYP2D6    | Codeine       |
| CYP2C19   | Clopidogrel   |
| CYP2C9    | Warfarin      |
| SLCO1B1   | Simvastatin   |
| TPMT      | Azathioprine  |
| DPYD      | Fluorouracil  |

---

## Key Features

- VCF validation before processing (size hints, graceful missing annotations, useful errors).
- Evidence traceability: surfaces rsIDs when available.
- Schema‑safe output using Zod validation.
- Download JSON + Copy JSON actions.
- Optional Copilot and AI “detect‑meds” endpoints (server‑side only; no keys in client).
- HashRouter for SPA‑friendly static hosting.

---

## Tech Stack

- Frontend: React + TypeScript + Vite
- UI: Tailwind, shadcn/ui, lucide‑react, framer‑motion
- Charts: Recharts
- Validation: Zod
- Routing: HashRouter (static hosting friendly)

---

## Architecture Overview

```
Upload VCF
   ↓ (VCF v4.2 validation)
Deterministic PGx Engine
   ↓
Zod Schema Validation → Results UI → Export JSON (download / copy)

Optional:
Copilot / Detect‑meds → /api/ai/* (serverless) → LLM Provider (Gemini / OpenAI)
```

---

## Local Setup

Prereqs:
- Node 18+ (recommended LTS)

Install:

```bash
npm install
```

Dev (prints local URL; use hash routes like `#/analyze`):

```bash
npm run dev
```

Build:

```bash
npm run build
```

Preview (serves the built app):

```bash
npm run preview
```

Common gotcha:
- If “Go Live” / Live Server shows a directory listing, you opened the wrong folder. For static hosting, serve the built `dist` folder or use `npm run preview`. The actual app is at the Vite/preview URL (hash routes such as `#/analyze`).

---

## AI Setup (Optional)

Keys must be server‑side only. Never store API keys in the client.

Environment variables:

```bash
# Use one provider (Gemini recommended) – set on the server only
GEMINI_API_KEY=your_key_here
# Optional alternative if supported in your deployment
OPENAI_API_KEY=your_key_here
```

Local verification:
- Start the app and visit `/api/ai/ping` → should return `{ "ok": true }` when the key is configured correctly.

Notes:
- Copilot and detect‑meds use relative server routes: `/api/ai/ping`, `/api/ai/chat`, `/api/ai/detect-meds`.
- In production (Vercel), these run as serverless functions.

---

## Deployment (Vercel)

1. Push the repository to GitHub (app lives at repo root).
2. Import the repo in Vercel.
3. In Vercel → Project Settings → Environment Variables, set:
   - `GEMINI_API_KEY` (or `OPENAI_API_KEY`)
4. Build command: `npm run build`
5. Output directory: `dist`
6. Routing:
   - The app uses HashRouter (`#/route`) so client‑side navigation works on static hosts.
   - A SPA rewrite is included for future BrowserRouter migration.
7. Verify:
   - Visit `/api/ai/ping` → `{ "ok": true }` when the env key is set.
   - UI loads at your Vercel URL with hash routes (e.g., `/#/analyze`).

---

## Safety & Disclaimer

- Educational/demo only. Not medical advice.
- Not a substitute for clinical tools or clinician judgment.
- Always consult qualified professionals for patient care decisions.

---

## License

MIT License — see the LICENSE file if provided. Otherwise, consider this project MIT for hackathon/demo use.

---

## Credits

- Built by Team PharmaGuard for hackathon/demo use.
- Thanks to CPIC for publicly available PGx guidance and to OSS libraries that power this project.
