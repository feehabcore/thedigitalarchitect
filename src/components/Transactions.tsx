import * as React from 'react';
import {ArrowLeft, Search, Trash2} from 'lucide-react';
import {motion} from 'motion/react';
import {cn} from '@/src/lib/utils';
import {useApp} from '@/src/context/AppContext';
import {formatMoney} from '@/src/lib/currencies';
import {categoryMeta} from '@/src/types';
import {flowThisMonth} from '@/src/lib/stats';

type Filter = 'all' | 'income' | 'expense';

export default function Transactions({
  onAdd,
  onBack,
  focusTransactionId,
  onConsumedFocus,
}: {
  onAdd: () => void;
  onBack: () => void;
  focusTransactionId?: string | null;
  onConsumedFocus?: () => void;
}) {
  const {profile, transactions, removeTransaction} = useApp();
  const cc = profile!.currencyCode;
  const [q, setQ] = React.useState('');
  const [filter, setFilter] = React.useState<Filter>('all');
  const [pulseId, setPulseId] = React.useState<string | null>(null);
  const now = new Date();
  const {income: incMonth, expense: expMonth} = flowThisMonth(transactions, now);

  React.useEffect(() => {
    if (!focusTransactionId) return;
    setFilter('all');
    setQ('');
    const id = focusTransactionId;
    const scrollTimer = window.setTimeout(() => {
      document.querySelector(`[data-tx-id="${id}"]`)?.scrollIntoView({block: 'center', behavior: 'smooth'});
      setPulseId(id);
      onConsumedFocus?.();
    }, 60);
    const pulseClear = window.setTimeout(() => setPulseId(null), 2200);
    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(pulseClear);
    };
  }, [focusTransactionId, onConsumedFocus]);

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return transactions
      .filter((t) => (filter === 'all' ? true : t.type === filter))
      .filter((t) => {
        if (!needle) return true;
        return (
          t.title.toLowerCase().includes(needle) ||
          t.category.toLowerCase().includes(needle) ||
          categoryMeta(t.category).label.toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, q, filter]);

  const groups = React.useMemo(() => {
    const m = new Map<string, typeof filtered>();
    for (const t of filtered) {
      const key = new Date(t.date).toDateString();
      const arr = m.get(key) ?? [];
      arr.push(t);
      m.set(key, arr);
    }
    return Array.from(m.entries());
  }, [filtered]);

  return (
    <motion.div initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} className="space-y-6 pb-10">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="touch-manipulation rounded-full bg-surface-container-high p-2 text-on-surface"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold font-headline tracking-tight">Transactions</h1>
          <p className="text-sm text-on-surface-variant">Search, filter, delete</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="touch-manipulation rounded-full bg-gradient-to-br from-primary to-secondary px-4 py-2 text-xs font-bold text-slate-950"
        >
          Add
        </button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-2xl border border-outline-variant/25 bg-surface-container-low py-3 pl-11 pr-4 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Search title or category…"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {(
          [
            ['all', 'All'],
            ['income', 'Income'],
            ['expense', 'Expense'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              'touch-manipulation shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all',
              filter === id ? 'bg-gradient-to-br from-primary to-secondary text-slate-950' : 'bg-surface-container-high text-on-surface-variant',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Out (month)</p>
          <p className="mt-1 text-lg font-extrabold">{formatMoney(expMonth, cc)}</p>
        </div>
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline">In (month)</p>
          <p className="mt-1 text-lg font-extrabold text-emerald-400">{formatMoney(incMonth, cc)}</p>
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-on-surface-variant">Nothing matches. Try another filter or add a transaction.</p>
      ) : (
        <div className="space-y-8">
          {groups.map(([dayKey, items]) => (
            <div key={dayKey}>
              <h3 className="mb-3 ml-1 text-[11px] font-bold uppercase tracking-[0.18em] text-outline">{dayKey}</h3>
              <div className="space-y-3">
                {items.map((t) => (
                  <div
                    key={t.id}
                    data-tx-id={t.id}
                    className={cn(
                      'glass-card flex items-center justify-between gap-3 rounded-2xl border-l-4 border-primary/40 p-4 transition-shadow',
                      pulseId === t.id && 'ring-2 ring-primary shadow-[0_0_0_4px_rgba(173,198,255,0.25)]',
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-headline font-bold">{t.title}</p>
                      <p className="truncate text-xs text-on-surface-variant">
                        {categoryMeta(t.category).label} · {new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={cn('font-headline font-bold', t.type === 'income' ? 'text-emerald-400' : 'text-on-surface')}>
                        {t.type === 'income' ? '+' : '−'}
                        {formatMoney(t.amount, cc)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeTransaction(t.id)}
                        className="touch-manipulation rounded-xl bg-surface-container-high p-2 text-on-surface-variant hover:text-error"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
