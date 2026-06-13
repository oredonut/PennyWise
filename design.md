# PennyWise — Design System Reference

> Generated from the actual prototype source files (`styles.css`, `lib.jsx`, `screens-*.jsx`).  
> This is the authoritative handoff spec. When in doubt, open `PennyWise.html` in a browser — it is the ground truth.

---

## 1. Design Philosophy

Warm, human, Nigerian. The visual identity rejects cold fintech defaults (Inter, slate greys, blue gradients) in favour of a cream/teal/amber palette that feels approachable and lived-in. Hand-drawn doodle marks scattered across every screen reinforce that this app is made by people, for people — not a bank.

**Three rules that must never be broken:**
1. The Discipline Score number is **always amber** (`var(--amber)` / `#d97706`). No exceptions.
2. Teal is a precision accent — it means "action" or "on track". Not decoration.
3. Doodles stay in the gutters and header/footer bands. The content zone is always clean.

---

## 2. Color Tokens

### Light Mode (default)

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#faf7f2` | Screen background |
| `--surface` | `#ffffff` | Cards, inputs, nav bar |
| `--surface-tint` | `#f3ede4` | Subtle fills, skeleton loaders, inactive chips |
| `--border` | `#e2d9ce` | All borders and dividers |
| `--text-1` | `#1a1714` | Primary text |
| `--text-2` | `#6b6157` | Secondary / supporting text |
| `--text-3` | `#a89e95` | Tertiary / placeholders / labels |
| `--teal` | `#0f766e` | Primary action, active states, brand accent |
| `--teal-light` | `#ccfbf1` | Teal backgrounds (chips, pill, input focus bg) |
| `--amber` | `#d97706` | **Discipline Score number exclusively. Also warnings.** |
| `--amber-light` | `#fef3c7` | Amber backgrounds (warning banners, score cards) |
| `--danger` | `#dc2626` | Over-budget, errors, destructive actions |
| `--danger-light` | `#fee2e2` | Danger backgrounds |
| `--success` | `#16a34a` | Positive deltas, income, under-budget |
| `--success-light` | `#dcfce7` | Success backgrounds |
| `--violet` | `#a78bfa` | Category colour (non-semantic, chart only) |
| `--coral` | `#f87171` | Category colour (non-semantic, chart only) |
| `--doodle` | `#c9bfb5` | All scribble/doodle strokes in light mode |

### Dark Mode

Dark mode is a **pure token swap** scoped to `.pw-screen` inside `body.dark`. Teal, amber, danger, and success hues are **unchanged** — only the neutral surface and text tokens swap.

| Token | Dark Value | Notes |
|---|---|---|
| `--bg` | `#0f0e0c` | Near-black, warm undertone |
| `--surface` | `#1c1a17` | Card/input surface |
| `--surface-tint` | `#252219` | Slightly lighter than surface |
| `--border` | `#302c26` | Warm dark border |
| `--text-1` | `#f5ede4` | Near-white with warm cast |
| `--text-2` | `#9e9086` | |
| `--text-3` | `#5c5249` | |
| `--teal-light` | `#0d3330` | Deep teal bg |
| `--amber-light` | `#2a1f0a` | Deep amber bg |
| `--danger-light` | `#2a0f0f` | Deep danger bg |
| `--success-light` | `#0a2a14` | Deep success bg |
| `--doodle` | `#3d3730` | Darker stroke for doodles |
| `--shadow-card` | `0 2px 12px rgba(0,0,0,0.4)` | |
| `--shadow-float` | `0 8px 32px rgba(0,0,0,0.6)` | |

**Dark mode special rules:**
- `.medal-num` and `.score-num` get a soft amber glow: `text-shadow: 0 0 40px rgba(217,119,6,0.32)`
- SVG `path[fill="#fff"]` and `rect[fill="#fff"]` within `.pw-screen` automatically pick up `var(--surface)`
- ScribbleLayer opacity drops from `0.06` → `0.04`
- Sheet dim backdrop deepens from `rgba(26,23,20,0.4)` → `rgba(0,0,0,0.65)`

---

## 3. Typography

### Fonts

