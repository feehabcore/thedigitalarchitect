import * as React from 'react';
import {Search, X} from 'lucide-react';
import {motion, AnimatePresence} from 'motion/react';
import {useApp} from '@/src/context/AppContext';
import {formatMoney} from '@/src/lib/currencies';
import {categoryMeta} from '@/src/types';
import {cn} from '@/src/lib/utils';

export default function GlobalSearchSheet({
  open,
  onClose,
  onSelectTransaction,
}: {
  open: boolean;
  onClose: () => void;
  onSelectTransaction: (id: string) => void;
}) {
  const {profile, transactions, savings} = useApp();
  const cc = profile!.currencyCode;
  const [q, setQ] = React.useState('');

  React.useEffect(() => {
    if (!open) setQ('');
  }, [open]);

  const needle = q.trim().toLowerCase();
  const txHits = React.useMemo(() => {
    if (!needle) return transactions.slice(0, 25);
    return transactions
      .filter(
        (t) =>
          t.title.toLowerCase().includes(needle) ||
          t.category.toLowerCase().includes(needle) ||
          categoryMeta(t.category).label.toLowerCase().includes(needle),
      )
      .slice(0, 40);
  }, [transactions, needle]);

  const profileHit =
    needle &&
    (profile!.name.toLowerCase().includes(needle) || profile!.occupation.toLowerCase().includes(needle));
  const goalHits = React.useMemo(() => {
    if (!needle) return [];
    return savings.goals.filter((g) => g.label.toLowerCase().includes(needle)).slice(0, 8);
  }, [savings.goals, needle]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close search"
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="fixed inset-0 z-[80] bg-black/50 touch-manipulation"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            initial={{y: '-6%', opacity: 0}}
            animate={{y: 0, opacity: 1}}
            exit={{y: '-6%', opacity: 0}}
            transition={{type: 'spring', damping: 26, stiffness: 320}}
            className="fixed left-0 right-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[90] mx-auto max-w-md px-3"
          >
            <div className="overflow-hidden rounded-2xl border border-outline-variant/25 bg-surface-container shadow-2xl">
              <div className="flex items-center gap-2 border-b border-outline-variant/20 px-3 py-2">
                <Search className="h-5 w-5 shrink-0 text-outline" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search transactions, goals, profile…"
                  className="min-w-0 flex-1 bg-transparent py-2 text-sm text-on-surface outline-none placeholder:text-outline"
                />
                <button
                  type="button"
                  onClick={onClose}
                  className="touch-manipulation rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="max-h-[min(70dvh,520px)] overflow-y-auto p-2">
                {!needle && (
                  <p className="px-2 py-3 text-sm text-on-surface-variant">Type to search, or browse recent entries below.</p>
                )}

                {profileHit && (
                  <div className="mb-3 rounded-xl bg-surface-container-high/60 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Profile</p>
                    <p className="font-semibold text-on-surface">{profile!.name}</p>
                    <p className="text-xs text-on-surface-variant">{profile!.occupation}</p>
                  </div>
                )}

                {goalHits.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Savings goals</p>
                    <div className="space-y-1">
                      {goalHits.map((g) => (
                        <div key={g.id} className="rounded-xl px-3 py-2 text-sm text-on-surface-variant">
                          <span className="font-semibold text-on-surface">{g.label}</span>
                          <span className="text-xs"> · target {formatMoney(g.targetAmount, cc)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Transactions</p>
                {txHits.length === 0 ? (
                  <p className="px-2 py-4 text-sm text-on-surface-variant">{needle ? 'No matches.' : 'No transactions yet.'}</p>
                ) : (
                  <ul className="space-y-1">
                    {txHits.map((t) => (
                      <li key={t.id}>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectTransaction(t.id);
                            onClose();
                          }}
                          className="flex w-full touch-manipulation items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface-container-high/80"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-on-surface">{t.title}</p>
                            <p className="truncate text-xs text-on-surface-variant">
                              {categoryMeta(t.category).label} · {new Date(t.date).toLocaleDateString()}
                            </p>
                          </div>
                          <span
                            className={cn(
                              'shrink-0 text-sm font-bold',
                              t.type === 'income' ? 'text-emerald-500' : 'text-on-surface',
                            )}
                          >
                            {t.type === 'income' ? '+' : '−'}
                            {formatMoney(t.amount, cc)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
