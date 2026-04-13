import * as React from 'react';
import {Camera} from 'lucide-react';
import {motion} from 'motion/react';
import {COUNTRIES, currencyForCountry, formatMoney} from '@/src/lib/currencies';
import {useApp, type OnboardingInput} from '@/src/context/AppContext';
import {cn} from '@/src/lib/utils';
import {fileToAvatarDataUrl} from '@/src/lib/image';
import {DEFAULT_NOTIFICATION_PREFS} from '@/src/types';

type NotifyGatePayload = {
  input: OnboardingInput;
  budgetAlert: boolean;
  budgetPercent: number;
};

export default function Onboarding() {
  const {completeOnboarding, setThemePreference, setNotificationPrefs, requestSystemNotificationPermission} = useApp();
  const [name, setName] = React.useState('');
  const [nickname, setNickname] = React.useState('');
  const [gender, setGender] = React.useState<'male' | 'female' | null>(null);
  const [occupation, setOccupation] = React.useState('');
  const [salary, setSalary] = React.useState('');
  const [countryCode, setCountryCode] = React.useState('BD');
  const [savingsTarget, setSavingsTarget] = React.useState('');
  const [avatarDataUrl, setAvatarDataUrl] = React.useState<string | null>(null);
  const [avatarErr, setAvatarErr] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [budgetAlert, setBudgetAlert] = React.useState(DEFAULT_NOTIFICATION_PREFS.budgetAlert);
  const [budgetPercent, setBudgetPercent] = React.useState(DEFAULT_NOTIFICATION_PREFS.budgetPercentOfSalary);
  const [notifyGate, setNotifyGate] = React.useState<NotifyGatePayload | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const salaryNum = parseFloat(salary.replace(/,/g, '')) || 0;
  const currencyCode = currencyForCountry(countryCode);
  const savingsNum = savingsTarget.trim() === '' ? undefined : parseFloat(savingsTarget.replace(/,/g, ''));

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarErr(null);
    if (!file.type.startsWith('image/')) {
      setAvatarErr('Please choose an image file.');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setAvatarErr('Image is too large (max 12MB).');
      return;
    }
    try {
      const url = await fileToAvatarDataUrl(file);
      setAvatarDataUrl(url);
    } catch {
      setAvatarErr('Could not process that image. Try another photo.');
    }
  }

  function applyNotificationPrefs(g: NotifyGatePayload, browserPush: boolean) {
    setNotificationPrefs({
      budgetAlert: g.budgetAlert,
      budgetPercentOfSalary: g.budgetPercent,
      weeklySavingsAlert: DEFAULT_NOTIFICATION_PREFS.weeklySavingsAlert,
      monthlyStatementAlert: DEFAULT_NOTIFICATION_PREFS.monthlyStatementAlert,
      browserPush,
    });
  }

  function finishWithoutSystemPermission(g: NotifyGatePayload) {
    setNotifyGate(null);
    completeOnboarding(g.input);
    setThemePreference('system');
    applyNotificationPrefs(g, false);
  }

  async function finishWithSystemPermission(g: NotifyGatePayload) {
    setBusy(true);
    try {
      const r = await requestSystemNotificationPermission();
      setNotifyGate(null);
      completeOnboarding(g.input);
      setThemePreference('system');
      applyNotificationPrefs(g, r === 'granted');
      if (r === 'denied') {
        window.alert('Notifications are off. You can turn them on later in Profile or device settings.');
      } else if (r === 'unsupported') {
        window.alert('Notifications are not available in this browser. In-app alerts still work.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!name.trim()) {
      setErr('Please enter your full name.');
      return;
    }
    if (!nickname.trim()) {
      setErr('Please enter a nickname (used with sir / mam in your greeting).');
      return;
    }
    if (!avatarDataUrl) {
      setErr('Please add a profile photo.');
      return;
    }
    if (gender == null) {
      setErr('Please select how you\'d like to be addressed (Female / Male).');
      return;
    }
    if (!occupation.trim()) {
      setErr('Please enter your occupation.');
      return;
    }
    if (!Number.isFinite(salaryNum) || salaryNum <= 0) {
      setErr('Enter a valid monthly salary.');
      return;
    }
    if (savingsNum != null && (savingsNum < 0 || !Number.isFinite(savingsNum))) {
      setErr('Savings target must be a positive number.');
      return;
    }
    setNotifyGate({
      input: {
        name: name.trim(),
        nickname: nickname.trim(),
        occupation: occupation.trim(),
        monthlySalary: salaryNum,
        countryCode,
        gender,
        monthlySavingsTarget: savingsNum,
        avatarDataUrl,
      },
      budgetAlert,
      budgetPercent,
    });
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-start pt-[max(1.5rem,env(safe-area-inset-top))] px-4 pb-10">
      <motion.div
        initial={{opacity: 0, y: 16}}
        animate={{opacity: 1, y: 0}}
        className="w-full max-w-md space-y-8"
      >
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">The Digital Architect</p>
          <h1 className="text-2xl font-extrabold font-headline text-on-surface">Set up your account</h1>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Defaults use Bangladesh Taka (BDT). We pick your display currency from your country—you can change country
            later in profile.
          </p>
        </header>

        <form onSubmit={submit} className="space-y-5 glass-card rounded-2xl p-6 border border-outline-variant/20">
          <Field label="Full name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="Your full name"
              autoComplete="name"
              enterKeyHint="next"
            />
          </Field>
          <Field label="Nickname">
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className={inputClass}
              placeholder="your nickname"
              autoComplete="nickname"
              enterKeyHint="next"
            />
          </Field>
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Profile photo</p>
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-surface-container-high ring-2 ring-primary/25">
                {avatarDataUrl ? (
                  <img src={avatarDataUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-on-surface-variant">
                    <Camera className="h-8 w-8 opacity-60" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full touch-manipulation rounded-full bg-surface-container-high px-4 py-2.5 text-sm font-bold text-on-surface"
                >
                  {avatarDataUrl ? 'Change photo' : 'Add photo'}
                </button>
                <p className="text-[11px] text-on-surface-variant">Required. Stays on this device.</p>
                {avatarErr && <p className="text-xs text-error">{avatarErr}</p>}
              </div>
            </div>
          </div>
          <Field label="Addressed as">
            <div className="grid grid-cols-2 gap-2">
              {([
                {id: 'female' as const, label: 'Female'},
                {id: 'male' as const, label: 'Male'},
              ]).map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGender(g.id)}
                  className={cn(
                    'flex touch-manipulation items-center justify-center rounded-xl border px-3 py-3 text-sm font-bold transition-colors',
                    gender === g.id
                      ? 'border-primary bg-primary/15 text-on-surface'
                      : 'border-outline-variant/30 bg-surface-container-high/40 text-on-surface-variant hover:border-outline-variant/60',
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Occupation">
            <input
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              className={inputClass}
              placeholder="e.g. Software engineer"
              autoComplete="organization-title"
            />
          </Field>
          <Field label="Monthly salary (gross)">
            <input
              inputMode="decimal"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className={inputClass}
              placeholder="0"
            />
            <p className="text-[11px] text-on-surface-variant mt-1.5">
              Shown in {currencyCode}. Example: {formatMoney(85000, currencyCode)}
            </p>
          </Field>
          <Field label="Country / region">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className={cn(inputClass, 'appearance-none')}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-primary font-semibold mt-1.5">
              Currency: {currencyCode} — amounts will format with this code.
            </p>
          </Field>
          <Field label="Monthly savings target (optional)">
            <input
              inputMode="decimal"
              value={savingsTarget}
              onChange={(e) => setSavingsTarget(e.target.value)}
              className={inputClass}
              placeholder="Leave blank for ~15% of salary"
            />
          </Field>

          <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-highest/30 p-4 space-y-4 pt-2">
            <label className="flex cursor-pointer items-center justify-between gap-3 touch-manipulation">
              <span className="text-sm font-medium text-on-surface">Budget alert</span>
              <input
                type="checkbox"
                className="h-5 w-5 accent-primary"
                checked={budgetAlert}
                onChange={(e) => setBudgetAlert(e.target.checked)}
              />
            </label>

            <div className={cn('space-y-2', !budgetAlert && 'opacity-60')}>
              <div className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                <span>Budget threshold</span>
                <span className="text-primary">{budgetPercent}% of salary</span>
              </div>
              <input
                type="range"
                min={50}
                max={150}
                step={5}
                disabled={!budgetAlert}
                value={budgetPercent}
                onChange={(e) => setBudgetPercent(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>

          {err && <p className="text-sm text-error">{err}</p>}

          <button
            type="submit"
            disabled={!!notifyGate || busy}
            className={cn(
              'w-full py-3.5 rounded-full bg-gradient-to-br from-primary to-secondary text-slate-900 font-bold text-sm active:scale-[0.98] transition-transform touch-manipulation',
              (notifyGate || busy) && 'opacity-70 cursor-not-allowed',
            )}
          >
            Continue to app
          </button>
        </form>
      </motion.div>

      {notifyGate && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4">
          <div className="absolute inset-0 bg-black/60" aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboard-notify-title"
            className="relative w-full max-w-md rounded-2xl border border-outline-variant/20 bg-surface-container p-5 shadow-2xl"
          >
            <h2 id="onboard-notify-title" className="text-lg font-headline font-bold text-on-surface">
              Stay in the loop?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              Allow notifications so we can alert you on this device when spending nears your budget limit. You can change
              this anytime in Profile.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
              <button
                type="button"
                disabled={busy}
                onClick={() => void finishWithSystemPermission(notifyGate)}
                className={cn(
                  'w-full rounded-full bg-gradient-to-br from-primary to-secondary py-3 text-sm font-bold text-slate-900 touch-manipulation active:scale-[0.99] transition-transform',
                  busy && 'opacity-70 cursor-not-allowed',
                )}
              >
                {busy ? 'Please wait…' : 'Allow notifications'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => finishWithoutSystemPermission(notifyGate)}
                className="w-full rounded-full bg-surface-container-high py-3 text-sm font-bold text-on-surface touch-manipulation"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full rounded-xl bg-surface-container-high border border-outline-variant/30 px-4 py-3 text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-outline';
