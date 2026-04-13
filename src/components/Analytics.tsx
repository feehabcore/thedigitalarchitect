import * as React from 'react';
import {Fragment} from 'react';
import {FileDown} from 'lucide-react';
import {motion} from 'motion/react';
import {ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell, PieChart, Pie} from 'recharts';
import {cn} from '@/src/lib/utils';
import {useApp} from '@/src/context/AppContext';
import {formatMoney} from '@/src/lib/currencies';
import {categoryMeta} from '@/src/types';
import {categoryTotalsForMonth, flowThisMonth, spendingByDayThisMonth, sumExpense} from '@/src/lib/stats';

const COLORS = ['#adc6ff', '#d0bcff', '#a482c8', '#4d8eff', '#8c909f', '#424754', '#dbb8ff'];

export default function Analytics() {
  const {profile, transactions} = useApp();
  const cc = profile!.currencyCode;
  const now = new Date();
  const {expense} = flowThisMonth(transactions, now);
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevExpense = flowThisMonth(transactions, prev).expense;
  const delta =
    prevExpense > 0 ? Math.round(((expense - prevExpense) / prevExpense) * 1000) / 10 : expense > 0 ? 100 : 0;

  const dayData = React.useMemo(
    () =>
      spendingByDayThisMonth(transactions, now).map((d) => ({
        day: d.day,
        amount: Math.round(d.amount),
      })),
    [transactions, now],
  );

  const cats = categoryTotalsForMonth(transactions, now);
  const totalCat = cats.reduce((s, c) => s + c.amount, 0) || 1;
  const pieRows = cats.slice(0, 6).map((c, i) => ({
    name: c.name,
    value: c.amount,
    color: COLORS[i % COLORS.length]!,
    pct: Math.round((c.amount / totalCat) * 100),
  }));
  const topCategories = cats.slice(0, 4).map((c) => {
    const meta = categoryMeta(c.name);
    return {
      name: meta.label,
      amount: formatMoney(c.amount, cc),
      percentage: Math.round((c.amount / totalCat) * 100),
      icon: meta.icon,
      color: 'bg-primary',
    };
  });

  const maxDay = Math.max(1, ...dayData.map((d: {amount: number}) => d.amount));

  return (
    <motion.div initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} className="space-y-8 pb-10">
      <section className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Insights</p>
        <h1 className="text-2xl font-extrabold font-headline tracking-tight text-on-surface">
          {now.toLocaleString('default', {month: 'long'})} <span className="text-primary">spending</span>
        </h1>
        <div className="glass-card rim-light rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Total expenses (this month)</p>
          <p className="mt-1 text-2xl font-headline font-bold text-primary">{formatMoney(expense, cc)}</p>
          <p className={cn('mt-2 flex items-center gap-2 text-xs', delta > 0 ? 'text-error' : 'text-primary')}>
            <span>
              {delta > 0 ? '+' : ''}
              {delta}% vs last month
            </span>
          </p>
        </div>
      </section>

      <div className="glass-card rim-light rounded-2xl p-4">
        <h2 className="mb-4 text-base font-headline font-bold">Daily expenses (this month)</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dayData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#c2c6d6', fontSize: 10}} dy={8} />
              <Tooltip
                cursor={{fill: 'rgba(173, 198, 255, 0.05)'}}
                contentStyle={{backgroundColor: '#171f33', border: 'none', borderRadius: '8px', color: '#dae2fd'}}
                formatter={(v: number) => formatMoney(v, cc)}
              />
              <Bar dataKey="amount" radius={[10, 10, 0, 0]}>
                {dayData.map((entry: {amount: number}, index: number) => (
                  <Cell key={`c-${index}`} fill={entry.amount === maxDay && entry.amount > 0 ? '#adc6ff' : '#2d3449'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card rim-light rounded-2xl p-4">
        <h2 className="mb-4 text-base font-headline font-bold">Category mix</h2>
        {pieRows.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Add expenses to see how categories compare.</p>
        ) : (
          <div className="relative flex flex-col items-center">
            <div className="h-52 w-full max-w-xs">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{backgroundColor: '#171f33', border: 'none', borderRadius: '8px', color: '#dae2fd'}}
                    formatter={(v: number) => formatMoney(v, cc)}
                  />
                  <Pie data={pieRows} cx="50%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={4} dataKey="value" stroke="none">
                    {pieRows.map((entry, index) => (
                      <Cell key={`p-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-2xl bg-background/30 px-4 py-2 text-center backdrop-blur-sm ring-1 ring-white/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant leading-tight">This month</p>
                <p className="mt-0.5 text-lg font-headline font-bold leading-tight">{formatMoney(expense, cc)}</p>
              </div>
            </div>
            <div className="mt-4 grid w-full max-w-sm grid-cols-2 gap-2 text-xs">
              {pieRows.map((r) => (
                <div key={r.name} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{background: r.color}} />
                  <span className="truncate text-on-surface-variant">
                    {r.name}: <span className="font-bold text-on-surface">{r.pct}%</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="glass-card rim-light rounded-2xl p-4">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="text-lg font-headline font-bold">Top categories</h2>
        </div>
        {topCategories.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No category data for this month yet.</p>
        ) : (
          <div className="space-y-6">
            {topCategories.map((cat, i) => (
              <Fragment key={`${cat.name}-${i}`}>
                <CategoryItem name={cat.name} amount={cat.amount} percentage={cat.percentage} icon={cat.icon} color={cat.color} />
              </Fragment>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/5 bg-surface-container-low p-4 space-y-3">
        <p className="text-sm text-on-surface-variant leading-relaxed">
          All charts use your logged transactions in <span className="font-semibold text-on-surface">{cc}</span>. Lifetime
          expenses: <span className="font-semibold text-on-surface">{formatMoney(sumExpense(transactions), cc)}</span>.
        </p>
        <button
          type="button"
          onClick={() =>
            void import('@/src/lib/statementPdf').then(({downloadTransactionStatementPdf}) =>
              downloadTransactionStatementPdf(profile!, transactions, 'this_month'),
            )
          }
          className="inline-flex w-full touch-manipulation items-center justify-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-high/50 py-2.5 text-sm font-bold text-on-surface"
        >
          <FileDown className="h-4 w-4 text-primary" />
          Download PDF statement (this month)
        </button>
      </div>
    </motion.div>
  );
}

function CategoryItem({
  name,
  amount,
  percentage,
  icon: Icon,
  color,
}: {
  name: string;
  amount: string;
  percentage: number;
  icon: React.ComponentType<{className?: string}>;
  color: string;
}) {
  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-highest">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <span className="truncate text-sm font-bold font-headline">{name}</span>
        </div>
        <div className="shrink-0 text-right">
          <span className="block text-base font-headline font-bold">{amount}</span>
          <span className="text-[10px] font-bold uppercase text-on-surface-variant">{percentage}% of month</span>
        </div>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-surface-container-highest">
        <motion.div
          initial={{width: 0}}
          animate={{width: `${percentage}%`}}
          transition={{duration: 0.6, ease: 'easeOut'}}
          className={cn('h-full rounded-full', color)}
        />
      </div>
    </div>
  );
}
