// ============================================================
// PennyWise — Home & Insights Screen Data Types & Mock Data
// ============================================================

export interface WeeklySpendDay {
  day: string;
  amount: number;
  isToday: boolean;
}

export type CategoryStatus = 'on_track' | 'near_limit' | 'over_budget';

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
  type: 'expense' | 'income';
  emoji: string;
}

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

export interface InsightsData {
  monthYear: string;
  weekLabel: string;
  totalSpent: number;
  scoreTrend7d: ScoreTrendPoint[];
  scoreTrend30d: ScoreTrendPoint[];
  breakdown: CategoryBreakdownItem[];
  observations: ObservationItem[];
  comparison: {
    lastMonthName: string;
    lastMonthSpent: number;
    currentMonthName: string;
    currentMonthSpent: number;
    difference: number;
    percentage: number;
    isSavings: boolean;
  };
  roast: {
    grade: string;
    month: string;
    message: string;
  };
}

export interface HomeData {
  user: {
    firstName: string;
    streakDays: number;
  };
  disciplineScore: {
    score: number;
    brokeScore: number;
    badge: string;
  };
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
  insights: InsightsData;
}

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
    total: 25_000,
    spent: 14_248,
    left: 10_752,
    weeklySpend: [
      { day: 'M', amount: 1_200, isToday: false },
      { day: 'T', amount: 3_400, isToday: false },
      { day: 'W', amount: 800, isToday: false },
      { day: 'T', amount: 2_600, isToday: false },
      { day: 'F', amount: 1_800, isToday: false },
      { day: 'S', amount: 2_200, isToday: false },
      { day: 'S', amount: 4_248, isToday: true },
    ],
  },
  alert: {
    message: "You're 2 shawarmas away from Food bankruptcy.",
    amountLine: '₦1,600 left in food.',
  },
  categories: [
    { id: 'food', emoji: '🍔', name: 'Food', spent: 12_400, budget: 14_000, status: 'near_limit' },
    { id: 'transport', emoji: '🚗', name: 'Transport', spent: 3_200, budget: 8_000, status: 'on_track' },
    { id: 'data', emoji: '📱', name: 'Data', spent: 1_500, budget: 3_000, status: 'on_track' },
  ],
  recentTransactions: [
    {
      id: 'tx1',
      name: 'Chicken Republic',
      timeLabel: '2h ago · Food',
      categoryName: 'Food',
      amount: 2400,
      type: 'expense',
      emoji: '🍔',
    },
    {
      id: 'tx2',
      name: 'Bolt',
      timeLabel: '3h ago · Transport',
      categoryName: 'Transport',
      amount: 850,
      type: 'expense',
      emoji: '🚗',
    },
    {
      id: 'tx3',
      name: 'Airtel Data 2GB',
      timeLabel: 'Yesterday · Data',
      categoryName: 'Data',
      amount: 1500,
      type: 'expense',
      emoji: '📱',
    },
    {
      id: 'tx4',
      name: 'PalmPay Transfer',
      timeLabel: 'Yesterday · Income',
      categoryName: 'Income',
      amount: 5000,
      type: 'income',
      emoji: '💸',
    },
    {
      id: 'tx5',
      name: 'Shoprite Ikeja',
      timeLabel: '2 days ago · Groceries',
      categoryName: 'Groceries',
      amount: 3200,
      type: 'expense',
      emoji: '🛒',
    },
  ],
  insights: {
    monthYear: 'May 2025',
    weekLabel: 'Week 4',
    totalSpent: 24848,
    scoreTrend7d: [
      { label: 'Mo', score: 48 },
      { label: 'Tu', score: 52 },
      { label: 'We', score: 55 },
      { label: 'Th', score: 58 },
      { label: 'Fr', score: 62 },
      { label: 'Sa', score: 68 },
      { label: 'Su', score: 73 },
    ],
    scoreTrend30d: [
      { label: 'Wk1', score: 38 },
      { label: 'Wk2', score: 49 },
      { label: 'Wk3', score: 61 },
      { label: 'Wk4', score: 73 },
    ],
    breakdown: [
      { id: 'b1', name: 'Food', percentage: 50, amount: 12400, color: '#f97316' },      // Orange
      { id: 'b2', name: 'Groceries', percentage: 15, amount: 3727, color: '#22c55e' }, // Emerald
      { id: 'b3', name: 'Transport', percentage: 13, amount: 3230, color: '#3b82f6' }, // Blue
      { id: 'b4', name: 'Hangout', percentage: 9, amount: 2236, color: '#ec4899' },    // Pink
      { id: 'b5', name: 'Others', percentage: 7, amount: 1739, color: '#a1a1aa' },     // Gray
      { id: 'b6', name: 'Data', percentage: 6, amount: 1516, color: '#8b5cf6' },       // Purple
    ],
    observations: [
      {
        id: 'obs1',
        emoji: '🍗',
        text: 'Chicken Republic took ₦7,200 this month — that’s 29% of your total budget. Food is not a category, it’s a lifestyle.',
      },
      {
        id: 'obs2',
        emoji: '🚗',
        text: 'Transport dropped 38% vs last week. Either Bolt got expensive or you found your legs. Either way — ₦1,800 saved.',
      },
      {
        id: 'obs3',
        emoji: '🔥',
        text: '12 days logged in a row. Your score climbed 26 points this month. That’s actual discipline.',
      },
    ],
    comparison: {
      lastMonthName: 'April',
      lastMonthSpent: 28400,
      currentMonthName: 'May (so far)',
      currentMonthSpent: 24848,
      difference: -3552,
      percentage: 12.5,
      isSavings: true,
    },
    roast: {
      grade: 'B',
      month: 'May',
      message: "Not bad, but Chicken Republic is your landlord now. ₦7,200 on food alone — that’s two months of data. Adjust *one* thing and you'll hit Grade A by June.",
    },
  },
};