| Role | Font | Fallback | Source |
|---|---|---|---|
| Display / headings / labels | **Bricolage Grotesque** | Cabinet Grotesk, sans-serif | Google Fonts |
| Body / paragraphs / inputs | **Plus Jakarta Sans** | sans-serif | Google Fonts |
| Monospace / numbers / amounts | **JetBrains Mono** | monospace | Google Fonts |

```
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Plus+Jakarta+Sans:ital,wght@0,400..700;1,400..600&family=JetBrains+Mono:wght@400..700&display=swap');
```

### Type Scale

| Class | Font | Weight | Size | Tracking | Usage |
|---|---|---|---|---|---|
| `.h1` | Bricolage Grotesque | 800 | 28px | -0.02em | Screen titles |
| `.h2` | Bricolage Grotesque | 700 | 22px | -0.01em | Section headings |
| `.h3` | Bricolage Grotesque | 700 | 17px | — | Card titles, subsections |
| `.eyebrow` | Bricolage Grotesque | 700 | 11px | +0.14em | Uppercase labels, step indicators |
| Body (default) | Plus Jakarta Sans | 400 | 15px | — | All running text |
| `.t2` | — | — | — | — | `color: var(--text-2)` modifier |
| `.t3` | — | — | — | — | `color: var(--text-3)` modifier |
| `.d` | Bricolage Grotesque | — | — | — | Switch any element to display font |
| `.mono` | JetBrains Mono | — | — | `font-feature-settings: "tnum"` | Amounts, scores, numeric data |

**Critical rule:** Naira amounts (`₦`) always use `.mono` class with tabular numbers. The score number always uses Bricolage Grotesque 900 weight in amber.

---

## 4. Spacing & Layout

### Screen Dimensions
- **Canvas:** 390 × 844px (iPhone 14 Pro viewport, no bezel)
- **Border radius:** `border-radius: 34px` on the outer screen shell
- **Content padding:** `padding: 0 20px` via `.pw-pad`
- **Status bar height:** 44px
- **Bottom nav height:** 84px
- **FAB offset:** `margin-top: -20px` (lifts above nav)

### Border Radius Scale

| Token | Value | Usage |
|---|---|---|
| `--r-sm` | `8px` | Small elements, tags |
| `--r-md` | `14px` | Inputs, small cards |
| `--r-lg` | `20px` | Medium cards, panels |
| `--r-xl` | `28px` | Large cards (`.card` default) |
| `--r-pill` | `999px` | Buttons, pills, chips, toggles |

### Shadows

| Token | Value | Usage |
|---|---|---|
| `--shadow-card` | `0 2px 12px rgba(26,23,20,0.07)` | Cards, surfaces |
| `--shadow-float` | `0 8px 32px rgba(26,23,20,0.13)` | FAB, floating sheets |

---

## 5. Component Library

All components are defined as CSS utility classes in `styles.css`. In React Native, reproduce the same visual spec using StyleSheet — do not port the CSS classes directly.

### Cards
```css
.card {
  background: var(--surface);
  border-radius: var(--r-xl);    /* 28px */
  box-shadow: var(--shadow-card);
}
```

### Buttons

| Class | Spec |
|---|---|
| `.btn` | Base: height 52px, pill radius, Bricolage Grotesque 700 16px, full width, flex center |
| `.btn-teal` | `background: var(--teal)`, white text, teal shadow. Hover: lift 1px. Active: scale 0.97 |
| `.btn-outline` | `background: var(--surface)`, `border: 1.5px solid var(--border)`. Hover: lift + card shadow |
| `.btn-danger-o` | Transparent bg, `border: 1.5px solid var(--danger)`, danger text, height 48px |
| `.btn:disabled` | `opacity: 0.45`, no hover effects |

### Inputs
- Height: 52px, border-radius: `var(--r-md)` (14px)
- Default border: `1.5px solid var(--border)`
- Focus: `border-color: var(--teal)`, `background: rgba(204,251,241,0.18)`, `box-shadow: 0 0 0 3px rgba(15,118,110,0.12)`
- Placeholder: `var(--text-3)`
- Textarea variant: `height: auto`, `padding: 12px 16px`

### Pills & Chips

