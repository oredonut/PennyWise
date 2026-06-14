// ============================================================
// API contract types — the response shapes returned by the
// PennyWise backend (see mobile/API_CONTRACT.md). Self-contained:
// these are the single source of truth for both the API layer and
// the screens (the old mockData.ts has been removed).
// ============================================================

export type CategoryStatus = 'on_track' | 'near_limit' | 'over_budget';
export type TransactionType = 'expense' | 'income';

// ── Dashboard (GET /api/home/dashboard, §2) ──────────────────
export interface WeeklySpendDay {
  day: string;
  amount: number;
  isToday: boolean;
}

export interface CategoryBudget {
  id: string;
  emoji: string;
  name: string;
  spent: number;
  budget: number;
  status: CategoryStatus;
}

export interface BudgetAlert {
  message: string;
  amountLine: string;
}

export interface RecentTransaction {
  id: string;
  name: string;
  timeLabel: string;
  categoryName: string;
  amount: number;
  type: TransactionType;
  emoji: string;
}

export interface HomeData {
  user: { firstName: string; streakDays: number };
  disciplineScore: { score: number; brokeScore: number; badge: string };
  budget: {
    monthLabel: string;
    total: number;
    spent: number;
    left: number;
    weeklySpend: WeeklySpendDay[];
  };
  alert: BudgetAlert | null;
  categories: CategoryBudget[];
  recentTransactions: RecentTransaction[];
  // The dashboard endpoint omits insights (it has its own endpoint, §3).
  insights?: InsightsData;
}

// ── Insights (GET /api/insights?range, §3) ───────────────────
export interface ScoreTrendPoint {
  label: string;
  score: number;
}

export interface CategoryBreakdownItem {
  id: string;
  name: string;
  percentage: number;
  amount: number;
  color: string;
}

export interface ObservationItem {
  id: string;
  emoji: string;
  text: string;
}

export interface InsightsComparison {
  lastMonthName: string;
  lastMonthSpent: number;
  currentMonthName: string;
  currentMonthSpent: number;
  difference: number;
  percentage: number;
  isSavings: boolean;
}

export interface InsightsRoast {
  grade: string;
  month: string;
  message: string;
}

export interface InsightsData {
  monthYear: string;
  weekLabel: string;
  totalSpent: number;
  scoreTrend7d: ScoreTrendPoint[];
  scoreTrend30d: ScoreTrendPoint[];
  breakdown: CategoryBreakdownItem[];
  observations: ObservationItem[];
  comparison: InsightsComparison;
  roast: InsightsRoast | null;
}

// ── Profile (§4) ─────────────────────────────────────────────
export interface ProfileData {
  name: string;
  university: string | null;
  grade: string;
  gradeLabel: string;
  memberSince: string;
}

export interface Streaks {
  currentStreak: number;
  longestStreak: number;
}

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  status: 'Unlocked' | 'Locked';
  desc: string;
}

// ── Transactions history (§6) ────────────────────────────────
export interface Transaction {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  categoryName: string;
  emoji: string;
  occurredAt: string;
  timeLabel: string;
}

export interface TransactionsPage {
  transactions: Transaction[];
  nextCursor: string | null;
  hasMore: boolean;
}
