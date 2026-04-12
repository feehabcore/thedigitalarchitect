import type {Transaction} from '@/src/types';
import {isSameCalendarWeek, isSameMonth, startOfWeek} from '@/src/lib/dates';

export function sumIncome(transactions: Transaction[]) {
  return transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
}

export function sumExpense(transactions: Transaction[]) {
  return transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
}

export function netBalance(transactions: Transaction[]) {
  return sumIncome(transactions) - sumExpense(transactions);
}

export function flowThisMonth(transactions: Transaction[], now = new Date()) {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (!isSameMonth(new Date(t.date), now)) continue;
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  }
  return {income, expense};
}

export function savingsMovedThisWeek(transactions: Transaction[], now = new Date()) {
  return transactions
    .filter(
      (t) =>
        t.type === 'expense' &&
        t.category === 'Savings' &&
        isSameCalendarWeek(new Date(t.date), now),
    )
    .reduce((s, t) => s + t.amount, 0);
}

export function lastFourWeeksBars(transactions: Transaction[], now = new Date()) {
  const out: {label: string; income: number; expense: number}[] = [];
  for (let w = 3; w >= 0; w--) {
    const anchor = new Date(now);
    anchor.setDate(anchor.getDate() - w * 7);
    const s = startOfWeek(anchor);
    const e = new Date(s);
    e.setDate(e.getDate() + 7);
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      const dt = new Date(t.date);
      if (dt < s || dt >= e) continue;
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    }
    const label = `${s.getMonth() + 1}/${s.getDate()}`;
    out.push({label, income, expense});
  }
  return out;
}

export function categoryTotalsForMonth(transactions: Transaction[], now = new Date()) {
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    if (!isSameMonth(new Date(t.date), now)) continue;
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  }
  return Array.from(map.entries())
    .map(([name, amount]) => ({name, amount}))
    .sort((a, b) => b.amount - a.amount);
}

export function spendingByDayThisMonth(transactions: Transaction[], now = new Date()) {
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const totals = days.map((day) => ({day, amount: 0}));
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    const d = new Date(t.date);
    if (!isSameMonth(d, now)) continue;
    const monIdx = (d.getDay() + 6) % 7;
    totals[monIdx]!.amount += t.amount;
  }
  return totals;
}
