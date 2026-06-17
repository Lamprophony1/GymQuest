import { CalendarDays, Trophy } from 'lucide-react';
import { useState } from 'react';
import { formatCoupleName, formatPoints, formatShortDate, latestWeeklyRanking, weeklyBreakdown } from '../components/format';
import { RankingList } from '../components/RankingList';
import type { Couple, RankingRow, WeeklyRanking } from '../api/types';

interface RankingScreenProps {
  couples: Couple[];
  ranking: RankingRow[];
  weeklyRankings: WeeklyRanking[];
  selectedParticipantId?: string | null;
}

export function RankingScreen({ couples, ranking, weeklyRankings, selectedParticipantId }: RankingScreenProps) {
  const [view, setView] = useState<'general' | 'weekly'>('general');
  const ownCouple =
    couples.find((couple) => couple.participants.some((participant) => participant.id === selectedParticipantId)) ??
    null;
  const latestWeek = latestWeeklyRanking(weeklyRankings);

  return (
    <div className="screen-stack">
      <section className="panel-section" aria-labelledby="ranking-title">
        <div className="section-heading">
          <span className="eyebrow">High score</span>
          <h2 id="ranking-title">Ranking</h2>
        </div>
        <div className="tab-row" role="tablist" aria-label="Vista de ranking">
          <button
            className={`tab-button ${view === 'general' ? 'tab-button--active' : ''}`}
            type="button"
            role="tab"
            aria-selected={view === 'general'}
            onClick={() => setView('general')}
          >
            <Trophy aria-hidden="true" />
            General
          </button>
          <button
            className={`tab-button ${view === 'weekly' ? 'tab-button--active' : ''}`}
            type="button"
            role="tab"
            aria-selected={view === 'weekly'}
            onClick={() => setView('weekly')}
          >
            <CalendarDays aria-hidden="true" />
            Semana
          </button>
        </div>
        {view === 'general' ? (
          <RankingList rows={ranking} highlightCoupleId={ownCouple?.id} />
        ) : (
          <div className="weekly-board">
            <div className="weekly-board__header">
              <span>{latestWeek ? `${formatShortDate(latestWeek.weekStartDate)} - ${formatShortDate(latestWeek.weekEndDate)}` : 'Semana'}</span>
            </div>
            {latestWeek?.rows.length ? (
              latestWeek.rows.map((row, index) => (
                <article
                  className={`weekly-row ${row.coupleId === ownCouple?.id ? 'weekly-row--active' : ''}`}
                  key={row.coupleId}
                >
                  <span className="ranking-row__position">#{index + 1}</span>
                  <div>
                    <h3>{formatCoupleName(row.coupleName)}</h3>
                    <p>{weeklyBreakdown(row)}</p>
                  </div>
                  <strong>{formatPoints(row.totalPoints)} PTS</strong>
                </article>
              ))
            ) : (
              <p className="empty-state">Todavia no hay semana cerrada.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
