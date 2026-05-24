# Overview

Pennywise is a gamified personal finance tracker built specifically for Nigerian university students. The core thesis is that manual expense tracking fails because it has no feedback loop — Pennywise fixes this with a real-time discipline scoring system, automatic transaction capture via screenshot OCR, and behavioral nudges that make money management feel less like accounting and more like a game.

**Team:** Xanes (all backend) · Moimoi (all frontend)

**Target deadline:** September 2026 (SIWES portfolio)

**Primary platform:** Cross-platform web app (Next.js) + React Native mobile for screenshot capture

---

# Problem Statement

Nigerian students have no reliable way to track spending. Manual expense apps fail within two weeks — the habit loop collapses, data gaps accumulate, insights become meaningless, app gets abandoned. Budgeting apps built for Western users don't map to the Nigerian context: Naira, local merchants, bank SMS alerts, USSD-heavy banking.

The real problem is not tracking — it's friction. Every tap between a transaction happening and it appearing in the app is a dropout point. Pennywise eliminates that with screenshot-based auto-capture: drop a screenshot of your Opay or PalmPay transaction history and every transaction is extracted and logged automatically.

---

# Target Users

- Nigerian university students on urban campuses (UNILAG, LASU, UI, OAU — expand later)
- Android and iOS users — screenshot capture works on both platforms, no OS-level restriction
- Students on allowances or part-time income, not salary earners
- **Primary payment apps:** Opay, PalmPay, Kuda, Moniepoint (where Nigerian Gen Z students actually are)
- **Secondary:** Traditional bank apps (GTBank, Access, UBA) — screenshot pipeline handles these too

---

# Core Constraints

- Screenshot OCR via Claude Vision API — handles any payment app layout without bank-specific regex.
- Claude Vision API has a per-call cost. Batch extraction (one screenshot = multiple transactions) keeps this negligible at student usage volume.
- No bank API (Mono, Okra) — CBN licensing and cost barrier. Not needed given screenshot approach.
- Two-person team. Hard split: Xanes owns all backend, Moimoi owns all frontend.
- Supabase free tier at early stage — schema must be designed with row count and bandwidth in mind.

---

# Phase 1 — Web MVP, Manual Input

*Shippable in 2–3 weeks. Demonstrates full-stack competence. First internship talking point.*

## Onboarding (intent-based, not form-based)

Do not present blank budget forms on first launch. Use intent-driven setup instead — users pick their lifestyle, the app generates budgets from that.

**Step 1 — Spending profile:**

Multi-select checklist. "What do you mostly spend on?"

- Food & drinks · Transport · Data / airtime
- Rent / accommodation · Leisure & hangouts
- Subscriptions · School supplies

**Step 2 — Monthly income:**
  
Single input. "How much do you receive monthly? ₦ "

**Step 3 — Smart budget distribution:**

App auto-splits budget based on selected categories using preset ratios (e.g. food 35%, transport 20%, data 15%, leisure 20%, misc 10%). User adjusts sliders — no blank fields to fill from scratch.

**Step 4 — Recurring setup:**

For categories marked in Step 1, ask for estimated monthly amounts. These become recurring transactions — pre-populating the dashboard immediately.

This converts the cold start problem into the onboarding mechanic. User lands on a dashboard with budget bars already populated and a score that reflects expected recurring spend, not a meaningless 100.

**Cold start design rule:** the empty state is framed as a starting line, not a broken screen. Empty category cards read: "Budget set. Nothing spent yet. Let's keep it that way."

## Dashboard

- **Discipline Score** (0–100, animated counter on change, green ≥60 / amber 30–59 / red <30)
- **Broke Score** (100 minus discipline score, shown in red as a second framing)
- **Streak counter** — consecutive days of logging activity
- **Category budget bars** — progress per category with Naira remaining +  their favortite snack or  their native - to the individual exchange e.g. (shawarma-equivalent)
- **Budget warnings** at 85% threshold: *"You are 2 shawarmas away from Food bankruptcy"*
- **Recent transactions** list (last 5)

## Manual Transaction Input

- Category selector → amount (₦) → optional note → submit
- **Live impact preview** before committing: "After this: 3 shawarmas of Food budget left"
- Optimistic UI — transaction prepended to list instantly, DB write in background

## Scoring Formula

```
base_score          = clamp((1 - total_spent / total_budget) * 100, 0, 100)
streak_multiplier   = 1 + (log(streak_days + 1) * 0.1)   // diminishing returns
cat_consistency     = fraction of categories where spent < budget
final_score         = base_score * streak_multiplier * cat_consistency
```

Computed and stored daily in `daily_logs`. Historical scores power the weekly trend chart.

## Recurring Transactions

