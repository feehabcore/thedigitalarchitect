import * as React from 'react';
import {Fragment} from 'react';
import {ArrowDownLeft, ArrowUpRight, Bell, TrendingDown, TrendingUp, X} from 'lucide-react';
import {motion} from 'motion/react';
import {cn} from '@/src/lib/utils';
import {useApp} from '@/src/context/AppContext';
import {formatMoney} from '@/src/lib/currencies';
import {categoryMeta} from '@/src/types';
import {flowThisMonth, lastFourWeeksBars, netBalance, savingsMovedThisWeek} from '@/src/lib/stats';
import {buildHomeAlerts} from '@/src/lib/alertNotifications';

function greeting(salutationName: string, gender?: 'male' | 'female') {
  const h = new Date().getHours();
  const base = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const honorific = gender === 'female' ? ' mam' : gender === 'male' ? ' sir' : '';
  return `${base}, ${salutationName}${honorific}`;
}

function greetingSalutation(profile: {name: string; nickname?: string}) {
  const n = profile.nickname?.trim();
  if (n) return n;
  return profile.name.split(' ')[0] || profile.name;
}

export default function Home({
  onAddIncomeExpense,
  onViewTransactions,
}: {
  onAddIncomeExpense: (type: 'income' | 'expense') => void;
  onViewTransactions: () => void;
}) {
  const {profile, transactions, notificationPrefs, debts} = useApp();
  const [dismissTick, setDismissTick] = React.useState(0);

  const homeAlerts = React.useMemo(() => {
    void dismissTick;
    return buildHomeAlerts(profile!, transactions, notificationPrefs, debts).filter(
      (a) => localStorage.getItem(`tda_alert_dismiss_${a.id}`) !== '1',
    );
  }, [profile, transactions, notificationPrefs, debts, dismissTick]);

  function dismissAlert(id: string) {
    try {
      localStorage.setItem(`tda_alert_dismiss_${id}`, '1');
    } catch {
      /* ignore */
    }
    setDismissTick((n) => n + 1);
  }
  const cc = profile!.currencyCode;
  const now = new Date();
  const balance = netBalance(transactions);
  const {income: incMonth, expense: expMonth} = flowThisMonth(transactions, now);
  const weeklyTarget = Math.max(profile!.monthlySavingsTarget / 4, 1);
  const savedWeek = savingsMovedThisWeek(transactions, now);
  const weekProgress = Math.min(100, Math.round((savedWeek / weeklyTarget) * 100));
  const bars = lastFourWeeksBars(transactions, now);
  const maxBar = Math.max(1, ...bars.flatMap((b) => [b.income, b.expense]));
  const recent = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <motion.div initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} className="space-y-6">
      <section className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Overview</p>
        <h1 className="text-2xl font-extrabold font-headline tracking-tight text-on-surface">
          {greeting(greetingSalutation(profile!), profile!.gender)}
        </h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onAddIncomeExpense('income')}
            className="inline-flex touch-manipulation items-center gap-2 rounded-full bg-surface-container-high px-4 py-2.5 text-sm font-semibold text-on-surface"
          >
            <ArrowDownLeft className="h-4 w-4 text-primary" />
            Add income
          </button>
          <button
            type="button"
            onClick={() => onAddIncomeExpense('expense')}
            className="inline-flex touch-manipulation items-center gap-2 rounded-full bg-gradient-to-br from-primary to-secondary px-4 py-2.5 text-sm font-bold text-slate-950 shadow-md shadow-primary/15"
          >
            <ArrowUpRight className="h-4 w-4" />
            Add expense
          </button>
        </div>
      </section>

      {homeAlerts.length > 0 && (
        <section className="space-y-3" aria-label="Alerts">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Alerts</p>
          <div className="space-y-2">
            {homeAlerts.map((a) => (
              <div
                key={a.id}
                className="relative flex gap-3 rounded-2xl border border-primary/25 bg-primary/10 p-4 pr-12 text-sm text-on-surface"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-primary">
                  <Bell className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-headline font-bold text-on-surface">{a.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{a.message}</p>
                  {a.action?.kind === 'download_statement_month' && (
                    <button
                      type="button"
                      onClick={() => {
                        void import('@/src/lib/statementPdf').then(({downloadMonthlyStatementPdf}) =>
                          downloadMonthlyStatementPdf(profile!, transactions, a.action!.monthKey),
                        );
                      }}
                      className="mt-2 inline-flex touch-manipulation items-center justify-center rounded-full bg-surface-container-high px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-primary"
                    >
                      {a.action.label}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismissAlert(a.id)}
                  className="absolute right-2 top-2 touch-manipulation rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high"
                  aria-label="Dismiss alert"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/10 to-transparent p-[1px]">
        <div className="wealth-glass glass-card relative overflow-hidden rounded-2xl p-5">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-[80px]" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Net from your entries</p>
                <p className="truncate text-3xl font-extrabold font-headline text-on-surface">{formatMoney(balance, cc)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-primary">
                {balance >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                <span>{balance >= 0 ? 'Positive' : 'Deficit'}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Income (month)" value={formatMoney(incMonth, cc)} />
              <Stat label="Spent (month)" value={formatMoney(expMonth, cc)} />
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-headline font-bold text-on-surface">Weekly savings pace</h2>
            <p className="mt-1 text-xs text-on-surface-variant">
              Target {formatMoney(weeklyTarget, cc)} / week from your plan. Log “Savings transfer” expenses to track.
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-end justify-between text-xs">
            <span className="font-bold uppercase tracking-widest text-on-surface-variant">Progress</span>
            <span className="font-headline font-bold">{weekProgress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
            <motion.div
              initial={{width: 0}}
              animate={{width: `${weekProgress}%`}}
              transition={{duration: 0.6, ease: 'easeOut'}}
              className="h-full rounded-full bg-tertiary"
            />
          </div>
          <p className="text-[11px] text-on-surface-variant">
            Logged this week: <span className="font-semibold text-tertiary">{formatMoney(savedWeek, cc)}</span>
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-headline font-bold">Last 4 weeks</h2>
        </div>
        <div className="flex h-36 items-end justify-between gap-2">
          {bars.map((b, i) => {
            const label = b.label;
            return (
              <Fragment key={label}>
                <WeekBar
                  label={label}
                  incomePct={(b.income / maxBar) * 100}
                  expensePct={(b.expense / maxBar) * 100}
                  active={i === bars.length - 1}
                />
              </Fragment>
            );
          })}
        </div>
        <div className="mt-4 flex gap-6 text-xs text-on-surface-variant">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary/70" /> Income
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-secondary/70" /> Expense
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-headline font-bold">Recent activity</h2>
          <button
            type="button"
            onClick={onViewTransactions}
            className="text-[11px] font-bold uppercase tracking-widest text-primary touch-manipulation"
          >
            View all
          </button>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No entries yet. Tap Add to log your first transaction.</p>
        ) : (
          <div className="space-y-4">
            {recent.map((t) => {
              const meta = categoryMeta(t.category);
              const Icon = meta.icon;
              const positive = t.type === 'income';
              return (
                <div key={t.id} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-container-high">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-headline font-bold text-on-surface">{t.title}</p>
                      <p className="truncate text-xs text-on-surface-variant">
                        {meta.label} · {new Date(t.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={cn('shrink-0 font-headline font-bold', positive ? 'text-emerald-400' : 'text-on-surface')}>
                    {positive ? '+' : '−'}
                    {formatMoney(t.amount, cc)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </motion.div>
  );
}

function Stat({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-xl bg-surface-container-highest/40 p-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="mt-1 font-headline text-lg font-bold">{value}</p>
    </div>
  );
}

function WeekBar({
  label,
  incomePct,
  expensePct,
  active,
}: {
  label: string;
  incomePct: number;
  expensePct: number;
  active?: boolean;
}) {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-end gap-2">
      <div className="flex h-full w-full items-end justify-center gap-0.5">
        <motion.div
          initial={{height: 0}}
          animate={{height: `${Math.max(4, incomePct)}%`}}
          className={cn('w-1/2 rounded-t-sm', active ? 'bg-primary/70' : 'bg-primary/25')}
        />
        <motion.div
          initial={{height: 0}}
          animate={{height: `${Math.max(4, expensePct)}%`}}
          className={cn('w-1/2 rounded-t-sm', active ? 'bg-secondary/70' : 'bg-secondary/25')}
        />
      </div>
      <span className={cn('text-[9px] font-bold uppercase tracking-tight', active ? 'text-on-surface' : 'text-on-surface-variant')}>
        {label}
      </span>
    </div>
  );
}
