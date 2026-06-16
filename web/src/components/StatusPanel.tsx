import { AlertTriangle, BadgeCheck, Flame, MapPinned, ShieldCheck } from 'lucide-react';
import type { ChallengeSnapshot, Couple, Participant, RankingRow, WeeklyRanking } from '../api/types';
import { formatPoints } from './format';

interface StatusPanelProps {
  challenge: ChallengeSnapshot | null;
  selectedParticipant: Participant | null;
  ownCouple: Couple | null;
  ownRanking: RankingRow | null;
  weeklyRankings: WeeklyRanking[];
}

function weeklyBonusLabel(value: string): string {
  switch (value) {
    case 'PerfectWeek':
      return 'Perfect week';
    case 'CompleteWeek':
      return 'Complete week';
    case 'RescuedWeek':
      return 'Rescue week';
    default:
      return 'Sin bonus';
  }
}

export function StatusPanel({
  challenge,
  selectedParticipant,
  ownCouple,
  ownRanking,
  weeklyRankings
}: StatusPanelProps) {
  const latestWeek = weeklyRankings[0];
  const ownWeek = latestWeek?.rows.find((row) => row.coupleId === ownCouple?.id) ?? null;
  const participantTokens =
    challenge?.fullCoverageTokens.filter((token) => token.participantId === selectedParticipant?.id && token.status === 1).length ?? 0;
  const isRedZone = ownWeek ? ownWeek.totalPoints < ownWeek.requiredBusinessDays * 2 : false;

  return (
    <section className="status-panel" aria-labelledby="status-title">
      <div className="section-heading">
        <span className="eyebrow">Estado</span>
        <h2 id="status-title">Power board</h2>
      </div>
      <div className="status-grid">
        <article className="status-card">
          <span className="icon-frame icon-frame--warning" aria-hidden="true">
            <Flame />
          </span>
          <div>
            <h3>Combo streak</h3>
            <p>{ownRanking ? `${ownRanking.morningStreak} manana / ${ownRanking.gymStreak} gym` : 'Sin combo activo'}</p>
          </div>
        </article>
        <article className={`status-card ${isRedZone ? 'status-card--danger' : ''}`}>
          <span className={`icon-frame ${isRedZone ? 'icon-frame--danger' : 'icon-frame--success'}`} aria-hidden="true">
            {isRedZone ? <AlertTriangle /> : <ShieldCheck />}
          </span>
          <div>
            <h3>Zona roja</h3>
            <p>{isRedZone ? 'Warning state' : 'Fuera de peligro'}</p>
          </div>
        </article>
        <article className="status-card">
          <span className="icon-frame icon-frame--info" aria-hidden="true">
            <MapPinned />
          </span>
          <div>
            <h3>Lago side quest</h3>
            <p>{participantTokens > 0 ? `${participantTokens} ficha activa` : 'Disponible como mision'}</p>
          </div>
        </article>
        <article className="status-card">
          <span className="icon-frame icon-frame--success" aria-hidden="true">
            <BadgeCheck />
          </span>
          <div>
            <h3>{weeklyBonusLabel(ownWeek?.weeklyBonusType ?? 'None')}</h3>
            <p>{ownWeek ? `${formatPoints(ownWeek.weeklyBonusPoints)} pts bonus` : 'Semana sin datos'}</p>
          </div>
        </article>
      </div>
    </section>
  );
}
