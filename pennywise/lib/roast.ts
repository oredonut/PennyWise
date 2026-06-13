// ============================================================
// PennyWise — Roast Engine (zero-cost, zero-latency, no external APIs)
//
// A roast is assembled from three seeded slots — opener (grade-keyed),
// body (category-keyed), closer (grade-keyed) — then placeholders are
// substituted. Seeding off hash(userId + yearMonth) makes the roast
// deterministic per user per month: same input → same roast, so it
// never flip-flops on refresh. Pure, synchronous, side-effect-free.
// ============================================================

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F'

export type RoastInput = {
  userId: string // used for seeding — same user+month = same roast
  yearMonth: string // "2025-05"
  grade: Grade
  topCategory: string // 'food' | 'transport' | 'data' | 'leisure' | 'groceries' | 'rent' | 'misc'
  topMerchant: string | null
  topAmount: number // naira, integer
  totalSpent: number
  totalBudget: number
  month: string // "May"
  nextMonth: string // "June"
}

// ── Seeding helpers ───────────────────────────────────────────

/** Simple djb2 hash → positive (unsigned 32-bit) integer. */
function hash(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    // h * 33 + charCode, kept in unsigned 32-bit range each step.
    h = (h * 33 + s.charCodeAt(i)) >>> 0
  }
  return h
}

/** Deterministic pick: arr[(seed + offset) % arr.length]. */
function seededPick<T>(arr: T[], seed: number, offset: number): T {
  return arr[(seed + offset) % arr.length]
}

/** Format a naira amount as ₦X,XXX (no decimals). */
function formatAmount(n: number): string {
  const safe = Number.isFinite(n) ? Math.round(n) : 0
  return `₦${safe.toLocaleString('en-NG')}`
}

// ── Grade computation ─────────────────────────────────────────

export function gradeFromScore(avgScore: number): Grade {
  if (avgScore >= 85) return 'A'
  if (avgScore >= 70) return 'B'
  if (avgScore >= 55) return 'C'
  if (avgScore >= 40) return 'D'
  return 'F'
}

// ── Copy banks (Nigerian Pidgin) ──────────────────────────────
// Openers/closers are grade-keyed; bodies are category-keyed.
// Body/closer copy carries placeholders: {merchant} {amount} {month}
// {nextMonth} {topCategory}. {amount} is already formatted (₦X,XXX),
// so templates use a bare "{amount}", never "₦{amount}".

const OPENERS: Record<Grade, string[]> = {
  A: [
    "Omo, you actually did it.",
    "We dey look at your account and e dey smile back.",
    "Sharp sharp discipline — no be small thing.",
    "Your budget say thank you.",
    "E be like say something click for your head this month.",
    "You don prove say e possible. Respect.",
    "Financially, you dey do the most — the good kind.",
    "No cap, this one surprise us.",
  ],
  B: [
    "E dey go. Small small.",
    "You tried. No be perfect but you tried.",
    "Above average? For this economy? We see you.",
    "Your account still dey breathe. That's something.",
    "E dey go. We no go lie.",
    "Better than last month. That's the direction.",
    "You sabi wetin you dey do. Mostly.",
    "E be like the budget dey sink in.",
  ],
  C: [
    "We need to yarn about this.",
    "Omo. E dey go but e no dey go well.",
    "Your account dey manage. Just managing.",
    "Budget dey, discipline dey — but dem no dey talk.",
    "E be like say your money get legs.",
    "Abeg make we gist because this one needs work.",
    "You tried. The money no agree but you tried.",
    "We no go lie to you — this one wan pass.",
  ],
  D: [
    "Your wallet don vex.",
    "Omo this one pain small.",
    "E don do for the account side.",
    "Your money dey do Japa and e no tell you.",
    "The budget dey cry for this result.",
    "Wetin happen? No, seriously — wetin happen?",
    "Your account dey look at you somehow.",
    "We go need to debrief after this one.",
  ],
  F: [
    "Bro.",
    "Omo. E don do.",
    "The ancestors don see this result. Dem no happy.",
    "Your account say e need break.",
    "This one pass roasting — this one na intervention.",
    "Wallet empty, spirit strong — but wallet still empty.",
    "E be like say money and you get beef.",
    "We go need prayer after this month.",
  ],
}

