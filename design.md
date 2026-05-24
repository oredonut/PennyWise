# PennyWise — Design System

> Gamified personal finance tracker for Nigerian university students.
> "Spend Smart. Save Smarter."

---

## 1. Design Philosophy

PennyWise sits at the intersection of **playful game UI** and **financial credibility**.
The aesthetic is light, warm, and doodle-accented — it should feel like a product a
Nigerian student actually wants to open, not a banking app that lectures them.

Reference feel: PostHog's confidence on white, but grounded in fintech trust signals.
Playful without being childish. Credible without being cold.

**The one memorable thing:** The Discipline Score should feel like checking your level
in a game. Everything else in the UI exists to support that moment.

**Target feel:** Encouraging coach energy. The app roots for you. It roasts you when
you overspend, but it's never an auditor.

**Anti-patterns (never do these):**
- No dark backgrounds as the default — light mode is primary
- No teal-dominant surfaces, backgrounds, or teal-on-teal compositions
- No owl mascots, P-letter coins, leaf logos, or clowns (obviously)
- No purple gradients, no heavy glassmorphism
- No Inter as the display or score font
- No uniform border-radius across every component
- No Western fintech sterility — this app knows it's Nigerian
- No cold clinical empty states — every empty state has personality

---

## 2. Color Tokens

### Core Backgrounds — Light Mode (Default)
```
--color-bg:         #F7F6F2   /* warm off-white canvas — not pure white */
--color-surface-1:  #FFFFFF   /* cards, panels */
--color-surface-2:  #F2F1ED   /* secondary surfaces, input backgrounds */
--color-surface-3:  #E8E7E2   /* tertiary, dividers */
--color-border:     rgba(0, 0, 0, 0.06)
--color-border-med: rgba(0, 0, 0, 0.10)
--card-shadow:      0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)
```

### Core Backgrounds — Dark Mode (Opt-in preference)
```
--color-bg:         #0D0D10
--color-surface-1:  #18181B
--color-surface-2:  #222228
--color-surface-3:  #2A2A30
--color-border:     rgba(255, 255, 255, 0.08)
--color-border-med: rgba(255, 255, 255, 0.14)
--card-shadow:      none
```

### Typography Colors
```
/* Light mode */
--color-text-primary:    #0F172A
--color-text-secondary:  #64748B
--color-text-muted:      #94A3B8

/* Dark mode */
--color-text-primary:    #F4F4F5
--color-text-secondary:  #A1A1AA
--color-text-muted:      #52525B
```

### Brand Accents — Use With Restraint
```
/* TEAL — frontend dev's accent color.
   Used ONLY for: score ring, progress bars, active nav, streak badge, CTAs.
   Never as a background. Never as body text. */
--color-teal:         #0D9488
--color-teal-light:   #CCFBF1   /* tinted backgrounds for badges/pills */
--color-teal-muted:   rgba(13, 148, 136, 0.08)
--color-teal-border:  rgba(13, 148, 136, 0.20)

/* AMBER/GOLD — Discipline Score number, achievements, money highlights.
   The score is ALWAYS amber. This is non-negotiable. */
--color-amber:        #D97706
--color-amber-light:  #FEF3C7
--color-amber-muted:  rgba(217, 119, 6, 0.08)

/* SEMANTIC — functional colors, not decorative */
--color-green:        #15803D   /* income, positive delta, score ≥60 */
--color-green-light:  #DCFCE7
--color-red:          #DC2626   /* broke score, over budget, danger */
--color-red-light:    #FEE2E2
--color-red-muted:    rgba(220, 38, 38, 0.07)
--color-warn:         #C2410C   /* score 30-59, approaching budget limit (85%+) */
--color-warn-light:   #FFEDD5
```

### Color Usage Rules
- Teal appears in max 3 places per screen: score ring + one progress element + active nav
- Amber owns the score number on every screen it appears — never reassign amber
- Semantic colors (green/red/warn) encode financial state only — never used decoratively
- The warm off-white background (`#F7F6F2`) is what makes accents pop without dark mode
- Never more than 2 accent colors visible at the same time in one component

---

## 3. Doodle Design Language

