# PennyWise Mobile — Handoff to Moimoi

**Branch:** `moimoi-frontend`  
**Design source of truth:** `/design.md` (repo root) — generated from the actual prototype files  
**Interactive reference:** `PennyWise.html` — open in a browser to inspect any screen  
**Last updated:** 2026-06-04

---

## 1. Current State

### What exists on disk inside `mobile/`

```
mobile/
├── package.json          ← workspace package stub — zero dependencies declared
├── global.css            ← stale CSS variables — wrong font stack, wrong tokens, discard
├── components/
│   ├── app-tabs.web.tsx  ← web-only tab bar stub using expo-router/ui (wrong nav library)
│   └── themed-text.tsx   ← ThemedText — imports a hook and token file that are both wrong
└── constants/
    └── theme.ts          ← entire file is stale — tokens, fonts, spacing all replaced by new design.md
```

**That is the entire mobile codebase.** No app entry point, no screens, no navigation,
no installed packages, no TypeScript config, no Expo project config.

### What is wired up at the monorepo level

The root `package.json` registers `mobile` as an npm workspace:

```json
{
  "name": "pennywise-root",
  "workspaces": ["pennywise", "mobile"],
  "scripts": {
    "dev:api": "npm run dev --workspace=pennywise",
    "dev:app": "npm run start --workspace=mobile"
  }
}
```

`npm run dev:app` from the repo root will forward to `npx expo start` inside `mobile/`.
The workspace wiring is correct. However `npm install` at the root installs nothing for
mobile because `mobile/package.json` has zero dependencies declared.

### What the `src/` → `mobile/` migration did (and did not do)

The four source files were renamed from `src/` to `mobile/` and a bare `mobile/package.json`
was created. No orphaned `src/` files remain. What the migration did **not** do: add any
dependencies, set up Expo config, or align the token file to the design system.

### TypeScript status

No `tsconfig.json` exists in `mobile/`. Running `tsc --noEmit` there prints the help
text — no compilation happens. There are no type errors on record only because the
compiler has never run.

---

## 2. What's Left to Be Done

### A. Structure & Config Gaps — do these first

- [ ] **`mobile/app.json`** — Expo project config. At minimum: `name`, `slug`,
  `version`, `platforms: ["ios","android"]`, `scheme: "pennywise"` (for deep-link auth
  callback), `icon`, `splash`, `assetBundlePatterns: ["**/*"]`.

- [ ] **`mobile/tsconfig.json`** — Extend `expo/tsconfig.base`. Add path aliases:
  ```json
  { "compilerOptions": { "paths": { "@/*": ["./*"] } } }
  ```
  The `@/` alias is already used in every existing file — it resolves nothing without this.

- [ ] **`mobile/metro.config.js`** — Required for monorepo workspace resolution:
  ```js
  const { getDefaultConfig } = require('expo/metro-config');
  module.exports = getDefaultConfig(__dirname);
  ```

- [ ] **`mobile/babel.config.js`** — Required by Expo:
  ```js
  module.exports = function(api) {
    api.cache(true);
    return { presets: ['babel-preset-expo'] };
  };
  ```

- [ ] **`mobile/tokens.ts`** — Replace `constants/theme.ts` entirely. The canonical
  token file for RN is specified in `design.md §12`. Copy it verbatim (see §C below
  for what the current `theme.ts` gets wrong).

- [ ] **App entry point** — Navigation is React Navigation (confirmed in `design.md §12`),
  not expo-router. Create `mobile/App.tsx` as the root and set `"main": "App.tsx"` in
  `app.json`. Wire up `NavigationContainer` + bottom tab navigator here.

- [ ] **`mobile/hooks/use-theme.ts`** — `themed-text.tsx` imports this hook but it
  doesn't exist. Should read `useColorScheme()` and return the correct `Colors` object
  from `tokens.ts`. Dark mode swaps only neutral surface/text tokens — teal, amber,
  danger, and success values are unchanged.

- [ ] **`mobile/components/themed-view.tsx`** — Imported in `app-tabs.web.tsx` but
  doesn't exist. `View` wrapper that reads background color from the theme.

- [ ] **`mobile/components/external-link.tsx`** — Imported in `app-tabs.web.tsx` but
  doesn't exist. Wraps `Linking.openURL`.