const BODIES: Record<string, string[]> = {
  food: [
    "{merchant} don collect {amount} from you for {month} alone. Na food or na rent? Because e dey behave like rent.",
    "{amount} on food for {month} and your pot dey your kitchen dey do nothing. Abeg, the stove still dey work?",
    "You don chop {amount} for {month}. {merchant} know your face, your order, and probably your blood type by now.",
    "E be like say {merchant} get direct debit from your account. {amount} for {month} no be small.",
    "Food budget don enter another dimension — {amount} comot for {month}. Shawarma no be investment plan.",
    "{amount} on feeding for {month}. We no go lie, {merchant} dey chop better than you.",
    "Na so {amount} take waka go {merchant} for {month}. The food sweet but your balance no sweet.",
    "Your food spending for {month} reach {amount}. E be like say you dey cater event every week.",
  ],
  transport: [
    "{amount} on transport for {month} and {merchant} driver don save your contact as 'Good Customer'.",
    "Omo, {amount} on rides for {month}. Your legs still dey work o — just saying.",
    "E be like say {merchant} get your location pinned permanently. {amount} for {month} just on movement.",
    "{amount} take waka go different places for {month}. Some of these places, leg fit carry you — free of charge.",
    "Your transport bill for {month} reach {amount}. {merchant} dey treat you like family — expensive family.",
    "Na {amount} you take dey move about for {month}. Fine, but which of these trips needed {merchant}?",
    "{amount} on rides for {month}. E don reach time to make friends with danfo. Just once.",
    "You spend {amount} on transport for {month}. Your destination no dey shift — but your balance dey shift.",
  ],
  data: [
    "{amount} on data for {month} and you still dey complain say network bad. Na {merchant} take the money, not sense.",
    "E be like your phone dey eat — {amount} on data for {month} alone. Wetin you dey download exactly?",
    "{amount} waka enter {merchant} for {month}. The internet no remember this sacrifice but we do.",
    "Your data bill for {month} reach {amount}. WiFi dey everywhere — library, eatery, even church.",
    "{amount} on {merchant} for {month}. If data were garri you for don do soup.",
    "Na so {amount} take vanish on data for {month}. TikTok don collect again.",
    "You give {merchant} {amount} for {month}. E dey look like say you and data get serious relationship.",
    "{amount} on data for {month} and the results of this spending no clear. Wetin you see online wey worth this?",
  ],
  leisure: [
    "{amount} on enjoyment for {month} and e show. You dey enjoy but the account no dey enjoy with you.",
    "E be like say FOMO dey collect tax — {amount} for {month} on pure vibes.",
    "{amount} on leisure for {month}. {merchant} dey smile, your savings no dey smile.",
    "You don invest {amount} for {month} in the experience economy. The experience was good. The balance was not.",
    "Na {amount} you use catch cruise for {month}. Fun is valid — this quantity of fun needs review.",
    "{amount} for {month} on hangouts and enjoyment. The memories are priceless. The bill is not.",
    "Your leisure spending for {month} reach {amount}. {merchant} and the gang chop well this month.",
    "E be like say every weekend for {month} cost {amount}. Your account need weekend too — a rest weekend.",
  ],
  groceries: [
    "{amount} for groceries for {month}. {merchant} dey benefit well well from your kitchen ambitions.",
    "E be like say you dey feed estate — {amount} at {merchant} for {month}.",
    "Your grocery bill for {month} reach {amount}. Either you dey cook or {merchant} just love you.",
    "{amount} on groceries for {month}. We hope the pot dey touch fire o — not just the shopping cart.",
    "Na {amount} take waka go grocery for {month}. {merchant} know say you dey come.",
    "{amount} for {month} for market and shop. The intention was good. The quantity need talk.",
    "You spend {amount} on groceries for {month}. Omo this one feed armies.",
    "E be like {merchant} and your wallet get agreement. {amount} for {month} just on provisions.",
  ],
  rent: [
    "{amount} for accommodation for {month}. Na Nigeria — roof over head na priority. We respect it.",
    "Your rent for {month} collect {amount}. Landlord no dey play and you no dey play either.",
    "{amount} go housing for {month}. This one no be waste — na foundation. Everything else na the gist.",
    "E take {amount} to keep your space for {month}. That's non-negotiable. The rest of the budget is the question.",
    "{amount} on rent for {month}. You paid. That's discipline in itself. Now the other categories need that same energy.",
    "Na {amount} maintain roof for {month}. Sorted. Now wetin remain of the budget dey do wetin exactly?",
    "You settled {amount} for housing for {month}. Landlord happy. Account thin. Let's talk the rest.",
    "{amount} for shelter for {month}. Necessary. Respected. The question is what happened to everything else.",
  ],
  misc: [
    "{amount} land for 'others' category for {month} and we get questions. Big questions.",
    "Omo, {amount} go somewhere for {month} and even your account statement no sure exactly where.",
    "E be like {amount} just disappear for {month}. Misc category dey swallow money quietly.",
    "{amount} of mysterious spending for {month}. We no go judge but we go ask — wetin happen?",
    "Your misc spending for {month} reach {amount}. Something chop this money. We need name and location.",
    "Na {amount} enter the 'other' category for {month}. Categorise am next time — your future self go thank you.",
    "{amount} waka go uncategorised spending for {month}. E no go lost — e just no get name yet.",
    "Somewhere for {month}, {amount} go places wey we no fit track. The category name is 'misc'. The real name is mystery.",
  ],
}

