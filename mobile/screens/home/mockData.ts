// ============================================================
// PennyWise — Home Screen Data Types & Mock Data
//
// TODO (backend): Replace MOCK_HOME_DATA with a real API call.
// Suggested endpoint: GET /api/v1/dashboard
// Auth header:        Authorization: Bearer <supabase_access_token>
// Expected shape:     HomeData (see below)
//
// Swap pattern in HomeScreen.tsx:
//   const [data, setData] = useState<HomeData>(MOCK_HOME_DATA);
//   useEffect(() => { fetchDashboard().then(setData); }, []);
// ============================================================

// ── Data types ───────────────────────────────────────────────

export interface WeeklySpendDay {
  /** Single-letter abbreviation shown under each bar */
  day: string;
  /** Naira amount spent that day */
  amount: number;
  /** Whether this is today's bar — rendered in solid teal */
  isToday: boolean;
}

export type CategoryStatus = 'on_track' | 'near_limit' | 'over_budget';

export interface CategoryBudget {
  id: string;
  emoji: string;
  name: string;
  spent: number;
  budget: number;
  /**
   * Computed server-side or locally from spent/budget.
   * on_track    → progress bar teal,  label "On track"
   * near_limit  → progress bar red,   label "Near limit"
   * over_budget → progress bar red,   label "Over budget"
   */
  status: CategoryStatus;
}

export interface BudgetAlert {
  /** Plain-text portion of the alert */
  message: string;
  /** ₦ amount highlight — MUST be rendered in JetBrains Mono */
  amountLine: string;
}

export interface HomeData {
  user: {
    firstName: string;
    /** Days on current streak — shown in the header pill */
    streakDays: number;
  };
  disciplineScore: {
    /**
     * 0–100 score.
     * AMBER RULE: the score number is rendered in #d97706 ONLY here.
     */
    score: number;
    /**
     * brokeScore = 100 - score (also rendered in amber, see amber rule).
     */
    brokeScore: number;
    /** e.g. "Financially responsible" | "Needs work" | "Broke mode" */
    badge: string;
  };
  budget: {
    /** Display label e.g. "May Budget" */
    monthLabel: string;
    /** Total monthly budget in Naira */
    total: number;
    /** Amount spent so far */
    spent: number;
    /** Amount remaining (total - spent) */
    left: number;
    /** One entry per day in the current week */
    weeklySpend: WeeklySpendDay[];
  };
  /** Null when there are no active alerts */
  alert: BudgetAlert | null;
  categories: CategoryBudget[];
}

// ── Mock data — delete and replace with real API call ────────
export const MOCK_HOME_DATA: HomeData = {
  user: {
    firstName: 'Tunde',
    streakDays: 12,
  },
  disciplineScore: {
    score: 73,
    brokeScore: 27,
    badge: 'Financially responsible',
  },
  budget: {
    monthLabel: 'May Budget',
    total:  25_000,
    spent:  14_248,
    left:   10_752,
    weeklySpend: [
      { day: 'M', amount:  1_200, isToday: false },
      { day: 'T', amount:  3_400, isToday: false },
      { day: 'W', amount:    800, isToday: false },
      { day: 'T', amount:  2_600, isToday: false },
      { day: 'F', amount:  1_800, isToday: false },
      { day: 'S', amount:  2_200, isToday: false },
      { day: 'S', amount:  4_248, isToday: true  },
    ],
  },
  alert: {
    message:    "You're 2 shawarmas away from Food bankruptcy.",
    amountLine: '₦1,600 left in food.',
  },
  categories: [
    { id: 'food',      emoji: '🍔', name: 'Food',      spent: 12_400, budget: 14_000, status: 'near_limit' },
    { id: 'transport', emoji: '🚗', name: 'Transport', spent:  3_200, budget:  8_000, status: 'on_track'   },
    { id: 'data',      emoji: '📱', name: 'Data',      spent:  1_500, budget:  3_000, status: 'on_track'   },
  ],
};
