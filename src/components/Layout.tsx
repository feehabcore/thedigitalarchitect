import * as React from 'react';
import {Search, Home, BarChart2, PlusCircle, Wallet, User} from 'lucide-react';
import {cn} from '@/src/lib/utils';
import type {Screen} from '@/src/types';
import {useApp} from '@/src/context/AppContext';

interface LayoutProps {
  children: React.ReactNode;
  currentScreen: Screen;
  onScreenChange: (screen: Screen) => void;
  addSheetOpen: boolean;
  onOpenAdd: () => void;
  onOpenSearch: () => void;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? '?';
  const b = parts.length > 1 ? parts[parts.length - 1]![0] : parts[0]?.[1];
  return (a + (b ?? '')).toUpperCase();
}

export default function Layout({
  children,
  currentScreen,
  onScreenChange,
  addSheetOpen,
  onOpenAdd,
  onOpenSearch,
}: LayoutProps) {
  const {profile} = useApp();
  const avatar = profile?.avatarDataUrl;

  return (
    <div className="min-h-dvh bg-background text-on-surface font-sans pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-40 border-b border-outline-variant/20 bg-background/90 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => onScreenChange('profile')}
              className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 text-sm font-bold text-on-surface ring-2 ring-primary/25 touch-manipulation"
            >
              {avatar ? (
                <img src={avatar} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                initials(profile?.name ?? '')
              )}
            </button>
            <div className="min-w-0 text-left">
              <p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">The Digital Architect</p>
              <p className="truncate text-sm font-semibold text-on-surface">{profile?.name ?? 'Money overview'}</p>
              {profile?.occupation ? (
                <p className="truncate text-[11px] text-on-surface-variant">{profile.occupation}</p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenSearch}
            className="touch-manipulation shrink-0 rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high active:scale-95"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 pt-5">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around rounded-t-3xl border border-outline-variant/20 bg-background/92 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
        <NavItem icon={Home} label="Home" active={currentScreen === 'home'} onClick={() => onScreenChange('home')} />
        <NavItem
          icon={BarChart2}
          label="Analytics"
          active={currentScreen === 'analytics' || currentScreen === 'transactions'}
          onClick={() => onScreenChange('analytics')}
        />
        <NavItem icon={PlusCircle} label="Add" active={addSheetOpen} onClick={onOpenAdd} isFab />
        <NavItem icon={Wallet} label="Savings" active={currentScreen === 'savings'} onClick={() => onScreenChange('savings')} />
        <NavItem icon={User} label="Profile" active={currentScreen === 'profile'} onClick={() => onScreenChange('profile')} />
      </nav>
    </div>
  );
}

function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
  isFab,
}: {
  icon: React.ComponentType<{className?: string}>;
  label: string;
  active: boolean;
  onClick: () => void;
  isFab?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center transition-all duration-200 touch-manipulation',
        isFab
          ? 'mb-1 -mt-6 rounded-full bg-gradient-to-br from-blue-300 to-purple-300 p-3.5 text-slate-950 shadow-lg shadow-primary/20 active:scale-95'
          : 'p-2 text-on-surface-variant active:scale-95',
        active && !isFab && 'text-primary',
      )}
    >
      <Icon className={cn('h-6 w-6', active && !isFab && 'text-primary')} />
      {!isFab && <span className="mt-0.5 text-[9px] font-bold uppercase tracking-widest">{label}</span>}
      {isFab && <span className="sr-only">{label}</span>}
    </button>
  );
}
