import * as React from 'react';
import {X} from 'lucide-react';
import {motion, AnimatePresence} from 'motion/react';
import {useApp} from '@/src/context/AppContext';
import {TRANSACTION_CATEGORIES} from '@/src/types';
import {cn} from '@/src/lib/utils';

export default function AddTransactionSheet({open, onClose}: {open: boolean; onClose: () => void}) {
  const {addTransaction, profile} = useApp();
  const [type, setType] = React.useState<'income' | 'expense'>('expense');
  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState('Food');
  const [amount, setAmount] = React.useState('');
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setErr(null);
    setTitle('');
    setAmount('');
    setDate(new Date().toISOString().slice(0, 10));
    setType('expense');
    setCategory('Food');
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!title.trim()) {
      setErr('Add a short title.');
      return;
    }
    const n = parseFloat(amount.replace(/,/g, ''));
    if (!Number.isFinite(n) || n <= 0) {
      setErr('Enter a valid amount.');
      return;
    }
    const cat =
      type === 'income'
        ? 'Income'
        : category === 'Income'
          ? 'Other'
          : category;
    const iso = new Date(`${date}T12:00:00`).toISOString();
    addTransaction({
      title: title.trim(),
      category: cat,
      amount: n,
      date: iso,
      type,
    });
    onClose();
  }

  const expenseCats = TRANSACTION_CATEGORIES.filter((c) => c.id !== 'Income');

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close"
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="fixed inset-0 z-[60] bg-black/60 touch-manipulation"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-tx-title"
            initial={{y: '100%'}}
            animate={{y: 0}}
            exit={{y: '100%'}}
            transition={{type: 'spring', damping: 28, stiffness: 320}}
            className="fixed inset-x-0 bottom-0 z-[70] max-h-[min(92dvh,640px)] overflow-y-auto rounded-t-3xl bg-surface-container border-t border-outline-variant/30 px-4 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl"
          >
            <div className="mx-auto max-w-md space-y-4">
              <div className="flex items-center justify-between">
                <h2 id="add-tx-title" className="text-lg font-headline font-bold">
                  New entry
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-full bg-surface-container-high text-on-surface-variant touch-manipulation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-on-surface-variant">
                Logged in {profile?.currencyCode ?? 'BDT'}. This updates your analytics and home totals.
              </p>

              <div className="flex rounded-full bg-surface-container-high p-1">
                {(['expense', 'income'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      'flex-1 py-2 rounded-full text-sm font-bold capitalize transition-all touch-manipulation',
                      type === t ? 'bg-gradient-to-br from-primary to-secondary text-slate-950' : 'text-on-surface-variant',
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <form onSubmit={submit} className="space-y-4 pb-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={inputClass}
                    placeholder={type === 'income' ? 'Salary, freelance…' : 'Groceries, rent…'}
                  />
                </div>
                {type === 'expense' && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                      Category
                    </label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className={cn(inputClass, 'appearance-none')}>
                      {expenseCats.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Amount</label>
                  <input
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={inputClass}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
                </div>
                {err && <p className="text-sm text-error">{err}</p>}
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-full bg-gradient-to-br from-primary to-secondary text-slate-950 font-bold text-sm touch-manipulation active:scale-[0.99] transition-transform"
                >
                  Save
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const inputClass =
  'w-full rounded-xl bg-surface-container-high border border-outline-variant/30 px-4 py-3 text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary/40';
