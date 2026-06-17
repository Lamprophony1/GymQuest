import { AlertTriangle, BadgeCheck, CircleDollarSign, Dumbbell, Flame, MapPinned, ShieldCheck } from 'lucide-react';
import type { ChallengeSnapshot, Couple, Participant, RankingRow, WeeklyRanking } from '../api/types';
import { latestWeeklyRanking, weeklyBonusStatus } from './format';

interface StatusPanelProps {
  challenge: ChallengeSnapshot | null;
  selectedParticipant: Participant | null;
  ownCouple: Couple | null;
  ownRanking: RankingRow | null;
  weeklyRankings: WeeklyRanking[];
}

export function StatusPanel({
  challenge,
  selectedParticipant,
  ownCouple,
  ownRanking,
  weeklyRankings
}: StatusPanelProps) {
  const latestWeek = latestWeeklyRanking(weeklyRankings);
  const ownWeek = latestWeek?.rows.find((row) => row.coupleId === ownCouple?.id) ?? null;
  const participantTokens =
    challenge?.fullCoverageTokens.filter((token) => token.participantId === selectedParticipant?.id && token.status === 1).length ?? 0;
  const isRedZone = ownWeek ? ownWeek.totalPoints < ownWeek.requiredBusinessDays * 2 : false;
  const bonus = weeklyBonusStatus(ownWeek, challenge?.settings);

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
            <h3>Perfect streak</h3>
            <p>{ownRanking ? `${ownRanking.morningStreak} dias 5am perfectos` : 'Sin perfect streak activo'}</p>
          </div>
        </article>
        <article className="status-card">
          <span className="icon-frame icon-frame--success" aria-hidden="true">
            <Dumbbell />
          </span>
          <div>
            <h3>Gym streak</h3>
            <p>{ownRanking ? `${ownRanking.gymStreak} dias de gym cubiertos` : 'Sin gym streak activo'}</p>
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
            {participantTokens > 0 ? <CircleDollarSign /> : <MapPinned />}
          </span>
          <div>
            <h3>Lago side quest</h3>
            <p>{participantTokens > 0 ? `${participantTokens} coins disponibles` : 'Disponible como mision'}</p>
          </div>
        </article>
        <article className="status-card">
          <span className="icon-frame icon-frame--success" aria-hidden="true">
            <BadgeCheck />
          </span>
          <div>
            <h3>{bonus.title}</h3>
            <p>{bonus.description}</p>
          </div>
        </article>
      </div>
    </section>
  );
}
