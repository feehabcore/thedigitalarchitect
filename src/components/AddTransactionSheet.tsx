import * as React from 'react';
import {Calendar, X} from 'lucide-react';
import {motion, AnimatePresence} from 'motion/react';
import {useApp} from '@/src/context/AppContext';
import {TRANSACTION_CATEGORIES} from '@/src/types';
import {cn} from '@/src/lib/utils';

export default function AddTransactionSheet({
  open,
  onClose,
  initialType,
}: {
  open: boolean;
  onClose: () => void;
  initialType?: 'income' | 'expense';
}) {
  const {addTransaction, profile} = useApp();
  const [type, setType] = React.useState<'income' | 'expense'>('expense');
  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState('Food');
  const [customCategory, setCustomCategory] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  /** Optional local time (HH:mm); combined with date when saving. */
  const [time, setTime] = React.useState('');
  const [err, setErr] = React.useState<string | null>(null);
  const dateRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) return;
    setErr(null);
    setTitle('');
    setAmount('');
    setDate(new Date().toISOString().slice(0, 10));
    setTime('');
    setType(initialType ?? 'expense');
    setCategory('Food');
    setCustomCategory('');
  }, [open, initialType]);

  React.useEffect(() => {
    if (type === 'income') setTime('');
  }, [type]);

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
    const cat = (() => {
      if (type === 'income') return 'Income';
      if (category === 'Other') return customCategory.trim() ? customCategory.trim() : 'Other';
      if (category === 'Income') return 'Other';
      return category;
    })();

    if (type === 'expense' && category === 'Other' && !customCategory.trim()) {
      setErr('Please enter a category name for “Other”.');
      return;
    }
    const t = type === 'expense' ? time.trim() : '';
    const iso =
      t && /^\d{2}:\d{2}$/.test(t)
        ? new Date(`${date}T${t}:00`).toISOString()
        : new Date(`${date}T12:00:00`).toISOString();
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

  function openDatePicker() {
    const el = dateRef.current;
    if (!el) return;
    // Mobile browsers / WebView: showPicker when available.
    try {
      (el as HTMLInputElement & {showPicker?: () => void}).showPicker?.();
    } catch {
      // ignore
    }
    // Fallbacks
    try {
      el.focus();
      el.click();
    } catch {
      // ignore
    }
  }

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
                    {category === 'Other' && (
                      <input
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className={cn(inputClass, 'mt-2')}
                        placeholder="Write your category (e.g. Gift, Repair, Education)"
                      />
                    )}
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
                  <div className="relative">
                    <input
                      ref={dateRef}
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={cn(
                        inputClass,
                        'pr-14',
                        '[&::-webkit-calendar-picker-indicator]:hidden',
                        '[&::-moz-calendar-picker-indicator]:hidden',
                      )}
                    />
                    <button
                      type="button"
                      onClick={openDatePicker}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-2.5 text-on-surface-variant hover:bg-surface-container-high touch-manipulation"
                      aria-label="Pick date"
                    >
                      <Calendar className="h-6 w-6" />
                    </button>
                  </div>
                </div>
                {type === 'expense' && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                      Time of expense{' '}
                      <span className="font-normal normal-case text-on-surface-variant/80">(optional)</span>
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className={inputClass}
                    />
                    <p className="text-[11px] text-on-surface-variant">
                      Add if you know when you paid; leave blank to use midday for ordering in the list.
                    </p>
                  </div>
                )}
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