- Mark any transaction as recurring (weekly / monthly)
- Auto-logged on schedule via Supabase pg_cron
- Prevents the "forgot to log rent" data gap that breaks monthly insights

## Notifications

Not a bonus — core to the behavioral loop.

- Push at 75% of any category budget consumed
- Daily reminder at 9pm if no transactions logged today (streak preservation)
- End-of-month summary with discipline grade (A → F) and roast message

## Monthly Insights

- Total spent vs total budget
- Category breakdown — percentage + Naira amount per category
- 7-day discipline score bar chart
- Monthly roast: top spending category, with context-specific message
- Month-over-month delta (Month 2+)

## Phase 1 Stack

- **Frontend (Moimoi):** Next.js + Tailwind + Recharts + Framer Motion
- **Backend (Xanes):** Supabase (Auth + PostgreSQL + RLS + pg_cron)
- **Deployment:** Vercel (web)

---

# Phase 2 — Screenshot OCR Auto-Capture

*Cross-platform. Works on Opay, PalmPay, Kuda, any app. No bank-specific regex needed.*

## How Screenshot Extraction Works

User opens their payment app (Opay, PalmPay, Kuda, etc.), takes a screenshot of their transaction history, and shares or uploads it to Pennywise. The image is sent to the Claude Vision API which extracts all visible transactions as structured JSON. The app confirms the results, then bulk-logs them with one tap.

**This works on iOS and Android. No permissions required beyond photo library access.**

## Extraction Pipeline

```jsx
User uploads screenshot
→ base64 encode image
→ POST to Claude Vision API with extraction prompt
→ model returns JSON array of transactions
→ display confirmation screen: user reviews, edits if needed
→ run each transaction through auto-categorization
→ bulk INSERT into transactions (source = 'screenshot')
→ score recalculates → push notification fires if threshold crossed
```

## Claude Vision Extraction (Xanes — backend)

```jsx
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1000,
  messages: [{
    role: 'user',
    content: [
      {
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data: base64Image }
      },
      {
        type: 'text',
        text: `Extract all debit transactions from this payment app screenshot.
               Return ONLY a JSON array, no preamble:
               [{"amount": number, "merchant": string, "date": string}]
               Nigerian Naira only. Skip credits and failed transactions.`
      }
    ]
  }]
});

const transactions = JSON.parse(response.content[0].text);
```

This prompt handles Opay, PalmPay, Kuda, Moniepoint, GTBank app, Access app — any UI layout — without writing a single regex per bank.

## Auto-Categorization (Xanes — backend)

```jsx
const MERCHANT_CATEGORIES = {
  food:      ['shoprite', 'chicken republic', 'dominos', 'mr biggs',
               'tantalizers', 'eatery', 'restaurant', 'shawarma', 'bukka'],
  transport: ['uber', 'bolt', 'danfo', 'lagbus', 'terminal', 'park'],
  data:      ['mtn', 'airtel', 'glo', '9mobile', 'spectranet'],
  leisure:   ['cinema', 'netflix', 'spotify', 'games', 'sport'],
};

function categorize(merchant) {
  const m = merchant.toLowerCase();
  for (const [cat, keywords] of Object.entries(MERCHANT_CATEGORIES)) {
    if (keywords.some(k => m.includes(k))) return cat;
  }
  return 'misc'; // surfaces in review queue
}
```

## Confirmation + Review Screen (Moimoi — frontend)

After extraction, show a confirmation screen before committing:

- List of extracted transactions with inferred categories
- Inline edit for amount or category if OCR was slightly off
- "Looks good — log all" button for single-tap confirmation
- Unknown merchants flagged with a category picker

This is the trust layer. Users see what's being logged before it hits their score.

## Merchant Review Queue (Moimoi — frontend)

- Card-swipe UI for uncategorized transactions from past extractions
- "Always categorize [merchant] as [category]" — trains `merchant_map` per user
- Reduces review friction over time as the map learns

## SMS Parsing — Secondary, Traditional Bank Users

SMS parsing (Android only) remains available for users on GTBank, Access, UBA, Zenith, First Bank who prefer automatic background capture over screenshot uploads. This is the Phase 2b track, not the primary path.

- Android only, `READ_SMS` + `RECEIVE_SMS` permissions
- Bank-specific regex per sender ID (GTBank, Access, UBA, Zenith, First Bank)
- Same extraction pipeline — INSERT with `source = 'sms'`
- Runs as a background task via React Native background service

## Phase 2 Stack

- **Mobile (Moimoi):** React Native + Expo — screenshot picker, confirmation UI, push notifications
- **Backend (Xanes):** Claude Vision API integration, categorization engine, Supabase inserts
- **Same Supabase backend** as Phase 1
- **Distribution:** APK sideload for dev/demo, Play Store for production

---

