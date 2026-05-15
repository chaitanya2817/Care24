# CareAI

AI-powered healthcare assistant with multilingual symptom chat, risk assessment, telemedicine booking, real-time wearable vitals, and voice input — built for Indian users (EN/HI/KN).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/careai run dev` — React frontend (port 21392, proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `SESSION_SECRET`, `JWT_SECRET` (set in Secrets)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite, Recharts, Framer Motion
- API: Express 5, Helmet, express-rate-limit, CORS
- Auth: JWT (15 min access token + 7 day refresh rotation), bcryptjs
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/careai/src/` — React app root
  - `components/` — 14 feature components (ChatBot, Assessment, VoiceAssistant, Analytics, Telemedicine, Wearables, AuthModal, Navbar, Hero, Footer, Toast, EmergencyBanner, RiskDashboard, HealthReport)
  - `contexts/` — AuthContext (JWT), LanguageContext (EN/HI/KN), ToastContext
  - `hooks/useVoice.ts` — Web Speech API hook (listen + speak, multilingual)
  - `utils/api.ts` — shared fetch utility with auto token-refresh
  - `locales/` — en.json, hi.json, kn.json
  - `index.css` — dark glassmorphism design system (CSS variables, animations)
- `artifacts/api-server/src/routes/` — auth, chat, assessment, report, voice, user, telemedicine, analytics, health
- `lib/db/src/schema/` — users, refresh_tokens, chat_messages, assessments, reports, voice_transcripts, doctors, appointments
- `lib/api-spec/` — OpenAPI spec (source of truth for contract)
- `lib/api-zod/` — generated Zod schemas from spec
- `lib/api-client-react/` — generated React Query hooks

## Architecture decisions

- **Custom `apiCall` util instead of generated React Query hooks** — avoids QueryClient setup complexity; handles JWT refresh transparently; components call it directly.
- **JWT stored in localStorage** — refresh token under `careai_refresh_token`; access token in memory (AuthContext state).
- **Trust proxy enabled** (`app.set('trust proxy', 1)`) — required for accurate rate-limiting behind Replit's reverse proxy.
- **Web Speech API via `any` cast** — TypeScript lib doesn't include SpeechRecognition; using safe runtime detection to support Chrome/Edge/Safari.
- **Doctors table seeded at setup** — 6 doctors seeded via psql; Telemedicine component fetches from `/api/telemedicine/doctors` at runtime with client-side fallback.

## Product

- **AI Symptom Chat** — conversational interface with emergency detection and quick-reply pills
- **Symptom Assessment** — multi-step health form, risk scoring, DB persistence
- **Voice Assistant** — mic input + TTS in EN/HI/KN via Web Speech API
- **Analytics Dashboard** — Recharts-powered risk trends, session history
- **Telemedicine** — doctor listing from DB, appointment booking (auth optional)
- **Live Wearables Panel** — simulated real-time heart rate, SpO2, BP, temperature, steps
- **Auth System** — JWT register/login with refresh rotation, persisted across sessions
- **Multilingual UI** — full EN/हिंदी/ಕನ್ನಡ support via LanguageContext + locale JSON

## User preferences

- Preserve dark glassmorphism aesthetic at all times
- No placeholder/mock data for API responses — always real DB or meaningful fallback
- Keep all TypeScript strict — no `any` except Web Speech API browser types

## Gotchas

- `restart_workflow` for careai needs `workflow_timeout: 120` — Vite starts fast but Replit port detection takes ~60s in workflow context
- CSS custom property naming: use `--border-color` (not `--border`) and `--clr-red` (not `--red`) to avoid shadcn conflicts
- API server must have `app.set('trust proxy', 1)` before express-rate-limit or it throws `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`
- Always run `pnpm --filter @workspace/db run push` after any schema change

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
