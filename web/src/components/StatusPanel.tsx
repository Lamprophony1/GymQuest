import { AlertTriangle, BadgeCheck, ShieldCheck } from 'lucide-react';
import type { ChallengeSnapshot, Couple, RankingRow, WeeklyRanking } from '../api/types';
import { isWeeklyRedZone, latestWeeklyRanking, weeklyBonusStatus } from './format';
import { QuestIcon } from './QuestIcon';

interface StatusPanelProps {
  challenge: ChallengeSnapshot | null;
  ownCouple: Couple | null;
  ownRanking: RankingRow | null;
  weeklyRankings: WeeklyRanking[];
}

export function StatusPanel({
  challenge,
  ownCouple,
  ownRanking,
  weeklyRankings
}: StatusPanelProps) {
  const latestWeek = latestWeeklyRanking(weeklyRankings);
  const ownWeek = latestWeek?.rows.find((row) => row.coupleId === ownCouple?.id) ?? null;
  const isRedZone = isWeeklyRedZone(ownWeek);
  const bonus = weeklyBonusStatus(ownWeek, challenge?.settings);

  return (
    <section className="status-panel" aria-labelledby="status-title">
      <div className="section-heading">
        <span className="eyebrow">Estado</span>
        <h2 id="status-title">Power board</h2>
      </div>
      <div className="status-grid">
        <article className="status-card">
          <span className="icon-frame icon-frame--warning icon-frame--asset" aria-hidden="true">
            <QuestIcon name="streak-perfect" />
          </span>
          <div>
            <h3>Perfect streak</h3>
            <p>{ownRanking ? `${ownRanking.morningStreak} dias 5am perfectos` : 'Sin perfect streak activo'}</p>
          </div>
        </article>
        <article className="status-card">
          <span className="icon-frame icon-frame--success icon-frame--asset" aria-hidden="true">
            <QuestIcon name="streak-gym" />
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
        <article className="status-card status-card--soon">
          <span className="icon-frame icon-frame--info icon-frame--asset" aria-hidden="true">
            <QuestIcon name="side-quest" />
          </span>
          <div>
            <div className="status-card__title-row">
              <h3>Side quest</h3>
              <span className="badge badge--neutral">Soon</span>
            </div>
            <p>Cardio opcional en desarrollo</p>
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
