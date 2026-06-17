import { CircleDollarSign, Dumbbell, LayoutDashboard, Shield, Trophy, UserRoundCog } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import type { Participant } from '../api/types';
import type { SelectedIdentity } from '../state/useSelectedIdentity';

export type AppTab = 'dashboard' | 'ranking' | 'checkin' | 'token' | 'admin';

interface AppShellProps {
  activeTab: AppTab;
  identity: SelectedIdentity;
  isAdmin: boolean;
  participant: Participant | null;
  challengeName?: string | null;
  loading?: boolean;
  error?: string | null;
  children: ReactNode;
  onTabChange: (tab: AppTab) => void;
  onChangeIdentity: () => void;
}

const playerNavItems: Array<{ tab: AppTab; label: string; icon: ReactNode }> = [
  { tab: 'dashboard', label: 'Panel', icon: <LayoutDashboard /> },
  { tab: 'ranking', label: 'Ranking', icon: <Trophy /> },
  { tab: 'checkin', label: 'Check-in', icon: <Dumbbell /> }
];

export function AppShell({
  activeTab,
  identity,
  isAdmin,
  participant,
  challengeName,
  loading = false,
  error = null,
  children,
  onTabChange,
  onChangeIdentity
}: AppShellProps) {
  const [isCompact, setIsCompact] = useState(false);
  const navItems = isAdmin
    ? [...playerNavItems, { tab: 'token' as const, label: 'Coins', icon: <CircleDollarSign /> }, { tab: 'admin' as const, label: 'Admin', icon: <Shield /> }]
    : playerNavItems;
  const participantName = participant?.displayName ?? 'Sin jugador';
  const headerTitle = isCompact && participant ? `Proyecto RM - ${participant.displayName}` : 'Proyecto RM';
  const headerClassName = `app-header${isCompact ? ' app-header--compact' : ''}`;

  useEffect(() => {
    function onScroll() {
      setIsCompact((current) => (current ? window.scrollY > 8 : window.scrollY > 56));
    }

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="app-shell">
      <header className={headerClassName}>
        <span className="app-header__brand-mark" aria-hidden="true">
          <Dumbbell />
        </span>
        <div className="app-header__content">
          <div className="app-header__title-row">
            {identity.mode === 'admin' && !isCompact ? <span className="eyebrow app-header__mode">Admin mode</span> : null}
            <h1>{headerTitle}</h1>
            {isCompact && identity.mode === 'admin' ? <span className="app-header__meta-pill app-header__meta-pill--admin">Admin</span> : null}
          </div>
          {!isCompact ? (
            <p className="app-header__subtitle">
              {participant ? `${participantName} · ${challengeName ?? 'Reto septiembre 2026'}` : 'Sin jugador'}
            </p>
          ) : null}
        </div>
        <button className="icon-button" type="button" onClick={onChangeIdentity} aria-label="Cambiar identidad">
          <UserRoundCog aria-hidden="true" />
        </button>
      </header>
      {error ? <div className="alert alert--danger">{error}</div> : null}
      {loading ? <div className="alert alert--brand">Sincronizando tablero...</div> : null}
      <main className="app-main">{children}</main>
      <nav className="bottom-nav" aria-label="Navegacion principal">
        {navItems.map((item) => (
          <button
            aria-current={activeTab === item.tab ? 'page' : undefined}
            className={`bottom-nav__item ${activeTab === item.tab ? 'bottom-nav__item--active' : ''}`}
            key={item.tab}
            type="button"
            onClick={() => onTabChange(item.tab)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
