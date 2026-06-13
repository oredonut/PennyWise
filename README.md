# PennyWise

Gamified personal finance tracker for Nigerian university students.

## Repo Structure
PennyWise/
├── pennywise/     ← Next.js 15 web app + Supabase backend (Xanes)
├── mobile/        ← React Native / Expo mobile app (Moimoi) — setup in progress
└── docs/          ← Specs and plans

## Quick Start

### Backend / Web (pennywise/)

```bash
cd pennywise
cp .env.example .env.local          # fill in Supabase keys
npm install
npm run dev                          # → http://localhost:3000
```

> From the **repo root** you can also run `npm run dev:api` — same thing.

### Mobile (mobile/) — not ready yet

See `mobile/HANDOFF.md` for full setup instructions before touching this workspace.
The mobile app requires Expo SDK 53 and has zero dependencies installed by default.
Do **not** run `npm install` from the repo root expecting mobile to be ready — it isn't.

---

## Design References

| File | What it is |
|---|---|
| `design.md` | Authoritative design system — tokens, components, all 25 screens |
| `PennyWise.html` | Interactive prototype — open in browser to inspect any screen |
| `mobile/HANDOFF.md` | Full mobile setup guide for Moimoi |

**Rule:** Shipped screenshots in `design.md` override any written spec. When in doubt, look at the prototype.

---

## Environment Variables

Both workspaces need their own `.env.local`. See the `.env.example` in each workspace:
- `pennywise/.env.example` — Supabase URL + keys for the web app
- `mobile/` — needs `EXPO_PUBLIC_API_URL` pointing at the running `pennywise/` server

Never commit `.env` or `.env.local`. Both are gitignored.

---

## Branch Strategy

| Branch | Owner | Purpose |
|---|---|---|
| `main` | shared | stable, reviewed code only |
| `moimoi-frontend` | Moimoi | all frontend / mobile work |
| `xanes-backend` | Xanes | backend, API routes, Supabase |

---

## Team

- **Xanes** — backend, API routes, Supabase schema, scoring engine, Edge Functions
- **Moimoi** — frontend, all screens, design system implementation, mobile

Schema changes and API shape changes: Xanes defines, Moimoi consumes. Heads-up required before any breaking change.