- [ ] **`mobile/assets/`** — Expo needs icon and splash images. Fonts (Bricolage
  Grotesque, Plus Jakarta Sans, JetBrains Mono) are loaded via `expo-google-fonts`,
  not bundled as files, but an `assets/` directory is still expected by Expo for
  icon/splash.

---

### B. Missing or Broken Dependencies

`mobile/package.json` declares zero dependencies. All of the following need to be added
and installed (`npm install` from the repo root after adding):

**Required to boot:**

| Package | Why |
|---|---|
| `expo` | Core SDK — pin to current stable (SDK 53) |
| `react` / `react-native` | Expo peer deps |
| `expo-font` | Font loading — required before `expo-google-fonts` |
| `@expo-google-fonts/bricolage-grotesque` | Display / heading font |
| `@expo-google-fonts/plus-jakarta-sans` | Body / paragraph font |
| `@expo-google-fonts/jetbrains-mono` | Monospace / amounts font |
| `@react-navigation/native` | Navigation container |
| `@react-navigation/bottom-tabs` | Bottom tab navigator |
| `react-native-screens` | Required by React Navigation |
| `react-native-safe-area-context` | Safe area insets — bottom nav, status bar |
| `react-native-svg` | ScribbleLayer + all doodle components (see §D) |

**Feature — referenced in design.md:**

| Package | Why |
|---|---|
| `expo-notifications` | Push notifications (design.md §12) |
| `expo-image-picker` | Screenshot capture / OCR upload flow |
| `react-native-reanimated` | Score ring, bar fills, confetti, entrance animations |
| `react-native-bottom-sheet` | Bottom sheets (design.md §12) |
| `victory-native` | Score trend line chart + category donut (design.md §7) |
| `@supabase/supabase-js` | Mobile Supabase client (separate from backend — see §E) |
| `@react-native-async-storage/async-storage` | Supabase auth storage adapter for RN |

**Install command (after adding to package.json):**
```bash
npx expo install react-native-svg react-native-reanimated react-native-screens \
  react-native-safe-area-context react-native-bottom-sheet \
  expo-notifications expo-image-picker \
  @expo-google-fonts/bricolage-grotesque \
  @expo-google-fonts/plus-jakarta-sans \
  @expo-google-fonts/jetbrains-mono
```

---

### C. Token Migration — `constants/theme.ts` → `tokens.ts`

**The existing `mobile/constants/theme.ts` is entirely wrong against the new design system.
Delete it and replace with `mobile/tokens.ts` as specified in `design.md §12`.**

Summary of what's wrong, for context:

| What | Old `theme.ts` | New `design.md` |
|---|---|---|
| Primary/teal | `#0D9488` | `#0f766e` (darker — `--teal`) |
| Background | `#F7F6F2` | `#faf7f2` (`--bg`) |
| Card surface | `#E2E8F0` | `#ffffff` (`--surface`) |
| Subtle fill | *(missing)* | `#f3ede4` (`--surface-tint`) |
| Borders | *(missing)* | `#e2d9ce` (`--border`) |
| Primary text | `#0F172A` | `#1a1714` (`--text-1`) |
| Secondary text | `#475569` | `#6b6157` (`--text-2`) |
| Tertiary text | *(missing)* | `#a89e95` (`--text-3`) |
| Accent / income | `#22C55E` | `#16a34a` (`--success`) |
| Amber / score | `#F59E0B` | `#d97706` (`--amber`) |
| Danger | `#EF4444` | `#dc2626` (`--danger`) |
| Display font | `PlusJakartaSans_800ExtraBold` | Bricolage Grotesque |
| Body font | `DMSans_400Regular` | Plus Jakarta Sans |
| Mono font | `DMSans_500Medium` (placeholder) | JetBrains Mono |
| Border radii | sm:6, md:10, lg:14, xl:18 | sm:8, md:14, lg:20, xl:28 |
| Spacing scale | custom named scale | *(use design.md §4 values)* |

The canonical `tokens.ts` to create (straight from `design.md §12`):