const CLOSERS: Record<Grade, string[]> = {
  A: [
    "Do the same thing for {nextMonth} and you don graduate to financial role model.",
    "{nextMonth}, show dem say {month} was no fluke.",
    "This is what winning looks like. Carry the energy go {nextMonth}.",
    "Your account dey glow. Keep am for {nextMonth}.",
    "Sharp. Now go tell your friends how it's done before {nextMonth}.",
    "E be like discipline don become habit. Don't waste it.",
    "One more month like this and the roast page go dey empty. In the best way.",
    "You no need us to tell you wetin to do for {nextMonth}. You already know.",
  ],
  B: [
    "Close the gap for {nextMonth} — Grade A dey wait for you.",
    "One category adjustment and {nextMonth} go be different.",
    "E dey go. Push small for {nextMonth} and the A dey there.",
    "You dey 70% of the way. Find the remaining 30% before {nextMonth}.",
    "Fix {topCategory} for {nextMonth} and watch the grade shift.",
    "Almost. {nextMonth} na your month if you press small.",
    "The trajectory good. Don't change what's working — just tighten the loose part.",
    "Grade A no far. You fit see am from here.",
  ],
  C: [
    "Pick one thing to fix before {nextMonth} start. Just one.",
    "Cut {topCategory} by 20% for {nextMonth} and the grade go shift.",
    "E dey manageable. {nextMonth} get fresh budget — use am well.",
    "The score no bad enough to panic but e bad enough to act.",
    "Decide before {nextMonth}: which category go behave? Start there.",
    "Small adjustment for {nextMonth} go carry you comfortably to Grade B.",
    "You dey middle ground — push up, not down. {nextMonth} na the opportunity.",
    "Budget dey. Discipline just need to visit more often. Invite am for {nextMonth}.",
  ],
  D: [
    "Reset the mindset before {nextMonth} land. One category at a time.",
    "Pick your worst category and make am your mission for {nextMonth}.",
    "E dey recoverable. {nextMonth} fresh page — don't carry this month energy go there.",
    "The budget exist for reason. Consult am before you spend for {nextMonth}.",
    "One good week for {nextMonth} go shift everything. Just start.",
    "Forget this month — bury am. {nextMonth} is a new contract.",
    "The score go up when the spending go down. Simple. Try am for {nextMonth}.",
    "Your phone get calculator. Use am before you tap your card for {nextMonth}.",
  ],
  F: [
    "{nextMonth} dey come. Fresh start. No debt to last month.",
    "Oya. New month. New budget. New you. No excuse.",
    "E don happen. The question is wetin you go do before {nextMonth} end.",
    "Start small for {nextMonth}. Track one day. Then two. Build from there.",
    "Nothing lost except the money — and that one fit come back. {nextMonth} start over.",
    "The comeback story start with {nextMonth}. This month na the motivation.",
    "Reset. Breathe. Open the app on the first of {nextMonth} and start again.",
    "Even the worst month end. {nextMonth} dey your hands.",
  ],
}

const FALLBACK_MESSAGE =
  "We crunched the spending and there's room to grow. New month, fresh start — make the next one count."

function isGrade(value: unknown): value is Grade {
  return value === 'A' || value === 'B' || value === 'C' || value === 'D' || value === 'F'
}

// ── Public API ────────────────────────────────────────────────

/**
 * Build a deterministic roast from spending data. Never throws — any
 * unexpected error returns a safe, generic fallback roast.
 */
export function generateRoast(input: RoastInput): { grade: Grade; message: string } {
  try {
    const seed = hash(input.userId + input.yearMonth)
    const grade = input.grade
    // Unknown categories degrade gracefully to the 'misc' bucket.
    const categoryKey = BODIES[input.topCategory] ? input.topCategory : 'misc'

    const opener = seededPick(OPENERS[grade], seed, 0)
    const body = seededPick(BODIES[categoryKey], seed, 1)
    const closer = seededPick(CLOSERS[grade], seed, 2)

    // {merchant} falls back to the category name when no merchant is known.
    const merchant = input.topMerchant ?? input.topCategory

    const replacements: Record<string, string> = {
      '{merchant}': merchant,
      '{amount}': formatAmount(input.topAmount),
      '{month}': input.month,
      '{nextMonth}': input.nextMonth,
      '{topCategory}': input.topCategory,
    }

    let message = `${opener} ${body} ${closer}`
    for (const [token, value] of Object.entries(replacements)) {
      message = message.replaceAll(token, value)
    }

    return { grade, message }
  } catch {
    const grade = isGrade(input?.grade) ? input.grade : 'C'
    return { grade, message: FALLBACK_MESSAGE }
  }
}
