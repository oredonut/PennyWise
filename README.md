# Pennywise 💸

A personal finance tracker for managing expenses, budgets, and spending analytics.

## Stack

- **Framework** — Next.js 14+ (App Router)
- **Language** — TypeScript
- **Styling** — Tailwind CSS + shadcn/ui
- **Database** — PostgreSQL via Prisma ORM
- **Auth** — NextAuth.js
- **State** — Zustand

## Project Structure

| Directory | Purpose |
|---|---|
| `app/(auth)` | Login and registration pages |
| `app/(dashboard)` | Protected app routes |
| `app/api` | REST API route handlers |
| `components/` | Feature-grouped UI components |
| `hooks/` | Custom React hooks |
| `lib/` | DB client, auth config, utilities |
| `store/` | Zustand global state slices |
| `types/` | Shared TypeScript type definitions |
| `prisma/` | Database schema |

## Getting Started

```bash
cp .env.example .env.local
npm install
npx prisma migrate dev
npm run dev
```

## Environment Variables

See `.env.example` for required variables.