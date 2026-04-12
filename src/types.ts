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
  occupation: string;
  /** Gross monthly salary in selected currency */
  monthlySalary: number;
  countryCode: string;
  currencyCode: string;
  /** Optional savings target per month (same currency) */
  monthlySavingsTarget: number;
  onboardingCompletedAt: string;
  /** JPEG data URL from onboarding / profile (optional) */
  avatarDataUrl?: string | null;
}

export interface SavingsGoal {
  id: string;
  label: string;
  targetAmount: number;
  savedAmount: number;
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
