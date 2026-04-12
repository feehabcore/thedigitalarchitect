import * as React from 'react';
import {Camera, X} from 'lucide-react';
import {motion} from 'motion/react';
import {COUNTRIES, currencyForCountry, formatMoney} from '@/src/lib/currencies';
import {useApp} from '@/src/context/AppContext';
import {cn} from '@/src/lib/utils';
import {fileToAvatarDataUrl} from '@/src/lib/image';

export default function Onboarding() {
  const {completeOnboarding} = useApp();
  const [name, setName] = React.useState('');
  const [occupation, setOccupation] = React.useState('');
  const [salary, setSalary] = React.useState('');
  const [countryCode, setCountryCode] = React.useState('BD');
  const [savingsTarget, setSavingsTarget] = React.useState('');
  const [avatarDataUrl, setAvatarDataUrl] = React.useState<string | null>(null);
  const [avatarErr, setAvatarErr] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
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

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!name.trim()) {
      setErr('Please enter your full name.');
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
    completeOnboarding({
      name: name.trim(),
      occupation: occupation.trim(),
      monthlySalary: salaryNum,
      countryCode,
      monthlySavingsTarget: savingsNum,
      avatarDataUrl,
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
                {avatarDataUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarDataUrl(null)}
                    className="inline-flex touch-manipulation items-center gap-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove
                  </button>
                )}
                <p className="text-[11px] text-on-surface-variant">Optional. Photos stay on this device.</p>
                {avatarErr && <p className="text-xs text-error">{avatarErr}</p>}
              </div>
            </div>
          </div>

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

          {err && <p className="text-sm text-error">{err}</p>}

          <button
            type="submit"
            className="w-full py-3.5 rounded-full bg-gradient-to-br from-primary to-secondary text-slate-900 font-bold text-sm active:scale-[0.98] transition-transform touch-manipulation"
          >
            Continue to app
          </button>
        </form>
      </motion.div>
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