| Class | Spec |
|---|---|
| `.pill` | Height 30px, pill radius, `background: var(--surface-tint)`, Bricolage Grotesque 600 12px |
| `.pill-teal` | `background: var(--teal-light)`, `color: var(--teal)` |
| `.pill-amber` | `background: var(--amber-light)`, `color: var(--amber)` |
| `.chip` | Height 38px, pill radius, `background: var(--surface-tint)`, Plus Jakarta Sans 500 14px |
| `.chip.on` | `background: var(--teal-light)`, `border-color: var(--teal)`, `color: var(--teal)`, weight 600 |

### Toggle
- Dimensions: 46 × 28px, pill radius
- Off: `background: var(--border)`, knob at left
- On (`.toggle.on`): `background: var(--teal)`, knob translates 18px right
- Knob: 22 × 22px circle, white with subtle shadow

### Progress Bars
```
.bar        — height 8px, pill radius, background: var(--surface-tint)
.bar > span — the fill: block, full height, pill radius, color set inline
```
Colour conventions for bar fills:
- On track: `var(--teal)`
- Near limit (>75%): `var(--amber)` or `var(--danger)`
- Over budget: `var(--danger)`

### Bottom Navigation
- Height: 84px, white surface, 1px top border
- 5 items: Home · Transactions · [FAB] · Goals · Profile
- Icon size: 22px, label: Bricolage Grotesque 700 10px
- Active: `color: var(--teal)` + 4px teal dot below label
- Inactive: `color: var(--text-3)`
- FAB: 56 × 56px teal circle, lifts 20px above nav, `box-shadow: var(--shadow-float)`

### Range Slider (`.pw-range`)
- Track height: 8px, pill radius, `var(--surface-tint)` background
- Thumb: 22px circle, teal fill, 3px white border, subtle shadow
- Over-budget state: `accentColor` switches to `var(--danger)`

---

## 6. Doodle / Scribble System

This is PennyWise's most distinctive visual element. Every screen has a `<ScribbleLayer/>` sitting behind all content at `z-index: 0`. Content sits at `z-index: 1`.

### Scribble Symbols (8 types)

All symbols are SVG paths drawn on a 24×24 grid. All share: stroke only (no fill), `stroke-linecap: round`, `stroke-linejoin: round`.

| Name | Path |
|---|---|
| `asterisk` | `M12 2v20 M2 12h20 M5 5l14 14 M19 5L5 19` |
| `circle` | `M12 4 C 20 4, 22 9, 21 13 C 20 18, 16 21, 12 21 C 8 21, 3.5 18, 3 13 C 2.5 8, 4 4, 12 4 Z` |
| `wave` | `M2 12 C 7 6, 9 18, 14 12 C 19 6, 21 18, 26 12` |
| `arrow` | `M4 12 C 8 12, 14 8, 20 12 M16 8l4 4-4 4` |
| `bracket` | `M10 5 C 8 5, 7 6, 7 8 L7 16 C 7 18, 8 19, 10 19` |
| `star` | `M12 3l2 6h6l-5 4 2 6-5-3.5L7 19l2-6-5-4h6z` |
| `spiral` | `M12 12 C 12.6 10.8, 14.4 10.9, 14.8 12.4 C 15.4 14.6, 13.2 16.2, 10.9 15.6 C 7.8 14.8, 7.2 11, 9.2 8.6 C 11.8 5.5, 16.6 5.4, 19.4 8.4` |
| `dash` | `M5.5 8 L10.5 10 M13.5 14 L18.5 16` |

### Symbol Render Sizes

| Symbol | Size (px) |
|---|---|
| asterisk | 22 |
| circle | 17 |
| wave | 52 |
| arrow | 19 |
| bracket | 13 |
| star | 11 |
| spiral | 13 |
| dash | 18 |

### Placement Law

The scribble layer renders on a 390×844 viewport. Symbols are placed using a fixed coordinate list — **not random**, not tiled.

**Zones:**
- Dense placement: top band (0–80px), bottom band (780–844px), left gutter (0–24px), right gutter (366–390px)
- **Strictly empty:** center zone y:120–720 between x:50–340. All cards live here.

**Full placement coordinates** `[type, x, y, rotation]`:
```
["asterisk",36,22,-14], ["dash",188,16,9],    ["wave",300,30,-6],  ["circle",356,18,18],
["star",128,54,22],     ["spiral",248,62,-20],
["arrow",12,168,-24],   ["circle",8,300,12],  ["bracket",14,452,-8], ["wave",6,600,16],
["dash",16,726,-18],
["star",378,214,10],    ["spiral",372,372,-16], ["circle",382,532,20], ["asterisk",374,678,-10],
["arrow",60,806,14],    ["wave",176,822,-8],   ["bracket",292,800,24], ["dash",352,820,-12],
```

