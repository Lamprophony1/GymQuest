import { CalendarDays, CircleDollarSign, Dumbbell, LayoutDashboard, Settings, Shield, Trophy, UserRoundCog } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Participant } from '../api/types';
import type { SelectedIdentity } from '../state/useSelectedIdentity';
import { BrandMark } from './BrandMark';
import { PlayerAvatar } from './PlayerAvatar';

export type AppTab = 'dashboard' | 'ranking' | 'checkin' | 'markings' | 'token' | 'admin' | 'profile';

interface AppShellProps {
  activeTab: AppTab;
  identity: SelectedIdentity;
  isAdmin: boolean;
  canSwitchAdminMode?: boolean;
  participant: Participant | null;
  challengeName?: string | null;
  loading?: boolean;
  error?: string | null;
  children: ReactNode;
  onTabChange: (tab: AppTab) => void;
  onChangeIdentity: () => void;
  onOpenProfile?: () => void;
  onSwitchMode?: (mode: SelectedIdentity['mode']) => void;
  onLogout?: () => void;
}

const playerNavItems: Array<{ tab: AppTab; label: string; icon: ReactNode }> = [
  { tab: 'dashboard', label: 'Panel', icon: <LayoutDashboard /> },
  { tab: 'ranking', label: 'Ranking', icon: <Trophy /> },
  { tab: 'markings', label: 'Marcaciones', icon: <CalendarDays /> },
  { tab: 'checkin', label: 'Check-in', icon: <Dumbbell /> }
];

export function AppShell({
  activeTab,
  identity,
  isAdmin,
  canSwitchAdminMode = false,
  participant,
  challengeName,
  loading = false,
  error = null,
  children,
  onTabChange,
  onChangeIdentity,
  onOpenProfile,
  onSwitchMode,
  onLogout
}: AppShellProps) {
  const [isCompact, setIsCompact] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const navItems = isAdmin
    ? [...playerNavItems, { tab: 'token' as const, label: 'Coins', icon: <CircleDollarSign /> }, { tab: 'admin' as const, label: 'Admin', icon: <Shield /> }]
    : playerNavItems;
  const participantName = participant?.displayName ?? 'Sin jugador';
  const headerTitle = isCompact && participant ? `Proyecto RM - ${participant.displayName}` : 'Proyecto RM';
  const headerClassName = `app-header${isCompact ? ' app-header--compact' : ''}`;

  useEffect(() => {
    function onScroll() {
      setIsCompact((current) => (current ? window.scrollY > 24 : window.scrollY > 88));
      setProfileOpen(false);
    }

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!profileOpen) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      if (profileMenuRef.current?.contains(event.target as Node)) {
        return;
      }

      setProfileOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setProfileOpen(false);
      }
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [profileOpen]);

  return (
    <div className="app-shell">
      <header className={headerClassName}>
        <span className="app-header__brand-mark" aria-hidden="true">
          <BrandMark className="app-header__brand-image" />
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
        <div className="profile-menu" ref={profileMenuRef}>
          <button
            className={`icon-button profile-menu__button${participant ? ' profile-menu__button--avatar' : ''}`}
            type="button"
            onClick={() => setProfileOpen((current) => !current)}
            aria-expanded={profileOpen}
            aria-label="Menu de usuario"
          >
            {participant ? (
              <PlayerAvatar participant={participant} variant="header" />
            ) : (
              <UserRoundCog aria-hidden="true" />
            )}
          </button>
          {profileOpen ? (
            <div className="profile-menu__panel" role="menu">
              <div className="profile-menu__identity">
                <strong>{participantName}</strong>
                <span>@{participant?.username ?? 'sin-user'}</span>
              </div>
              <button
                className="profile-menu__item profile-menu__item--profile"
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  onOpenProfile?.();
                }}
              >
                <Settings aria-hidden="true" />
                Mi perfil
              </button>
              {canSwitchAdminMode ? (
                <div className="profile-menu__modes" aria-label="Modo de vista">
                  <button
                    className={identity.mode === 'participant' ? 'profile-menu__item profile-menu__item--active' : 'profile-menu__item'}
                    type="button"
                    aria-pressed={identity.mode === 'participant'}
                    onClick={() => {
                      setProfileOpen(false);
                      onSwitchMode?.('participant');
                    }}
                  >
                    Modo player
                  </button>
                  <button
                    className={identity.mode === 'admin' ? 'profile-menu__item profile-menu__item--active' : 'profile-menu__item'}
                    type="button"
                    aria-pressed={identity.mode === 'admin'}
                    onClick={() => {
                      setProfileOpen(false);
                      onSwitchMode?.('admin');
                    }}
                  >
                    Modo admin
                  </button>
                </div>
              ) : null}
              {onLogout ? (
                <button
                  className="profile-menu__item profile-menu__item--danger"
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onLogout();
                  }}
                >
                  Cerrar sesion
                </button>
              ) : (
                <button
                  className="profile-menu__item"
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onChangeIdentity();
                  }}
                >
                  Cambiar jugador
                </button>
              )}
            </div>
          ) : null}
        </div>
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