PennyWise uses hand-drawn SVG accents as a secondary visual layer. These are not
illustrations — they are lightweight decorative marks that give the UI warmth and
personality without distracting from the financial data.

### Doodle Element Types
```
Wavy underlines    — beneath "Discipline Score" section titles
Squiggly curves    — decorative corner accents on the score card
Small geometric    — dots, tiny arrows, open circles near score/achievement moments
Dashed borders     — budget warning toasts use dashed stroke instead of solid
Spark/star marks   — near score milestones and streak achievements
```

### Doodle Rules
- Doodles are SVG, never images or emoji used as decoration
- Opacity: 30–50% — they support the layout, never compete with it
- Colors: teal or amber only — same token system as the rest of the UI
- Scale: small and precise. A doodle should not exceed 20% of its parent's width
- Never add doodles to: transaction lists, financial data tables, input fields
- Add doodles to: score card, onboarding screens, empty states, achievement moments

### Warning Toast Style
Budget warnings use a **dashed border** — this is a deliberate doodle signal.
```
Background:  --color-warn-light
Border:      1.5px dashed rgba(194, 65, 12, 0.30)
Border-radius: --radius-md (not pill — doodle aesthetic is slightly square)
Text:        --color-warn, 12px DM Sans 500
Tone:        "You're 2 shawarmas away from Food bankruptcy"
```

---

## 4. Typography

### Font Stack
```
Display / Headings:  'Plus Jakarta Sans', sans-serif   (weights: 700, 800)
Body / UI labels:    'DM Sans', sans-serif              (weights: 400, 500, 600)
Numbers / Money:     'DM Mono', monospace               (tabular figures, weight: 500)
```

### Scale
```
--text-xs:    11px / 400 / 1.5   /* labels, captions, chart axes */
--text-sm:    13px / 400 / 1.6   /* secondary text, timestamps */
--text-base:  15px / 400 / 1.7   /* body, list item labels */
--text-md:    17px / 500 / 1.5   /* UI labels */
--text-lg:    20px / 600 / 1.3   /* section headings */
--text-xl:    24px / 700 / 1.2   /* card headings */
--text-2xl:   32px / 700 / 1.1   /* score display */
--text-3xl:   48px / 800 / 1.0   /* hero score (score screen only) */
```

### Money Amounts
All Naira amounts use DM Mono with tabular figures. No layout shift on value update.

```
₦1,248   ✓   (DM Mono, comma separator)
₦1248    ✗   (no comma)
N1,248   ✗   (N not ₦)
$1,248   ✗   (wrong currency)
```

### Typography Rules
- Score number is always the largest typographic element on its screen
- Section headers: Plus Jakarta Sans 700 — not 800 (reserve ExtraBold for scores/names)
- Transaction merchant names: DM Sans 500 (not monospace)
- Category status labels (On track / Near limit / Almost gone): DM Sans 600, 10–11px

---

## 5. Spacing & Layout

### Base Grid
```
--space-1:   4px
--space-2:   8px
--space-3:   12px
--space-4:   16px
--space-5:   20px
--space-6:   24px
--space-8:   32px
--space-10:  40px
--space-12:  48px
```

### Mobile Layout
```
Screen width:        375–430px (iPhone 12 → Plus)
Horizontal padding:  20px each side
Safe area top:       44px (status bar)
Safe area bottom:    34px (home indicator)
Bottom nav height:   64px + safe area
Card border-radius:  14px
Card padding:        14px–16px
```

### Touch Targets
```
Minimum touch target:  44 × 44px (non-negotiable)
List item height:      56px
FAB diameter:          50px
Bottom nav item width: 44px minimum
```

### Border Radius
```
--radius-sm:   6px    /* tags, badges, category icons */
--radius-md:   10px   /* buttons, inputs, warning toasts */
--radius-lg:   14px   /* cards */
--radius-xl:   18px   /* score card, bottom sheets */
--radius-full: 999px  /* pills, progress bars, FAB */
```

---

## 6. Core Components

### Discipline Score Widget
The most important component in the app. Treat it accordingly.

