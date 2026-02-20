# Deployment & Local Preview

## Local development
- Install dependencies:
  - npm install
- Start dev (client + local AI server for proxy):
  - npm run dev
- Dev app URL:
  - http://localhost:8080 (or next available port)

## Local production preview
- Build static bundle:
  - npm run build
- Preview on a local server:
  - npm run preview
- Optional Live Server flow:
  - If you use “Go Live”, open the dist/ folder and go live from there.
  - Do not go live from the repo root unless it points to dist/index.html.

## Vercel deployment
- Repo root is the Vite app root (package.json, vite.config.ts, src/, index.html).
- vercel.json is configured for SPA routing without breaking API routes.
- Set environment variables in Vercel:
  - GEMINI_API_KEY (or OPENAI_API_KEY if you switch providers)
- After deployment:
  - GET /api/ai/ping should return { "ok": true } when the key is set.
  - UI is served from dist/ with SPA rewrites.

## Notes
- Frontend calls relative API routes:
  - /api/ai/ping
  - /api/ai/chat
  - /api/ai/detect-meds
- In production, these are served by Vercel Serverless Functions under /api/ai/*.
