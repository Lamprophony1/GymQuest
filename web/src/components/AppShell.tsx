import { Dumbbell, LayoutDashboard, Shield, Ticket, Trophy, UserRoundCog } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Participant } from '../api/types';
import type { SelectedIdentity } from '../state/useSelectedIdentity';

export type AppTab = 'dashboard' | 'ranking' | 'checkin' | 'token' | 'admin';

interface AppShellProps {
  activeTab: AppTab;
  identity: SelectedIdentity;
  isAdmin: boolean;
  participant: Participant | null;
  loading?: boolean;
  error?: string | null;
  children: ReactNode;
  onTabChange: (tab: AppTab) => void;
  onChangeIdentity: () => void;
}

const baseNavItems: Array<{ tab: AppTab; label: string; icon: ReactNode }> = [
  { tab: 'dashboard', label: 'Panel', icon: <LayoutDashboard /> },
  { tab: 'ranking', label: 'Ranking', icon: <Trophy /> },
  { tab: 'checkin', label: '5AM', icon: <Dumbbell /> },
  { tab: 'token', label: 'Ficha', icon: <Ticket /> }
];

export function AppShell({
  activeTab,
  identity,
  isAdmin,
  participant,
  loading = false,
  error = null,
  children,
  onTabChange,
  onChangeIdentity
}: AppShellProps) {
  const navItems = isAdmin ? [...baseNavItems, { tab: 'admin' as const, label: 'Admin', icon: <Shield /> }] : baseNavItems;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <span className="eyebrow">{identity.mode === 'admin' ? 'Admin mode' : 'Player mode'}</span>
          <h1>GymChall</h1>
          <p>{participant ? participant.displayName : 'Sin jugador'}</p>
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