```
Score ring diameter:  88px (dashboard) / 64px (compact, elsewhere)
Ring stroke width:    5.5px
Ring background:      rgba(0,0,0,0.06) — light mode
Ring fill:            Teal (#0D9488) — score ≥60
                      Warn (#C2410C) — score 30–59
                      Red (#DC2626) — score <30
Score number:         DM Mono 26px / #D97706 (amber always — never changes color)
Score label:          DM Sans 9px uppercase / --color-text-muted
Wavy doodle:          SVG underline beneath the "Discipline Score" title text
```

### Category Budget Bar (card)
```
Card:            white, border-radius-lg, card-shadow
Row height:      56px total
Category icon:   30px rounded square, colored background matching category
Bar track:       6px height, rgba(0,0,0,0.06) background, border-radius-full
Bar fill states:
  Normal (0–84%):  Teal #0D9488
  Warning (85–99%): Warn #C2410C
  Over (100%+):     Red #DC2626
Status label:    10px DM Sans 600
  "On track" → color-teal
  "Near limit" → color-warn
  "Almost gone" → color-warn
  "Over budget" → color-red
```

### Transaction List Item
```
Height:       56px
Icon:         34px circle, category color as light tinted background
Merchant:     DM Sans 13px / 500 / text-primary
Timestamp:    DM Sans 11px / text-muted
Category tag: Omit from list — shown in timestamp line as "· Category"
Amount:       DM Mono 13px / 500
  Debit:      color-red (–₦2,400)
  Credit:     color-green (+₦25,000)
```

### Bottom Navigation
```
Height:        64px + safe-area-bottom
Background:    --color-surface-1
Top border:    1px solid --color-border
Active icon:   --color-teal
Inactive icon: --color-text-muted
Label:         10px DM Sans 500
FAB (center):  50px circle, background: --color-teal
               Shadow: 0 4px 14px rgba(13,148,136,0.35)
               Icon: white "+" 26px weight 300
               Margin-top: -10px (lifts above nav bar)
```

### Streak Badge (header)
```
Shape:        Pill
Background:   --color-teal-light (#CCFBF1)
Text:         --color-teal, 12px DM Sans 600
Icon:         Flame icon (Phosphor/Lucide)
Format:       "12 day streak"
Position:     Top-right of dashboard header
```

---

## 7. Insights Screen — Content Spec

**Why "Insights" not "Analytics":**
Analytics implies raw data for power users. Insights means the app has done the thinking
and is surfacing what matters. Every consumer finance app uses Insights for this reason.

### Insights Screen Sections (in order)

**1. Score Trend Chart**
- Line chart: discipline score over last 7 or 30 days (toggle)
- Y-axis: 0–100. Color-coded line: green where ≥60, amber 30–59, red <30
- Built with Recharts (web) / Victory Native (mobile)

**2. Monthly Breakdown**
- Donut/ring chart: spend per category as % of total
- Legend: category name + ₦ amount + percentage
- Tap a segment → drill into category transactions

**3. Smart Observations**
- AI-style text callouts generated from spend data:
  - "You spent 40% more on transport this week than last week"
  - "Food is your top category — ₦7,800 of ₦24,850 budget"
  - "You've logged every day for 12 days straight 🔥"
- Cards with a small doodle accent mark on the left border

**4. Month-over-Month Delta**
- Simple comparison row: This month vs last month for total spend
- Arrow up (red) / arrow down (green) with ₦ delta and % change
- Only shown from Month 2 onwards — hide gracefully in Month 1

**5. Monthly Roast**
- Shown at month end (last 3 days of month)
- Grade A–F based on final discipline score
- Culturally specific roast copy — not generic AI filler
- Example: "Grade C. You ate like a senator this month. 
  Chicken Republic took ₦12,400 of your ₦25,000. Adjust yourself."

---

## 8. OCR / Screenshot Capture — UI Notes

**Tech: Tesseract.js** (client-side OCR, no API cost)

Note: Tesseract.js requires image preprocessing for best accuracy on Nigerian payment
app screenshots (Opay, PalmPay, Kuda layouts vary). The confirmation screen is
therefore a critical trust layer — users must always review extracted transactions.

