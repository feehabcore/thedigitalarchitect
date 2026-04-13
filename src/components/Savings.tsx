import * as React from 'react';
import {CheckCircle2, PlusCircle, TrendingUp, Trash2} from 'lucide-react';
import {motion} from 'motion/react';
import {useApp} from '@/src/context/AppContext';
import {formatMoney} from '@/src/lib/currencies';
import {cn} from '@/src/lib/utils';
import type {DebtDirection} from '@/src/types';

export default function Savings() {
  const {profile, savings, setDailySavingsAmount, addSavingsGoal, contributeToGoal, removeSavingsGoal, debts, addDebt, markDebtPaid, removeDebt} =
    useApp();
  const cc = profile!.currencyCode;
  const {dailyAmount, goals} = savings;

  const totals = React.useMemo(() => {
    const target = goals.reduce((s, g) => s + g.targetAmount, 0);
    const saved = goals.reduce((s, g) => s + g.savedAmount, 0);
    const pct = target > 0 ? Math.round((saved / target) * 100) : 0;
    return {target, saved, pct: Math.min(100, pct)};
  }, [goals]);

  const yearlyProj = dailyAmount * 365;

  const [goalOpen, setGoalOpen] = React.useState(false);
  const [gLabel, setGLabel] = React.useState('');
  const [gTarget, setGTarget] = React.useState('');
  const [gErr, setGErr] = React.useState<string | null>(null);

  const [contrib, setContrib] = React.useState<{id: string; value: string} | null>(null);

  const openDebts = React.useMemo(() => debts.filter((d) => d.status === 'open'), [debts]);
  const [debtOpen, setDebtOpen] = React.useState(false);
  const [dDir, setDDir] = React.useState<DebtDirection>('borrowed');
  const [dWho, setDWho] = React.useState('');
  const [dAmount, setDAmount] = React.useState('');
  const [dDue, setDDue] = React.useState(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [dNote, setDNote] = React.useState('');
  const [dErr, setDErr] = React.useState<string | null>(null);

  function submitGoal(e: React.FormEvent) {
    e.preventDefault();
    setGErr(null);
    const n = parseFloat(gTarget.replace(/,/g, ''));
    if (!gLabel.trim()) {
      setGErr('Name the goal.');
      return;
    }
    if (!Number.isFinite(n) || n <= 0) {
      setGErr('Enter a valid target amount.');
      return;
    }
    addSavingsGoal({label: gLabel.trim(), targetAmount: n});
    setGLabel('');
    setGTarget('');
    setGoalOpen(false);
  }

  function submitContrib(e: React.FormEvent) {
    e.preventDefault();
    if (!contrib) return;
    const n = parseFloat(contrib.value.replace(/,/g, ''));
    if (!Number.isFinite(n) || n <= 0) return;
    contributeToGoal(contrib.id, n);
    setContrib(null);
  }

  function submitDebt(e: React.FormEvent) {
    e.preventDefault();
    setDErr(null);
    const amt = parseFloat(dAmount.replace(/,/g, ''));
    if (!dWho.trim()) {
      setDErr('Enter a name (who).');
      return;
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      setDErr('Enter a valid amount.');
      return;
    }
    if (!dDue) {
      setDErr('Pick a due date.');
      return;
    }
    const isoDue = new Date(`${dDue}T12:00:00`).toISOString();
    addDebt({
      direction: dDir,
      counterparty: dWho.trim(),
      amount: amt,
      dueDate: isoDue,
      note: dNote.trim() || undefined,
    });
    setDebtOpen(false);
    setDWho('');
    setDAmount('');
    setDNote('');
    setDDue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setDDir('borrowed');
  }

  return (
    <motion.div initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} className="space-y-6 pb-10">
      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Savings</p>
        <h2 className="text-2xl font-extrabold font-headline tracking-tight">Planner</h2>
        <div className="wealth-glass rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Projected yearly (simulator)</p>
          <p className="mt-1 text-2xl font-headline font-bold text-primary">{formatMoney(yearlyProj, cc)}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-tertiary">
            <TrendingUp className="h-4 w-4" />
            <span>Based on your daily amount × 365</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Daily amount</p>
            <p className="mt-1 text-3xl font-extrabold text-primary">{formatMoney(dailyAmount, cc)}</p>
          </div>
          <p className="text-xs text-on-surface-variant">
            ≈ {formatMoney(dailyAmount * 30, cc)}
            <span className="block text-right">/ month</span>
          </p>
        </div>
        <input
          type="range"
          min={10}
          max={500}
          value={dailyAmount}
          onChange={(e) => setDailySavingsAmount(parseInt(e.target.value, 10))}
          className="mt-5 h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface-container-high accent-primary touch-manipulation"
        />
        <div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-widest text-outline">
          <span>Min {formatMoney(10, cc)}</span>
          <span>Max {formatMoney(500, cc)}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-headline font-bold">Goals progress</h3>
          <span className="text-sm font-bold text-on-surface-variant">{totals.pct}%</span>
        </div>
        <div className="mt-4 flex flex-col items-center">
          <div className="relative h-44 w-44">
            <svg className="h-full w-full -rotate-90">
              <circle className="text-surface-container-highest" cx="88" cy="88" fill="transparent" r="74" stroke="currentColor" strokeWidth="10" />
              <motion.circle
                cx="88"
                cy="88"
                fill="transparent"
                r="74"
                stroke="url(#sgrad)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 74}
                initial={{strokeDashoffset: 2 * Math.PI * 74}}
                animate={{strokeDashoffset: 2 * Math.PI * 74 * (1 - totals.pct / 100)}}
                transition={{duration: 0.8, ease: 'easeOut'}}
              />
              <defs>
                <linearGradient id="sgrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#adc6ff" />
                  <stop offset="100%" stopColor="#d0bcff" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold font-headline">{totals.pct}%</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Funded</span>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-on-surface-variant">
            Saved <span className="font-semibold text-on-surface">{formatMoney(totals.saved, cc)}</span> of{' '}
            <span className="font-semibold text-on-surface">{formatMoney(totals.target, cc)}</span> across goals
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Your goals</h3>
          <button
            type="button"
            onClick={() => setGoalOpen((v) => !v)}
            className="touch-manipulation inline-flex items-center gap-2 rounded-full bg-surface-container-high px-3 py-2 text-xs font-bold"
          >
            <PlusCircle className="h-4 w-4 text-primary" />
            Add goal
          </button>
        </div>

        {goalOpen && (
          <form onSubmit={submitGoal} className="glass-card space-y-3 rounded-2xl p-4">
            <input
              value={gLabel}
              onChange={(e) => setGLabel(e.target.value)}
              className={input}
              placeholder="Goal name (e.g. Emergency fund)"
            />
            <input
              inputMode="decimal"
              value={gTarget}
              onChange={(e) => setGTarget(e.target.value)}
              className={input}
              placeholder="Target amount"
            />
            {gErr && <p className="text-sm text-error">{gErr}</p>}
            <button type="submit" className="w-full rounded-full bg-gradient-to-br from-primary to-secondary py-3 text-sm font-bold text-slate-950 touch-manipulation">
              Save goal
            </button>
          </form>
        )}

        {goals.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No goals yet. Add one to track manual progress.</p>
        ) : (
          <div className="space-y-3">
            {goals.map((g) => {
              const p = g.targetAmount > 0 ? Math.round((g.savedAmount / g.targetAmount) * 100) : 0;
              return (
                <div key={g.id} className="glass-card rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-headline font-bold">{g.label}</p>
                      <p className="text-xs text-on-surface-variant">
                        {formatMoney(g.savedAmount, cc)} / {formatMoney(g.targetAmount, cc)} · {Math.min(100, p)}%
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSavingsGoal(g.id)}
                      className="touch-manipulation text-[11px] font-bold uppercase tracking-widest text-error/80"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                    <div className="h-full rounded-full bg-primary" style={{width: `${Math.min(100, p)}%`}} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setContrib({id: g.id, value: ''})}
                    className="mt-3 w-full rounded-full bg-surface-container-high py-2 text-xs font-bold touch-manipulation"
                  >
                    Log progress
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {contrib && (
        <form onSubmit={submitContrib} className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[55] mx-auto max-w-md rounded-2xl border border-white/10 bg-slate-950 p-4 shadow-xl">
          <p className="text-sm font-bold">Add to goal</p>
          <input
            inputMode="decimal"
            autoFocus
            value={contrib.value}
            onChange={(e) => setContrib({...contrib, value: e.target.value})}
            className={cn(input, 'mt-3')}
            placeholder="Amount"
          />
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setContrib(null)} className="flex-1 rounded-full bg-surface-container-high py-3 text-sm font-bold touch-manipulation">
              Cancel
            </button>
            <button type="submit" className="flex-1 rounded-full bg-gradient-to-br from-primary to-secondary py-3 text-sm font-bold text-slate-950 touch-manipulation">
              Apply
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Borrow & lend</h3>
          <button
            type="button"
            onClick={() => setDebtOpen((v) => !v)}
            className="touch-manipulation inline-flex items-center gap-2 rounded-full bg-surface-container-high px-3 py-2 text-xs font-bold"
          >
            <PlusCircle className="h-4 w-4 text-primary" />
            Add
          </button>
        </div>

        {debtOpen && (
          <form onSubmit={submitDebt} className="glass-card space-y-3 rounded-2xl p-4">
            <div className="grid grid-cols-2 gap-2">
              {([
                {id: 'borrowed', label: 'Borrowed'},
                {id: 'lent', label: 'Lent'},
              ] as const).map((x) => (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => setDDir(x.id)}
                  className={cn(
                    'touch-manipulation rounded-xl border px-3 py-2 text-xs font-bold transition-colors',
                    dDir === x.id
                      ? 'border-primary bg-primary/15 text-on-surface'
                      : 'border-outline-variant/30 bg-surface-container-high/40 text-on-surface-variant hover:border-outline-variant/60',
                  )}
                >
                  {x.label}
                </button>
              ))}
            </div>
            <input value={dWho} onChange={(e) => setDWho(e.target.value)} className={input} placeholder="Who? (name)" />
            <input inputMode="decimal" value={dAmount} onChange={(e) => setDAmount(e.target.value)} className={input} placeholder="Amount" />
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Due date</label>
              <input type="date" value={dDue} onChange={(e) => setDDue(e.target.value)} className={input} />
            </div>
            <input value={dNote} onChange={(e) => setDNote(e.target.value)} className={input} placeholder="Note (optional)" />
            {dErr && <p className="text-sm text-error">{dErr}</p>}
            <button type="submit" className="w-full rounded-full bg-gradient-to-br from-primary to-secondary py-3 text-sm font-bold text-slate-950 touch-manipulation">
              Save
            </button>
          </form>
        )}

        {openDebts.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No open loans. Add one to get due-date reminders.</p>
        ) : (
          <div className="space-y-3">
            {openDebts.map((d) => (
              <div key={d.id} className="glass-card rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-headline font-bold">
                      {d.direction === 'borrowed' ? 'Borrowed from' : 'Lent to'} {d.counterparty}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      Due {new Date(d.dueDate).toLocaleDateString()} · {formatMoney(d.amount, cc)}
                    </p>
                    {d.note && <p className="mt-1 text-xs text-on-surface-variant">{d.note}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => markDebtPaid(d.id)}
                      className="touch-manipulation inline-flex items-center gap-2 rounded-full bg-surface-container-high px-3 py-2 text-xs font-bold text-on-surface"
                    >
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Paid
                    </button>
                    <button
                      type="button"
                      onClick={() => removeDebt(d.id)}
                      className="touch-manipulation rounded-full bg-surface-container-high p-2 text-on-surface-variant hover:text-error"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

const input =
  'w-full rounded-xl bg-surface-container-high border border-outline-variant/30 px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40';
