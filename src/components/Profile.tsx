import * as React from 'react';
import {Banknote, Bell, Camera, ChevronRight, List, LogOut, Monitor, Moon, ShieldCheck, Sun, User, Wallet} from 'lucide-react';
import {motion} from 'motion/react';
import {cn} from '@/src/lib/utils';
import {useApp} from '@/src/context/AppContext';
import {COUNTRIES, formatMoney} from '@/src/lib/currencies';
import {netBalance} from '@/src/lib/stats';
import type {ThemePreference} from '@/src/types';
import {fileToAvatarDataUrl} from '@/src/lib/image';

export default function Profile({onOpenTransactions}: {onOpenTransactions: () => void}) {
  const {profile, transactions, updateProfile, resetAccount, themePreference, setThemePreference} = useApp();
  const p = profile!;
  const cc = p.currencyCode;
  const balance = netBalance(transactions);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [photoErr, setPhotoErr] = React.useState<string | null>(null);

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoErr(null);
    if (!file.type.startsWith('image/')) {
      setPhotoErr('Choose an image file.');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setPhotoErr('Image too large (max 12MB).');
      return;
    }
    try {
      const url = await fileToAvatarDataUrl(file);
      updateProfile({avatarDataUrl: url});
    } catch {
      setPhotoErr('Could not process that image.');
    }
  }

  return (
    <motion.div initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} className="mx-auto max-w-md space-y-8 pb-10">
      <section className="space-y-4 rounded-2xl border border-outline-variant/15 bg-surface-container-low p-5">
        <div className="flex items-start gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-surface-container-high ring-2 ring-primary/25">
            {p.avatarDataUrl ? (
              <img src={p.avatarDataUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-bold text-on-surface-variant">
                <User className="h-10 w-10 opacity-50" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex touch-manipulation items-center gap-2 rounded-full bg-surface-container-high px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-surface"
            >
              <Camera className="h-4 w-4" />
              Update photo
            </button>
            {p.avatarDataUrl && (
              <button
                type="button"
                onClick={() => updateProfile({avatarDataUrl: null})}
                className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant touch-manipulation"
              >
                Remove photo
              </button>
            )}
            {photoErr && <p className="text-xs text-error">{photoErr}</p>}
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 shrink-0 text-primary" />
            <h2 className="truncate text-2xl font-bold font-headline tracking-tight">{p.name}</h2>
          </div>
          <p className="mt-1 text-sm text-on-surface-variant">{p.occupation}</p>
          <p className="mt-3 text-xs text-on-surface-variant">
            {COUNTRIES.find((c) => c.code === p.countryCode)?.name ?? 'Unknown'} · Salary{' '}
            <span className="font-semibold text-on-surface">{formatMoney(p.monthlySalary, cc)}</span> / month
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-surface-container-highest/40 p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Net (entries)</p>
            <p className="mt-1 font-headline text-lg font-bold text-primary">{formatMoney(balance, cc)}</p>
          </div>
          <div className="rounded-xl bg-surface-container-highest/40 p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Savings target</p>
            <p className="mt-1 font-headline text-lg font-bold text-tertiary">{formatMoney(p.monthlySavingsTarget, cc)}</p>
            <p className="text-[10px] text-on-surface-variant">/ month</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="px-1 text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Preferences</h3>
        <div className="divide-y divide-outline-variant/15 overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-low">
          <button
            type="button"
            onClick={onOpenTransactions}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-surface-container-high/60 touch-manipulation"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-container-highest text-primary">
                <List className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-on-surface">Transaction log</p>
                <p className="text-sm text-on-surface-variant">Search, filter, delete</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-on-surface-variant" />
          </button>

          <div className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-container-highest text-primary">
                <Banknote className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-on-surface">Country & currency</p>
                <p className="text-sm text-on-surface-variant">We format money using your country’s currency code.</p>
                <select
                  value={p.countryCode}
                  onChange={(e) => updateProfile({countryCode: e.target.value})}
                  className="mt-3 w-full rounded-xl bg-surface-container-highest px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.currencyCode})
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs font-semibold text-primary">Active: {cc}</p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-container-highest text-primary">
                <Moon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <p className="font-semibold text-on-surface">Appearance</p>
                  <p className="text-sm text-on-surface-variant">Light, dark, or match your phone settings.</p>
                </div>
                <ThemeSegment value={themePreference} onChange={setThemePreference} />
              </div>
            </div>
          </div>

          <SettingsRow icon={Bell} title="Notifications" subtitle="Coming soon" right={<ChevronRight className="h-5 w-5 text-on-surface-variant" />} />
          <SettingsRow icon={ShieldCheck} title="Security" subtitle="On-device only (local storage)" right={<ChevronRight className="h-5 w-5 text-on-surface-variant" />} />
        </div>
      </section>

      <section className="rounded-2xl border border-primary/15 bg-surface-container-low p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary shadow-lg">
            <Wallet className="h-6 w-6 text-slate-950" />
          </div>
          <div>
            <h3 className="font-headline font-bold">Privacy</h3>
            <p className="text-sm text-on-surface-variant">Your profile and transactions stay on this device in your browser.</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-error/15 bg-error-container/10 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-error-container/20 text-error">
              <LogOut className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-on-surface">Reset onboarding</p>
              <p className="text-sm text-on-surface-variant">Clears profile, transactions, and savings goals on this device.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset all local data for this app?')) resetAccount();
            }}
            className="touch-manipulation rounded-full bg-error px-6 py-3 text-sm font-bold text-white"
          >
            Reset
          </button>
        </div>
      </section>
    </motion.div>
  );
}

function ThemeSegment({value, onChange}: {value: ThemePreference; onChange: (t: ThemePreference) => void}) {
  const items: {id: ThemePreference; label: string; icon: React.ComponentType<{className?: string}>}[] = [
    {id: 'light', label: 'Light', icon: Sun},
    {id: 'dark', label: 'Dark', icon: Moon},
    {id: 'system', label: 'Device', icon: Monitor},
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map(({id, label, icon: Icon}) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            'flex touch-manipulation flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-[11px] font-bold transition-colors',
            value === id
              ? 'border-primary bg-primary/15 text-on-surface'
              : 'border-outline-variant/30 bg-surface-container-high/40 text-on-surface-variant hover:border-outline-variant/60',
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}

function SettingsRow({
  icon: Icon,
  title,
  subtitle,
  right,
}: {
  icon: React.ComponentType<{className?: string}>;
  title: string;
  subtitle: string;
  right: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-4 hover:bg-surface-container-high/40">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-container-highest text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-on-surface">{title}</p>
          <p className="text-sm text-on-surface-variant">{subtitle}</p>
        </div>
      </div>
      <div className="shrink-0">{right}</div>
    </div>
  );
}