# Phase 3 — Telegram Bot /Whatsapp *(Future Milestone)*

*Covers users who prefer not to install a native app. Also a fallback for banks not covered by SMS regex.*

- User sends `/link` to activate the bot, receives a user token
- Forwards bank SMS alerts directly to the Telegram bot
- Bot parses using the same extraction pipeline (server-side this time)
- Logs to Supabase, web dashboard reflects it
- Natural extension of the Whispr architecture (Node.js + Telegram webhook)
- WhatsApp is lower priority — Business API has approval overhead and per-message cost

---

# Data Model

```sql
users
  id, email, monthly_income, created_at

categories
  id, user_id, name, monthly_budget, color, is_custom

transactions
  id, user_id, category_id, amount, note,
  source ('manual' | 'screenshot' | 'sms' | 'recurring'),
  merchant_raw, created_at

recurring_rules
  id, user_id, category_id, amount, note,
  frequency ('weekly' | 'monthly'), next_fire_at

daily_logs
  id, user_id, date, discipline_score, total_spent

streaks
  id, user_id, current_streak, longest_streak, last_logged_at

merchant_map
  id, user_id, merchant_keyword, category_id
  -- user-trained merchant → category mappings, grows over time
```

**Security rule:** Supabase RLS policy on every table. Every query enforces `auth.uid() = user_id`. No public access, no exceptions.

---

# Team Split

Hard split: Xanes owns all backend. Moimoi owns all frontend. No ambiguity.

**Xanes — Backend**

- Supabase schema, migrations, RLS policies
- Scoring algorithm + daily_logs computation
- Claude Vision API integration + extraction prompt engineering
- Auto-categorization engine + merchant_map logic
- SMS parsing engine (regex, Android background service)
- Supabase pg_cron for recurring transactions
- All API routes + Supabase Edge Functions

**Moimoi — Frontend**

- Next.js dashboard, routing, page structure
- Intent-based onboarding flow (4-step)
- Screenshot upload UI + extraction confirmation screen
- Transaction input UI + live impact preview
- Merchant review queue (swipe UI)
- Category bars, insights charts, score animation
- React Native mobile setup + Expo Notifications
- Push notification UI + empty states
- Design system + component library

**Shared interface contract:**

Xanes defines the Supabase schema and API response shapes. Moimoi consumes them. Any schema change requires a heads-up before Moimoi builds against it.

---

# Internship Readiness Milestones

## Stage 1 — Conversation starter

*Phase 1 shipped and deployed*

Live web app, manual input working, scoring system running, insights dashboard populated. Vercel deployment with real URL. Clean README with screenshots and a live demo link.

What this demonstrates: full-stack competence, product thinking, UI quality, ability to ship end-to-end.

## Stage 2 — Portfolio centrepiece ✦ *Target this*

*Phase 1 + Screenshot OCR live on device*

Screen recording showing: open Opay → screenshot transaction history → share to Pennywise → transactions extracted and confirmed in one tap → dashboard updates, score animates. Works on Android and iOS.

What this demonstrates: AI Vision API integration, product thinking around friction, cross-platform engineering, real financial data handling. This is the bar for a strong internship application.

## Stage 3 — Senior-level story

*Phase 2 fully polished + real usage data*

All 5 banks covered, merchant learning functional, offline queue with sync, real friends using it with measurable retention. Telegram bot as a second capture channel.

What this demonstrates: product maturity, edge case depth, real-world usage data. Relevant for fintech and Web3-adjacent roles specifically.

**Timeline:** Stage 1 in weeks 1–3. Stage 2 in weeks 4–6. That hits the September SIWES deadline with room to polish.

---

# Open Questions

- [ ]  Shared budgets between two users (roommates splitting expenses)? → Defer to Phase 3 if yes
- [ ]  Should merchant_map be global/community-trained or per-user only? Global is more useful but needs moderation
- [ ]  Offline-first needed for Phase 2? Campus WiFi is spotty — transactions should queue locally and sync
- [ ]  Claude Vision API cost at scale — set a per-user monthly extraction limit if needed (e.g. 30 screenshots/month free)
- [ ]  Play Store distribution plan for Phase 2? APK sideload during dev, internal testing track for demo
- [ ]  Does Moimoi have React Native experience or is there a ramp-up week needed?
- [ ]  How does the shared interface contract work in practice? Agree on Supabase types and API shapes before Moimoi starts building.

---

# Explicitly Out of Scope

- iOS SMS tracking — OS-level restriction. Screenshot OCR is the iOS path instead.
- Bank API integration (Mono, Okra) — cost and CBN licensing
- Investment tracking, savings goals — scope creep
- Web scraping bank portals — legal risk
- Multi-currency — Nigeria-first only
- WhatsApp bot in Phase 1/2 — Business API overhead