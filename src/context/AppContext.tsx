import * as React from 'react';
import type {SavingsGoal, ThemePreference, Transaction, UserProfile} from '@/src/types';

function normalizeTheme(x: unknown): ThemePreference {
  if (x === 'light' || x === 'dark' || x === 'system') return x;
  return 'system';
}
import {currencyForCountry, DEFAULT_CURRENCY_CODE} from '@/src/lib/currencies';

const STORAGE_PROFILE = 'tda_profile_v1';
const STORAGE_TX = 'tda_transactions_v1';
const STORAGE_SAVINGS = 'tda_savings_v1';
const STORAGE_DAILY = 'tda_daily_savings_v1';
const STORAGE_THEME = 'tda_theme_v1';

function resolveTheme(pref: ThemePreference): 'light' | 'dark' {
  if (pref === 'light') return 'light';
  if (pref === 'dark') return 'dark';
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeToDocument(resolved: 'light' | 'dark') {
  document.documentElement.dataset.theme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', resolved === 'dark' ? '#0b1326' : '#eef2ff');
}

export interface SavingsPrefs {
  dailyAmount: number;
  goals: SavingsGoal[];
}

interface AppState {
  profile: UserProfile | null;
  transactions: Transaction[];
  savings: SavingsPrefs;
}

export type OnboardingInput = {
  name: string;
  occupation: string;
  monthlySalary: number;
  countryCode: string;
  /** If omitted, defaults to ~15% of salary */
  monthlySavingsTarget?: number;
  /** JPEG data URL from camera/gallery (optional) */
  avatarDataUrl?: string | null;
};

interface AppContextValue extends AppState {
  themePreference: ThemePreference;
  setThemePreference: (t: ThemePreference) => void;
  completeOnboarding: (p: OnboardingInput) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  removeTransaction: (id: string) => void;
  setDailySavingsAmount: (n: number) => void;
  addSavingsGoal: (g: Omit<SavingsGoal, 'id' | 'savedAmount'> & {savedAmount?: number}) => void;
  updateGoalProgress: (id: string, savedAmount: number) => void;
  removeSavingsGoal: (id: string) => void;
  contributeToGoal: (id: string, amount: number) => void;
  resetAccount: () => void;
}

const AppContext = React.createContext<AppContextValue | null>(null);

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export function AppProvider({children}: {children: React.ReactNode}) {
  const [profile, setProfile] = React.useState<UserProfile | null>(() => loadJson(STORAGE_PROFILE, null));
  const [transactions, setTransactions] = React.useState<Transaction[]>(() => loadJson(STORAGE_TX, []));
  const [themePreference, setThemePreferenceState] = React.useState<ThemePreference>(() => normalizeTheme(loadJson(STORAGE_THEME, 'system')));
  const [savings, setSavings] = React.useState<SavingsPrefs>(() => {
    const s = loadJson<SavingsPrefs>(STORAGE_SAVINGS, {dailyAmount: 70, goals: []});
    const daily = loadJson<number>(STORAGE_DAILY, s.dailyAmount);
    return {...s, dailyAmount: daily};
  });

  const setThemePreference = React.useCallback((t: ThemePreference) => {
    setThemePreferenceState(t);
    saveJson(STORAGE_THEME, t);
  }, []);

  React.useLayoutEffect(() => {
    const resolved = resolveTheme(themePreference);
    applyThemeToDocument(resolved);
    if (themePreference !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyThemeToDocument(resolveTheme('system'));
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [themePreference]);

  React.useEffect(() => {
    saveJson(STORAGE_PROFILE, profile);
  }, [profile]);
  React.useEffect(() => {
    saveJson(STORAGE_TX, transactions);
  }, [transactions]);
  React.useEffect(() => {
    saveJson(STORAGE_SAVINGS, savings);
  }, [savings]);

  const completeOnboarding = React.useCallback((p: OnboardingInput) => {
    const currencyCode = currencyForCountry(p.countryCode) || DEFAULT_CURRENCY_CODE;
    const monthlySavingsTarget =
      p.monthlySavingsTarget != null && p.monthlySavingsTarget > 0
        ? p.monthlySavingsTarget
        : Math.max(0, Math.round(p.monthlySalary * 0.15));
    const next: UserProfile = {
      name: p.name.trim(),
      occupation: p.occupation.trim(),
      monthlySalary: p.monthlySalary,
      countryCode: p.countryCode,
      currencyCode,
      monthlySavingsTarget,
      onboardingCompletedAt: new Date().toISOString(),
      avatarDataUrl: p.avatarDataUrl ?? null,
    };
    setProfile(next);
  }, []);

  const updateProfile = React.useCallback((patch: Partial<UserProfile>) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const next = {...prev, ...patch};
      if (patch.countryCode != null && patch.countryCode !== prev.countryCode) {
        next.currencyCode = currencyForCountry(patch.countryCode);
      }
      return next;
    });
  }, []);

  const addTransaction = React.useCallback((t: Omit<Transaction, 'id'>) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    setTransactions((prev) => [{...t, id}, ...prev]);
  }, []);

  const removeTransaction = React.useCallback((id: string) => {
    setTransactions((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const setDailySavingsAmount = React.useCallback((n: number) => {
    setSavings((prev) => ({...prev, dailyAmount: Math.max(10, Math.min(500, n))}));
    saveJson(STORAGE_DAILY, Math.max(10, Math.min(500, n)));
  }, []);

  const addSavingsGoal = React.useCallback((g: Omit<SavingsGoal, 'id' | 'savedAmount'> & {savedAmount?: number}) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-g`;
    setSavings((prev) => ({
      ...prev,
      goals: [...prev.goals, {id, label: g.label, targetAmount: g.targetAmount, savedAmount: g.savedAmount ?? 0}],
    }));
  }, []);

  const updateGoalProgress = React.useCallback((id: string, savedAmount: number) => {
    setSavings((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === id ? {...g, savedAmount: Math.min(g.targetAmount, Math.max(0, savedAmount))} : g)),
    }));
  }, []);

  const removeSavingsGoal = React.useCallback((id: string) => {
    setSavings((prev) => ({...prev, goals: prev.goals.filter((g) => g.id !== id)}));
  }, []);

  const contributeToGoal = React.useCallback((id: string, amount: number) => {
    const a = Math.max(0, amount);
    if (!a) return;
    setSavings((prev) => ({
      ...prev,
      goals: prev.goals.map((g) =>
        g.id === id ? {...g, savedAmount: Math.min(g.targetAmount, g.savedAmount + a)} : g,
      ),
    }));
  }, []);

  const resetAccount = React.useCallback(() => {
    setProfile(null);
    setTransactions([]);
    setSavings({dailyAmount: 70, goals: []});
    localStorage.removeItem(STORAGE_PROFILE);
    localStorage.removeItem(STORAGE_TX);
    localStorage.removeItem(STORAGE_SAVINGS);
    localStorage.removeItem(STORAGE_DAILY);
  }, []);

  const value = React.useMemo(
    () =>
      ({
        profile,
        transactions,
        savings,
        themePreference,
        setThemePreference,
        completeOnboarding,
        updateProfile,
        addTransaction,
        removeTransaction,
        setDailySavingsAmount,
        addSavingsGoal,
        updateGoalProgress,
        removeSavingsGoal,
        contributeToGoal,
        resetAccount,
      }) satisfies AppContextValue,
    [
      profile,
      transactions,
      savings,
      themePreference,
      setThemePreference,
      completeOnboarding,
      updateProfile,
      addTransaction,
      removeTransaction,
      setDailySavingsAmount,
      addSavingsGoal,
      updateGoalProgress,
      removeSavingsGoal,
      contributeToGoal,
      resetAccount,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = React.useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
