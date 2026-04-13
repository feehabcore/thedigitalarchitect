import type {Debt, NotificationPrefs, Transaction, UserProfile} from '@/src/types';
import {formatMoney} from '@/src/lib/currencies';
import {flowThisMonth, savingsMovedThisWeek} from '@/src/lib/stats';
import {startOfWeek} from '@/src/lib/dates';

export type HomeAlertKind = 'budget' | 'weekly_savings' | 'statement_ready' | 'debt_due';

export interface HomeAlert {
  id: string;
  kind: HomeAlertKind;
  title: string;
  message: string;
  action?: {kind: 'download_statement_month'; label: string; monthKey: string};
}

function parseIsoDate(iso: string) {
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d : null;
}

function daysUntil(due: Date, now: Date) {
  const ms = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

function budgetCap(profile: UserProfile, prefs: NotificationPrefs) {
  if (profile.monthlySalary <= 0) return null;
  return profile.monthlySalary * (prefs.budgetPercentOfSalary / 100);
}

export function buildHomeAlerts(
  profile: UserProfile,
  transactions: Transaction[],
  prefs: NotificationPrefs,
  debts?: Debt[],
): HomeAlert[] {
  const out: HomeAlert[] = [];
  const now = new Date();
  const {expense} = flowThisMonth(transactions, now);
  const cap = budgetCap(profile, prefs);

  if (prefs.budgetAlert && cap != null && expense >= cap) {
    out.push({
      id: `budget-${now.getFullYear()}-${now.getMonth()}`,
      kind: 'budget',
      title: 'Budget',
      message: `This month’s spending (${formatMoney(expense, profile.currencyCode)}) has reached your ${prefs.budgetPercentOfSalary}% of salary alert (${formatMoney(cap, profile.currencyCode)}).`,
    });
  }

  if (prefs.weeklySavingsAlert) {
    const weeklyTarget = Math.max(profile.monthlySavingsTarget / 4, 1);
    const savedWeek = savingsMovedThisWeek(transactions, now);
    const weekProgress = Math.min(100, Math.round((savedWeek / weeklyTarget) * 100));
    const dow = now.getDay();
    const lateWeek = dow === 4 || dow === 5 || dow === 6 || dow === 0;
    if (lateWeek && weekProgress < 50) {
      const wk = startOfWeek(now).toISOString().slice(0, 10);
      out.push({
        id: `weekly-${wk}`,
        kind: 'weekly_savings',
        title: 'Weekly savings pace',
        message: `You’ve logged ${formatMoney(savedWeek, profile.currencyCode)} toward this week’s ${formatMoney(weeklyTarget, profile.currencyCode)} target (${weekProgress}% ). Consider a savings transfer before the week ends.`,
      });
    }
  }

  if (prefs.monthlyStatementAlert) {
    // On the first day of a new month, surface the previous month's full statement.
    if (now.getDate() === 1) {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
      const hasPrevTx = transactions.some((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === prev.getFullYear() && d.getMonth() === prev.getMonth();
      });
      if (hasPrevTx) {
        const label = prev.toLocaleString('default', {month: 'long', year: 'numeric'});
        out.push({
          id: `statement-${prevKey}`,
          kind: 'statement_ready',
          title: 'Statement ready',
          message: `Your full statement for ${label} is ready to download (includes every income and expense).`,
          action: {kind: 'download_statement_month', label: 'Download', monthKey: prevKey},
        });
      }
    }
  }

  if (debts && debts.length) {
    const openDebts = debts.filter((d) => d.status === 'open');
    for (const d of openDebts) {
      const due = parseIsoDate(d.dueDate);
      if (!due) continue;
      const left = daysUntil(due, now);
      if (left > 7) continue; // only show when due soon
      const who = d.counterparty || 'Someone';
      const label = d.direction === 'borrowed' ? `Return to ${who}` : `Collect from ${who}`;
      const when = left < 0 ? 'Overdue' : left === 0 ? 'Due today' : `Due in ${left} day${left === 1 ? '' : 's'}`;
      out.push({
        id: `debt-${d.id}`,
        kind: 'debt_due',
        title: 'Loan reminder',
        message: `${when} · ${label} · ${formatMoney(d.amount, profile.currencyCode)}`,
      });
    }
  }

  return out;
}

async function scheduleSystemNotification(title: string, body: string, tag: string) {
  try {
    const {Capacitor} = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      const {LocalNotifications} = await import('@capacitor/local-notifications');
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') return false;
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 2_000_000_000),
            title,
            body,
            extra: {tag},
          },
        ],
      });
      return true;
    }
  } catch {
    // ignore
  }

  if (typeof window === 'undefined') return false;
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;
  try {
    new Notification(title, {body, tag});
    return true;
  } catch {
    return false;
  }
}