### Screenshot Capture Flow UI
```
1. Upload/share screen
   → Large dashed-border drop zone (doodle aesthetic: dashed = inviting)
   → "Drop your Opay or PalmPay screenshot here"
   → Camera icon + file picker

2. Processing state
   → Animated scan line over screenshot thumbnail
   → "Reading your transactions..." with progress indicator
   → Never show a spinner alone — show partial results as they extract

3. Confirmation screen
   → List of extracted transactions with inferred categories
   → Each row: editable amount + category picker
   → Unknown merchants flagged with amber dot + category picker
   → "Looks good — log all (n)" CTA button in teal
   → "Edit before logging" secondary action

4. Success state
   → Score animates update
   → Brief toast: "n transactions logged"
   → Returns to dashboard
```

### Confirmation Screen Design Rules
- Show the original screenshot thumbnail (small, top of screen) for reference
- Extracted rows use the same transaction list item style as the dashboard
- Editable fields inline — no modal for simple edits
- Amber dot on uncertain/uncategorized items (not red — uncertainty ≠ error)

---

## 9. Platform Notes

### Web — Phase 1 (Next.js)
```
Stack:          Next.js + Tailwind CSS + Framer Motion + Recharts
Layout:         max-width 420px, centered, no sidebar — simulate mobile
Animations:     Framer Motion for score counter, bar transitions
Charts:         Recharts for insights (score trend, category breakdown)
Fonts:          Google Fonts (Plus Jakarta Sans, DM Sans, DM Mono)
```

### Mobile — Phase 2 (React Native + Expo)
```
Stack:          React Native + Expo
Styling:        React Native StyleSheet (not Tailwind)
Navigation:     React Navigation — bottom tabs
Sheets:         react-native-bottom-sheet
Animations:     Reanimated 2 (score counter, bar fill transitions)
Notifications:  Expo Notifications
OCR:            Tesseract.js via expo-modules or WebView bridge
Fonts:          expo-google-fonts
```

---

## 10. Logo

### Rejected Directions (Do Not Revisit)
- Owl mascot with dollar sign eyes
- P-letter monogram with coin
- Leaf + coin combination
- Any clown-adjacent concept
- Generic teal gradient mark

### Selected Direction — Geometric ₦ Wordmark (Option C)

A custom geometric rendering of the ₦ Naira symbol as the logo mark, paired with
"PennyWise" in Plus Jakarta Sans ExtraBold.

**Why:** The ₦ is inherently Nigerian — no other fintech globally owns it. Rendered
geometrically (two vertical strokes + diagonal + two horizontal bars) it reads as
both a currency mark and a data/progress motif. Northface-level simplicity.

**Wordmark treatment:**
- "Penny" in --color-text-primary (near-black on light, near-white on dark)
- "Wise" in --color-teal
- Font: Plus Jakarta Sans 800
- Letter-spacing: -0.3px

**Icon / App store version:**
Combine: Naira Arc mark (Option A from explorations) — the ₦ mark inside a
partial teal ring (like the score ring) — on a white or off-white square with
rounded corners. The amber dot in the upper-right corner of the ring mark is the
doodle signature element that carries across all brand touchpoints.

**Renderings needed:**
- Light bg: dark wordmark + teal "Wise" + geometric ₦ mark
- Dark bg: white wordmark + teal "Wise" + geometric ₦ mark
- App icon: teal ring + ₦ mark on #F7F6F2 background, rounded square
- Monochrome: single-color version for stamps/watermarks

---

## 11. Nigerian Context — Design Decisions

These are intentional product features, not cultural footnotes.

- **₦ symbol everywhere** — never NGN, never $, never N
- **Budget warnings** use student-specific language: "2 shawarmas away from Food bankruptcy"
- **Default categories** map to real Nigerian student spend: Opay/PalmPay transfer,
  data, transport, food, rent, hangout, school supplies
- **Score framing** is direct and gamified: "Discipline Score: 73 · Broke Score: 27"
- **Empty states** have personality: "Budget set. Nothing spent yet. Let's keep it that way."
- **Month-end roast** is culturally specific — not generic "Great job this month!" copy
- **Merchant names** in the app default to Nigerian context (Chicken Republic, Mr Biggs,
  Bolt, Shoprite, Tantalizers) — not Starbucks, Walmart, etc.
- **Tesseract OCR pipeline** handles Opay, PalmPay, Kuda, Moniepoint, GTBank app
  screenshots — the confirmation screen handles correction gracefully

---