```ts
export const Colors = {
  bg: '#faf7f2',
  surface: '#ffffff',
  surfaceTint: '#f3ede4',
  border: '#e2d9ce',
  text1: '#1a1714',
  text2: '#6b6157',
  text3: '#a89e95',
  teal: '#0f766e',
  tealLight: '#ccfbf1',
  amber: '#d97706',
  amberLight: '#fef3c7',
  danger: '#dc2626',
  dangerLight: '#fee2e2',
  success: '#16a34a',
  successLight: '#dcfce7',
  doodle: '#c9bfb5',
} as const;

export const ColorsDark = {
  bg: '#0f0e0c',
  surface: '#1c1a17',
  surfaceTint: '#252219',
  border: '#302c26',
  text1: '#f5ede4',
  text2: '#9e9086',
  text3: '#5c5249',
  teal: '#0f766e',      // unchanged in dark mode
  tealLight: '#0d3330',
  amber: '#d97706',     // unchanged in dark mode
  amberLight: '#2a1f0a',
  danger: '#dc2626',    // unchanged in dark mode
  dangerLight: '#2a0f0f',
  success: '#16a34a',   // unchanged in dark mode
  successLight: '#0a2a14',
  doodle: '#3d3730',
} as const;

export const Radius = {
  sm: 8, md: 14, lg: 20, xl: 28, pill: 999,
} as const;

export const Shadow = {
  card: '0 2px 12px rgba(26,23,20,0.07)',
  float: '0 8px 32px rgba(26,23,20,0.13)',
} as const;
```

---

### D. ScribbleLayer — Implementation Required

The doodle/scribble system is PennyWise's most distinctive element and must be present
on every screen. Full spec is in `design.md §6`. Implementation notes:

- Use `react-native-svg`. Render as `<Svg viewBox="0 0 390 844">` with absolute
  positioning, `pointerEvents="none"`, same z-index as a background layer.
- 8 symbol types with exact SVG paths are in `design.md §6`.
- Fixed placement coordinates (19 symbols total) are in `design.md §6` — not random.
- Stroke: `1.5px`, color `#c9bfb5` (light) / `#3d3730` (dark), never filled.
- Opacity varies by screen type — see `design.md §6` opacity table.
- **Strictly empty zone:** y:120–720 between x:50–340. All cards live here. Doodles
  only appear in the gutters and top/bottom bands.
- Bottom sheets and modals: **no scribble layer** — clean surface only.
- `Scribble_Layer.html` in the prototype files has a React Native SVG export utility.

Inline doodle components (`<DoodleRect>`, `<DoodleDashedRect>`, `<DoodleCircle>`,
`<DoodleUnderline>`, `<DoodleStar>`, `<DoodleArrow>`, `<DoodleSparkles>`) are separate
from the background ScribbleLayer — used as decorative accents on specific screens.
Source in `lib.jsx`.

---

### E. Screens & Components — All 25 to be Built

Navigation structure: React Navigation `createBottomTabNavigator` with a custom `tabBar`
render prop for the lifted centre FAB. 5 slots: Home · Transactions · [FAB] · Goals · Profile.

#### Section 1 — Onboarding & Auth
| # | Screen | Component |
|---|---|---|
| 01 | Splash | `SplashScreen` |
| 02 | Onboarding | `OnboardingScreen` |
| 03 | Sign Up | `SignupScreen` |
| 04 | Login | `LoginScreen` |
| 05 | OTP Verification | `OtpScreen` |
| 06 | Profile Setup | `ProfileSetupScreen` |

#### Section 2 — Core App
| # | Screen | Component |
|---|---|---|
| 07 | Dashboard | `DashboardScreen` |
| 08 | Add Transaction | `AddTransactionScreen` |
| 09 | Snap Receipt (OCR) | `OcrScreen` |
| 10 | Transaction Detail | `TxnDetailScreen` |

#### Section 3 — Insights, Goals & System
| # | Screen | Component |
|---|---|---|
| 11 | Insights | `InsightsScreen` |
| 12 | Discipline Score Detail | `ScoreDetailScreen` |
| 13 | Goals | `GoalsScreen` |
| 14 | Profile & Settings | `ProfileScreen` |
| 15 | Empty States | `EmptyStatesScreen` |

#### Section 4 — Roasts, Streaks & Celebrations
| # | Screen | Component |
|---|---|---|
| 16 | Roast Feed | `RoastFeedScreen` |
| 17 | End-of-Month Report | `EomReportScreen` |
| 18 | Streak + Break | `StreakScreen` |
| 19 | Score History | `ScoreHistoryScreen` |
| 20 | Milestone Celebration | `MilestoneScreen` |

#### Section 5 — Budget Management & System
| # | Screen | Component |
|---|---|---|
| 21 | Budget Edit | `BudgetEditScreen` |
| 22 | New Month Reset | `NewMonthScreen` |
| 23 | Batch OCR Review | `BatchOcrScreen` |
| 24 | Share Card Generator | `ShareCardScreen` |
| 25 | Notification Preferences | `NotifPrefsScreen` |