### Opacity by Screen Type

| Screen Type | Opacity (light) | Opacity (dark) |
|---|---|---|
| Splash / Report screens | 10% | 8% |
| Dashboard / Home | 7% | ~5% |
| Form screens (Sign Up, Budget Edit) | 5%, top 80px strip only | — |
| Bottom sheets / Modals | **None** — clean overlay surface | — |

CSS: `.scribble-layer { opacity: 0.06; }` / `body.dark .scribble-layer { opacity: 0.04; }`

### Stroke Rules

- Light mode: `stroke: var(--doodle)` → `#c9bfb5`
- Dark mode: `stroke: var(--doodle)` → `#3d3730`
- Stroke width: `1.5px` uniformly
- Never filled

### Inline Doodle Components (from `lib.jsx`)

These are React components used as decorative accents on specific screens — distinct from the background ScribbleLayer.

| Component | Description | Props |
|---|---|---|
| `<DoodleRect>` | Wobbly rounded-rect border filling its parent | `stroke`, `w` |
| `<DoodleDashedRect>` | Same but dashed — upload zones, empty cards | `stroke`, `w` |
| `<DoodleCircle>` | Wobbly circle — avatars, score elements | `stroke`, `w`, `style` |
| `<DoodleUnderline>` | Squiggle underline below section headings | `color`, `width`, `style` |
| `<DoodleStar>` | 4-point star sparkle | `color`, `size`, `style` |
| `<DoodleArrow>` | Curved pointing arrow | `color`, `width`, `style` |
| `<DoodleSparkles>` | Small cross + circle cluster | `color`, `style` |

---

## 7. Shared Primitive Components

Defined in `lib.jsx`, exported to `window` for cross-file access. In React Native, these become real RN components.

### `<Screen>`
The root wrapper for every screen. Renders: device shell → ScribbleLayer (z:0) → StatusBar → scrollable body → optional BottomNav.

```jsx
<Screen
  nav="home"       // "home" | "txns" | "goals" | "profile" | undefined
  scroll={true}    // wraps children in .pw-body scrollable div
  scribble={true}  // show/hide ScribbleLayer
  onFab={fn}       // FAB press handler
  fabOpen={bool}   // FAB open state (rotates icon 45°)
  bg={string}      // override background color
/>
```

### `<StatusBar>`
Fixed top bar: time "9:41" left, dynamic island notch center, signal/wifi/battery indicators right.

### `<BottomNav>`
5-slot bottom nav with centre FAB. Active slot uses teal with dot indicator.

```jsx
<BottomNav active="home" onFab={fn} fabOpen={false} />
```

### `<Icon>`
Stroke-only icon set. All icons on a 24×24 grid, `strokeLinecap: round`, `strokeLinejoin: round`.

```jsx
<Icon name="home" size={24} color="currentColor" w={1.8} fill={false} />
```

**Available icon names:** `back`, `bell`, `home`, `txns`, `chart`, `goals`, `user`, `plus`, `eye`, `eyeoff`, `chevron`, `chevd`, `finger`, `camera`, `bolt`, `check`, `trash`, `edit`, `clock`, `lock`, `star`, `shield`, `card`, `bag`

### `<SubHeader>`
Back arrow + title row for drill-down screens.
```jsx
<SubHeader title="Edit Budget" right={<SomeAction/>} />
```

### `<ScoreRing>`
Circular SVG progress ring with score number centred. Score in amber, "SCORE" label in text-3.
```jsx
<ScoreRing score={73} size={80} stroke={8} color="var(--teal)" />
```

Score colour conventions:
- `≥ 60` (On track): `var(--teal)`
- `30–59` (Needs work): `var(--amber)`
- `< 30` (Broke): `var(--danger)`

### `<DoodleMedal>`
Hand-drawn medal with ribbon, used for end-of-month grade display.
```jsx
<DoodleMedal size={120} grade="B" num={73} color="var(--amber)" />
```

