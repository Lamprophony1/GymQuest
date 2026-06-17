import { useEffect, useMemo, useState } from 'react';
import { gymChallApi } from './api/client';
import { getAuthMode } from './auth/authMode';
import { useAuthSession } from './auth/useAuthSession';
import { AppShell, type AppTab } from './components/AppShell';
import { IdentitySelector } from './components/IdentitySelector';
import { CheckInScreen } from './screens/CheckInScreen';
import { AdminScreen } from './screens/AdminScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RankingScreen } from './screens/RankingScreen';
import { TokenScreen } from './screens/TokenScreen';
import { useGymChallData } from './state/useGymChallData';
import { useSelectedIdentity } from './state/useSelectedIdentity';

export function App() {
  const authMode = useMemo(() => getAuthMode(), []);
  const auth = useAuthSession(authMode);
  const data = useGymChallData({
    enabled: authMode === 'dev-selector' || Boolean(auth.participant),
    includeAdmin: authMode === 'dev-selector' || auth.participant?.role === 1
  });
  const { identity, setIdentity } = useSelectedIdentity(data.participants);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');

  const selectedParticipant = useMemo(
    () =>
      data.participants.find((participant) => participant.id === identity?.participantId) ??
      (authMode === 'pin-login' && auth.participant?.id === identity?.participantId ? auth.participant : null),
    [auth.participant, authMode, data.participants, identity?.participantId]
  );
  const canSwitchAdminMode = selectedParticipant?.role === 1;
  const isAdmin = identity?.mode === 'admin' && canSwitchAdminMode;
  const visibleTab = (activeTab === 'admin' || activeTab === 'token') && !isAdmin ? 'dashboard' : activeTab;

  useEffect(() => {
    if (authMode !== 'pin-login') {
      return;
    }

    if (!auth.participant) {
      if (identity) {
        setIdentity(null);
      }
      return;
    }

    const nextMode = identity?.participantId === auth.participant.id && identity.mode === 'admin' && auth.participant.role === 1
      ? 'admin'
      : 'participant';

    if (identity?.participantId !== auth.participant.id || identity.mode !== nextMode) {
      setIdentity({ participantId: auth.participant.id, mode: nextMode });
    }
  }, [auth.participant, authMode, identity, setIdentity]);

  useEffect(() => {
    if ((activeTab === 'admin' || activeTab === 'token') && !isAdmin) {
      setActiveTab('dashboard');
    }
  }, [activeTab, isAdmin]);

  if (authMode === 'pin-login' && !auth.participant) {
    return (
      <LoginScreen
        options={auth.loginOptions}
        loading={auth.loading}
        error={auth.error}
        onLogin={async (request) => {
          const participant = await auth.login(request);
          if (participant) {
            setIdentity({ participantId: participant.id, mode: 'participant' });
            setActiveTab('dashboard');
          }
        }}
      />
    );
  }

  if (data.loading && !data.challenge && data.participants.length === 0) {
    return (
      <main className="identity-screen">
        <section className="identity-card">
          <span className="eyebrow">Loading</span>
          <h1>Proyecto RM</h1>
          <p>Sincronizando tablero...</p>
        </section>
      </main>
    );
  }

  if (!identity || !selectedParticipant) {
    return (
      <IdentitySelector
        challenge={data.challenge}
        participants={data.participants}
        onSelect={(nextIdentity) => {
          setIdentity(nextIdentity);
          setActiveTab('dashboard');
        }}
      />
    );
  }

  return (
    <AppShell
      activeTab={visibleTab}
      identity={identity}
      isAdmin={isAdmin}
      participant={selectedParticipant}
      challengeName={data.challenge?.challenge.name}
      loading={data.loading}
      error={data.error}
      onTabChange={setActiveTab}
      onChangeIdentity={() => setIdentity(null)}
      canSwitchAdminMode={canSwitchAdminMode}
      onSwitchMode={(mode) => {
        if (!selectedParticipant || (mode === 'admin' && selectedParticipant.role !== 1)) {
          return;
        }

        setIdentity({ participantId: selectedParticipant.id, mode });
      }}
      onLogout={
        authMode === 'pin-login'
          ? async () => {
              await auth.logout();
              setIdentity(null);
              setActiveTab('dashboard');
            }
          : undefined
      }
    >
      {visibleTab === 'dashboard' ? (
        <DashboardScreen
          challenge={data.challenge}
          participants={data.participants}
          couples={data.couples}
          ranking={data.ranking}
          weeklyRankings={data.weeklyRankings}
          selectedParticipant={selectedParticipant}
          onNavigate={setActiveTab}
        />
      ) : null}
      {visibleTab === 'ranking' ? (
        <RankingScreen
          couples={data.couples}
          ranking={data.ranking}
          weeklyRankings={data.weeklyRankings}
          selectedParticipantId={selectedParticipant.id}
        />
      ) : null}
      {visibleTab === 'checkin' ? (
        <CheckInScreen
          challenge={data.challenge}
          selectedParticipant={selectedParticipant}
          settings={data.challenge?.settings}
          onSubmit={async (request) => {
            await gymChallApi.registerCheckIn(request);
            await data.refresh();
          }}
          onUseToken={async (id, request) => {
            await gymChallApi.useToken(id, request);
            await data.refresh();
          }}
        />
      ) : null}
      {visibleTab === 'token' ? (
        <TokenScreen
          participants={data.participants}
          selectedParticipant={selectedParticipant}
          adminParticipantId={data.challenge?.challenge.adminParticipantId}
          onSubmit={async (request) => {
            await gymChallApi.grantToken(request);
            await data.refresh();
          }}
        />
      ) : null}
      {visibleTab === 'admin' ? (
        <AdminScreen
          participants={data.participants}
          couples={data.couples}
          recentCheckIns={data.recentCheckIns}
          calendarCheckIns={data.calendarCheckIns}
          calendarWeekStart={data.calendarWeekStart}
          recentTokens={data.recentTokens}
          adminParticipantId={selectedParticipant.id}
          onCreateParticipant={async (request) => {
            await gymChallApi.createParticipant(request);
            await data.refresh();
          }}
          onCreateCouple={async (request) => {
            await gymChallApi.createCouple(request);
            await data.refresh();
          }}
          onInvalidateCheckIn={async (id, reason) => {
            await gymChallApi.invalidateCheckIn(id, {
              actorParticipantId: selectedParticipant.id,
              reason: reason ?? 'Panel admin'
            });
            await data.refresh();
          }}
          onInvalidateToken={async (id, reason) => {
            await gymChallApi.invalidateToken(id, {
              actorParticipantId: selectedParticipant.id,
              reason: reason ?? 'Panel admin'
            });
            await data.refresh();
          }}
          onSetParticipantPin={async (participantId, pin) => {
            await gymChallApi.setParticipantPin(participantId, { pin });
            await data.refresh();
          }}
          onCalendarWeekChange={data.setCalendarWeekStart}
        />
      ) : null}
    </AppShell>
  );
}