**Component reference:** Every shared primitive (`<Screen>`, `<BottomNav>`, `<Icon>`,
`<ScoreRing>`, `<SubHeader>`, `<DoodleMedal>`, `<DoodleFlame>`, `<Confetti>`,
`<ScoreBars>`, `<Logomark>`) is defined in `lib.jsx` with exact prop signatures.
Inspect `PennyWise.html` in a browser to see every screen rendered.

---

## 3. Baked-in Assumptions Moimoi Needs to Know

1. **Navigation is React Navigation, confirmed.**  
   `design.md §12` specifies React Navigation with `createBottomTabNavigator`.
   The existing `app-tabs.web.tsx` uses expo-router/ui — that component is the wrong
   library and the `.web.tsx` suffix makes it web-only anyway. It can be deleted or
   kept as a reference for layout intent only.

2. **`global.css` is stale and web-only — discard it.**  
   It imports Inter + Outfit (banned in the new design system) and defines the old
   CSS variable names. It has no effect on the native build. The new token system
   lives entirely in `tokens.ts`.

3. **Backend API base URL must be configured.**  
   The Next.js backend (`pennywise/`) runs on its own port. The mobile app calls it
   over HTTP. Add `EXPO_PUBLIC_API_URL` to a `.env` file in `mobile/` and read it
   via `process.env.EXPO_PUBLIC_API_URL`. There is currently no env handling in
   `mobile/` at all.

4. **Supabase — use a separate mobile client, not the backend one.**  
   `pennywise/lib/supabase/` uses a server-side service-role key. The mobile app
   needs its own client using the `anon` key with `AsyncStorage` as the auth adapter:
   ```ts
   import AsyncStorage from '@react-native-async-storage/async-storage';
   import { createClient } from '@supabase/supabase-js';
   export const supabase = createClient(url, anonKey, {
     auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true },
   });
   ```

5. **Currency: ₦ everywhere, JetBrains Mono, tabular figures.**  
   All money amounts use the `₦` symbol (never NGN, N, or $), comma thousands
   separator, JetBrains Mono with `fontVariant: ['tabular-nums']`. Build a
   `formatNaira(n: number): string` utility — `n.toLocaleString('en-NG')` — and
   use it for every displayed amount.

6. **The Discipline Score number is always amber `#d97706`.**  
   The ring fill changes colour by score range (teal ≥60 / amber 30–59 / danger <30).
   The number itself is always `Colors.amber` (`#d97706`). Non-negotiable, called out
   three times in `design.md`.

7. **Score ring uses react-native-svg + Reanimated 2.**  
   `<Circle>` with `strokeDasharray` and `strokeDashoffset`. Animate the offset with
   a Reanimated 2 shared value on mount (pulse keyframe: scale 1 → 1.035). The
   `<ScoreRing score={n} size={80} stroke={8} color={...} />` API is defined in
   `lib.jsx`.

8. **Expo SDK version — pin before installing.**  
   `mobile/package.json` has no `expo` version. Pin to SDK 53 before running
   `npm install` to avoid peer-dep conflicts between `react-native-reanimated`,
   `expo-notifications`, and other SDK-coupled packages.

9. **OCR is client-side Tesseract.js, not a backend API call.**  
   `design.md §12` specifies Tesseract.js via expo-modules or WebView bridge.
   The backend `/api/screenshot` route also exists — confirm with the backend dev
   which is canonical before building `OcrScreen` (screen 09) and `BatchOcrScreen`
   (screen 23).

10. **Doodles are SVG, never images or emoji.**  
    All scribble elements are `react-native-svg` paths. Opacity 30–50% for inline
    doodle components; opacity per the screen-type table for the background
    ScribbleLayer. See `design.md §6` for full rules and `Scribble_Layer.html`
    for the RN SVG export utility.
Please delete when done... ;)
---

## Fresh Dev Setup (updated)

```bash
cd mobile
cp .env.example .env.local   # fill in Supabase keys when available — app works without them
npm install --legacy-peer-deps
npx expo start --tunnel
```

Scan the QR with Expo Go (must be logged in to the same Expo account).
The `--legacy-peer-deps` flag is required — Expo's Google Fonts packages have loose peer dep declarations.