### `<DoodleFlame>` / `<DoodleBrokenFlame>`
Animated streak flame. `on={true}` = active streak (amber fill, teal stroke). `<DoodleBrokenFlame>` for broken streaks (greyed, split in two).

### `<Logomark>`
Inline brand mark: geometric ₦ in a doodle rounded square, teal stroke.
```jsx
<Logomark size={72} />
```

### `<Confetti>`
Doodle confetti burst — stroke-only shapes (squares, circles, lines, stars) in teal + amber.

### `<ScoreBars>`
Vertical list of labelled progress bars with optional month-over-month delta.
```jsx
<ScoreBars comps={[["Food", "₦12,400", 88, "var(--danger)", "₦2,100", false]]} />
// [label, value, pct, color, delta?, deltaUp?]
```

### `<Donut>` (in `screens-insights.jsx`)
Segmented donut chart for category breakdown. Takes `segs` array and `total` label.

**Category colours for the donut:**

| Category | Colour |
|---|---|
| Food | `#f97316` |
| Groceries | `#22c55e` |
| Transport | `#3b82f6` |
| Hangout | `#db2777` |
| Others | `#9ca3af` |
| Data | `#a78bfa` |

### `<LineChart>` (in `screens-insights.jsx`)
7-day score trend. Teal area fill + teal line. Latest point marker in amber.

---

## 8. Screen Inventory (25 Screens)

### Section 1 — Onboarding & Auth
| # | Screen | Component |
|---|---|---|
| 01 | Splash | `SplashScreen` |
| 02 | Onboarding | `OnboardingScreen` |
| 03 | Sign Up | `SignupScreen` |
| 04 | Login | `LoginScreen` |
| 05 | OTP Verification | `OtpScreen` |
| 06 | Profile Setup | `ProfileSetupScreen` |

### Section 2 — Core App
| # | Screen | Component |
|---|---|---|
| 07 | Dashboard | `DashboardScreen` |
| 08 | Add Transaction | `AddTransactionScreen` |
| 09 | Snap Receipt (OCR) | `OcrScreen` |
| 10 | Transaction Detail | `TxnDetailScreen` |

### Section 3 — Insights, Goals & System
| # | Screen | Component |
|---|---|---|
| 11 | Insights | `InsightsScreen` |
| 12 | Discipline Score Detail | `ScoreDetailScreen` |
| 13 | Goals | `GoalsScreen` |
| 14 | Profile & Settings | `ProfileScreen` |
| 15 | Empty States | `EmptyStatesScreen` |

### Section 4 — Roasts, Streaks & Celebrations
| # | Screen | Component |
|---|---|---|
| 16 | Roast Feed | `RoastFeedScreen` |
| 17 | End-of-Month Report | `EomReportScreen` |
| 18 | Streak + Break | `StreakScreen` |
| 19 | Score History | `ScoreHistoryScreen` |
| 20 | Milestone Celebration | `MilestoneScreen` |

### Section 5 — Budget Management & System
| # | Screen | Component |
|---|---|---|
| 21 | Budget Edit | `BudgetEditScreen` |
| 22 | New Month Reset | `NewMonthScreen` |
| 23 | Batch OCR Review | `BatchOcrScreen` |
| 24 | Share Card Generator | `ShareCardScreen` |
| 25 | Notification Preferences | `NotifPrefsScreen` |

---

## 9. Animations & Motion

All defined as CSS keyframes in `styles.css`.

| Name | Class / Keyframe | Spec | Usage |
|---|---|---|---|
| Entrance | `@keyframes pw-up` | `opacity: 0, translateY(16px)` → `opacity: 1, translateY(0)` | Screen section transitions |
| Shimmer | `@keyframes pw-shimmer` | 200px gradient sweep, 1.3s linear infinite | Skeleton loading states |
| Shake | `@keyframes pw-shake` | ±6px horizontal, 0.32s | Wrong OTP code, form errors |
| Indeterminate progress | `.indet` | 40% teal bar sweeps across track, 1.1s | Loading operations |
| Pulse | `@keyframes pw-pulse` | scale 1 → 1.035, 1s | Score ring on load |
| Confetti fall | `@keyframes pw-fall` | translateY(520px) + rotate(360deg), opacity 0, 1.5s | Milestone / goal achieved |

---

## 10. Logo

**Direction: Geometric ₦ Wordmark**

