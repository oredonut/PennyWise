// ============================================================
// API contract types — the response shapes returned by the
// PennyWise backend (see mobile/API_CONTRACT.md). The shared
// dashboard/insights shapes are re-exported from mockData so the
// mock and the live API stay on one definition.
// ============================================================

export type {
  HomeData,
  InsightsData,
  WeeklySpendDay,
  CategoryStatus,
  CategoryBudget,
  BudgetAlert,
  RecentTransaction,
  ScoreTrendPoint,
  CategoryBreakdownItem,
  ObservationItem,
} from '../screens/home/mockData';

// GET /api/profile (§4.1)
export interface ProfileData {
  name: string;
  university: string | null;
  grade: string;
  gradeLabel: string;
  memberSince: string;
}

// GET /api/profile/streaks (§4.2)
export interface Streaks {
  currentStreak: number;
  longestStreak: number;
}

// GET /api/profile/badges (§4.3)
export interface Badge {
  id: string;
  name: string;
  emoji: string;
  status: 'Unlocked' | 'Locked';
  desc: string;
}

// GET /api/transactions item (§6)
export interface Transaction {
  id: string;
  name: string;
  amount: number;
  type: 'expense' | 'income';
  categoryName: string;
  emoji: string;
  occurredAt: string;
  timeLabel: string;
}

// GET /api/transactions page (§6)
export interface TransactionsPage {
  transactions: Transaction[];
  nextCursor: string | null;
  hasMore: boolean;
}