export async function requestSystemNotificationPermission(): Promise<'granted' | 'denied' | 'unsupported'> {
  try {
    const {Capacitor} = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      const {LocalNotifications} = await import('@capacitor/local-notifications');
      const r = await LocalNotifications.requestPermissions();
      return r.display === 'granted' ? 'granted' : 'denied';
    }
  } catch {
    // ignore
  }

  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  const result = await Notification.requestPermission();
  return result === 'granted' ? 'granted' : 'denied';
}

export function trySendSystemFinancialAlerts(
  profile: UserProfile,
  transactions: Transaction[],
  prefs: NotificationPrefs,
  debts?: Debt[],
) {
  if (typeof window === 'undefined') return;
  if (!prefs.browserPush) return;

  const now = new Date();
  const {expense} = flowThisMonth(transactions, now);

  if (prefs.budgetAlert && profile.monthlySalary > 0) {
    const cap = profile.monthlySalary * (prefs.budgetPercentOfSalary / 100);
    if (expense >= cap) {
      const id = `${now.getFullYear()}-${now.getMonth()}`;
      const storageKey = `tda_sent_system_budget_${id}`;
      if (!sessionStorage.getItem(storageKey)) {
        sessionStorage.setItem(storageKey, '1');
        void scheduleSystemNotification(
          'Budget alert',
          `Spending this month is ${formatMoney(expense, profile.currencyCode)} — at or above your ${prefs.budgetPercentOfSalary}% of salary threshold (${formatMoney(cap, profile.currencyCode)}).`,
          `tda-budget-${id}`,
        );
      }
    }
  }

  if (prefs.weeklySavingsAlert) {
    const weeklyTarget = Math.max(profile.monthlySavingsTarget / 4, 1);
    const savedWeek = savingsMovedThisWeek(transactions, now);
    const weekProgress = Math.min(100, Math.round((savedWeek / weeklyTarget) * 100));
    const dow = now.getDay();
    const lateWeek = dow === 4 || dow === 5 || dow === 6 || dow === 0;
    if (lateWeek && weekProgress < 50) {
      const wk = startOfWeek(now).toISOString().slice(0, 10);
      const storageKey = `tda_sent_system_weekly_${wk}`;
      if (!sessionStorage.getItem(storageKey)) {
        sessionStorage.setItem(storageKey, '1');
        void scheduleSystemNotification(
          'Weekly savings pace',
          `Weekly savings progress is ${weekProgress}% (${formatMoney(savedWeek, profile.currencyCode)} of ${formatMoney(weeklyTarget, profile.currencyCode)}).`,
          `tda-weekly-${wk}`,
        );
      }
    }
  }

  if (prefs.monthlyStatementAlert) {
    if (now.getDate() === 1) {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
      const hasPrevTx = transactions.some((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === prev.getFullYear() && d.getMonth() === prev.getMonth();
      });
      if (hasPrevTx) {
        const storageKey = `tda_sent_system_statement_${prevKey}`;
        if (!sessionStorage.getItem(storageKey)) {
          sessionStorage.setItem(storageKey, '1');
          const label = prev.toLocaleString('default', {month: 'long', year: 'numeric'});
          void scheduleSystemNotification(
            'Statement ready',
            `Your full statement for ${label} is ready to download (includes every income and expense).`,
            `tda-statement-${prevKey}`,
          );
        }
      }
    }
  }

  if (debts && debts.length) {
    const openDebts = debts.filter((d) => d.status === 'open');
    for (const d of openDebts) {
      const due = parseIsoDate(d.dueDate);
      if (!due) continue;
      const left = daysUntil(due, now);
      if (left > 3) continue; // notify only when very close
      const who = d.counterparty || 'Someone';
      const label = d.direction === 'borrowed' ? `Return to ${who}` : `Collect from ${who}`;
      const when = left < 0 ? 'Overdue' : left === 0 ? 'Due today' : `Due in ${left} day${left === 1 ? '' : 's'}`;
      const key = `tda_sent_system_debt_${d.id}_${new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().slice(0, 10)}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        void scheduleSystemNotification(
          'Loan reminder',
          `${when} · ${label} · ${formatMoney(d.amount, profile.currencyCode)}`,
          `tda-debt-${d.id}`,
        );
      }
    }
  }
}

// Backward-compatible export (older imports).
export const trySendBrowserFinancialAlerts = trySendSystemFinancialAlerts;