- Mark: `<Logomark>` component — teal `<DoodleRect>` border wrapping a large ₦ in Bricolage Grotesque 800
- Wordmark: "Penny" in `var(--text-1)`, "Wise" in `var(--teal)`, Plus Jakarta Sans 800, letter-spacing -0.3px
- App icon: ₦ mark inside a partial teal ring (score ring motif), amber dot upper-right, on `#f7f6f2` rounded square background

**Rejected and permanently closed directions:** owl mascot, P-letter monogram, leaf+coin, clown-adjacent, generic teal gradient.

---

## 11. Nigerian Context & Copy Conventions

These are product features, not style notes.

- **Currency:** Always `₦` (Naira). Never `NGN`, never `N`. Use `.mono` class for all amounts.
- **Amount formatting:** `₦12,400` — comma thousands separator, no decimal unless needed. In RN: `n.toLocaleString("en-NG")`.
- **Merchant names:** Use real Nigerian merchants in sample data: Chicken Republic, Shoprite Ikeja, PalmPay, Bolt, Opay, Airtel, MTN, Kuda.
- **Copy tone:** Direct, slightly roast-y, never condescending. Examples in the design: *"Food is not a category, it's a lifestyle."* / *"You're 2 shawarmas away from Food bankruptcy."* / *"Either Bolt got expensive or you found your legs."*
- **Score labels:** `Financially responsible` (≥60) · `Needs work` (30–59) · `Broke` (<30)
- **Observations:** Lead with the specific merchant + amount, then the implication. Emoji leads each observation card.

---

## 12. React Native Implementation Notes

### Stack
```
React Native + Expo
Styling:       React Native StyleSheet (not Tailwind, not CSS classes)
Navigation:    React Navigation — bottom tabs
Bottom sheets: react-native-bottom-sheet
Animations:    Reanimated 2 (score counter, bar fill, ring animation)
Notifications: expo-notifications
OCR:           Tesseract.js via expo-modules or WebView bridge
Fonts:         expo-google-fonts (Bricolage Grotesque, Plus Jakarta Sans, JetBrains Mono)
```

All CSS token properties map directly to a `tokens.ts` file. Use the exact same hex values.

```ts
// tokens.ts
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

export const Radius = {
  sm: 8, md: 14, lg: 20, xl: 28, pill: 999,
} as const;
```

### ScribbleLayer in React Native
Use `react-native-svg`. Render as `<Svg>` with `<Defs>` + `<Symbol>` blocks, then `<Use>` for each placement. Position absolute, `pointerEvents="none"`, same 390×844 viewBox.

Swap stroke colour via the dark mode token: `#c9bfb5` (light) → `#3d3730` (dark).

### Score Ring
Use `react-native-svg` `<Circle>` with `strokeDasharray` and `strokeDashoffset`. Animate with Reanimated 2 shared values on mount.

### Fonts
```bash
npx expo install @expo-google-fonts/bricolage-grotesque @expo-google-fonts/plus-jakarta-sans @expo-google-fonts/jetbrains-mono
```

### Bottom Nav + FAB
Use React Navigation `createBottomTabNavigator`. Custom `tabBar` render prop to implement the lifted FAB at centre position.

---

## 13. File Reference

| File | Contents |
|---|---|
| `styles.css` | All CSS tokens, component classes, dark mode overrides, animations |
| `lib.jsx` | ScribbleLayer, all doodle components, Icon set, Screen, StatusBar, BottomNav, Logomark, DoodleMedal, DoodleFlame, Confetti, ScoreBars, SubHeader |
| `screens-auth.jsx` | Screens 01–06 (Splash through Profile Setup) |
| `screens-home.jsx` | Screens 07–10 (Dashboard through Transaction Detail) |
| `screens-insights.jsx` | Screens 11–15 (Insights through Empty States) |
| `screens-roast.jsx` | Screens 16–20 (Roast Feed through Milestone) |
| `screens-budget.jsx` | Screens 21–25 (Budget Edit through Notification Prefs) |
| `design-canvas.jsx` | DesignCanvas, DCSection, DCArtboard — prototype chrome only, not for production |
| `PennyWise.html` | Full interactive prototype — open in browser to inspect any screen |
| `Scribble_Layer.html` | Standalone scribble layer reference + React Native SVG export utility |
