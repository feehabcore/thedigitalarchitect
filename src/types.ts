import type {LucideIcon} from 'lucide-react';
import {
  Car,
  Dumbbell,
  Home as HomeIcon,
  Landmark,
  PiggyBank,
  ShoppingBag,
  Utensils,
  Wallet,
  Zap,
} from 'lucide-react';

export type Screen = 'home' | 'analytics' | 'savings' | 'profile' | 'transactions';

export type ThemePreference = 'light' | 'dark' | 'system';

/** Local alerts + optional browser notifications (budget vs salary %, weekly savings pace). */
export interface NotificationPrefs {
  /** When granted, fire system notifications for enabled alert types (deduped per period in-session). */
  browserPush: boolean;
  budgetAlert: boolean;
  /** Alert when this month’s expenses reach this percent of monthly salary (e.g. 80). */
  budgetPercentOfSalary: number;
  weeklySavingsAlert: boolean;
  /** Alert when a month ends and the full statement is ready to download. */
  monthlyStatementAlert: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  browserPush: false,
  budgetAlert: true,
  budgetPercentOfSalary: 80,
  weeklySavingsAlert: true,
  monthlyStatementAlert: true,
};

export interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  /** ISO 8601 date string */
  date: string;
  type: 'income' | 'expense';
}

export interface CategoryBreakdown {
  name: string;
  amount: number;
  percentage: number;
  icon: LucideIcon;
  color: string;
}

export interface UserProfile {
  name: string;
  /** Used in sir/mam greetings; falls back to first name if missing (legacy). */
  nickname?: string;
  occupation: string;
  /** Gross monthly salary in selected currency */
  monthlySalary: number;
  countryCode: string;
  currencyCode: string;
  /** Optional savings target per month (same currency) */
  monthlySavingsTarget: number;
  onboardingCompletedAt: string;
  /** Shapes home greeting (e.g. “…, Name sir/mam”). Omitted on legacy profiles. */
  gender?: 'male' | 'female';
  /** JPEG data URL from onboarding / profile */
  avatarDataUrl?: string | null;
}

export interface SavingsGoal {
  id: string;
  label: string;
  targetAmount: number;
  savedAmount: number;
}

export type DebtDirection = 'borrowed' | 'lent';
export type DebtStatus = 'open' | 'paid';

export interface Debt {
  id: string;
  direction: DebtDirection;
  counterparty: string;
  amount: number;
  /** ISO 8601 date string */
  createdAt: string;
  /** ISO 8601 date string */
  dueDate: string;
  note?: string;
  status: DebtStatus;
  paidAt?: string | null;
}

export const TRANSACTION_CATEGORIES: {id: string; label: string; icon: LucideIcon}[] = [
  {id: 'Food', label: 'Dining & Food', icon: Utensils},
  {id: 'Shopping', label: 'Shopping', icon: ShoppingBag},
  {id: 'Transport', label: 'Transport', icon: Car},
  {id: 'Housing', label: 'Housing & Rent', icon: HomeIcon},
  {id: 'Health', label: 'Health & Wellness', icon: Dumbbell},
  {id: 'Utilities', label: 'Utilities', icon: Zap},
  {id: 'Savings', label: 'Savings transfer', icon: PiggyBank},
  {id: 'Income', label: 'Salary / Income', icon: Landmark},
  {id: 'Other', label: 'Other', icon: Wallet},
];

export function categoryMeta(categoryId: string) {
  return TRANSACTION_CATEGORIES.find((c) => c.id === categoryId) ?? TRANSACTION_CATEGORIES[TRANSACTION_CATEGORIES.length - 1]!;
}
