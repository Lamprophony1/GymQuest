import { useEffect, useMemo, useState } from 'react';
import { gymChallApi } from './api/client';
import { AppShell, type AppTab } from './components/AppShell';
import { IdentitySelector } from './components/IdentitySelector';
import { CheckInScreen } from './screens/CheckInScreen';
import { AdminScreen } from './screens/AdminScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { RankingScreen } from './screens/RankingScreen';
import { TokenScreen } from './screens/TokenScreen';
import { useGymChallData } from './state/useGymChallData';
import { useSelectedIdentity } from './state/useSelectedIdentity';

export function App() {
  const data = useGymChallData();
  const { identity, setIdentity } = useSelectedIdentity(data.participants);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');

  const selectedParticipant = useMemo(
    () => data.participants.find((participant) => participant.id === identity?.participantId) ?? null,
    [data.participants, identity?.participantId]
  );
  const isAdmin = identity?.mode === 'admin';
  const visibleTab = activeTab === 'admin' && !isAdmin ? 'dashboard' : activeTab;

  useEffect(() => {
    if (activeTab === 'admin' && !isAdmin) {
      setActiveTab('dashboard');
    }
  }, [activeTab, isAdmin]);

  if (data.loading && !data.challenge && data.participants.length === 0) {
    return (
      <main className="identity-screen">
        <section className="identity-card">
          <span className="eyebrow">Loading</span>
          <h1>GymChall</h1>
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
      loading={data.loading}
      error={data.error}
      onTabChange={setActiveTab}
      onChangeIdentity={() => setIdentity(null)}
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
          selectedParticipant={selectedParticipant}
          settings={data.challenge?.settings}
          onSubmit={async (request) => {
            await gymChallApi.registerCheckIn(request);
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
            await gymChallApi.createFullCoverageToken(request);
            await data.refresh();
          }}
        />
      ) : null}
      {visibleTab === 'admin' ? (
        <AdminScreen
          participants={data.participants}
          couples={data.couples}
          recentCheckIns={data.recentCheckIns}
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
        />
      ) : null}
    </AppShell>
  );
}
