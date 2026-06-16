import { Flame, Trophy } from 'lucide-react';
import type { RankingRow } from '../api/types';
import { formatPoints } from './format';

interface RankingListProps {
  rows: RankingRow[];
  highlightCoupleId?: string | null;
  compact?: boolean;
}

export function RankingList({ rows, highlightCoupleId, compact = false }: RankingListProps) {
  if (rows.length === 0) {
    return <p className="empty-state">Sin puntos cargados todavia.</p>;
  }

  return (
    <ol className={`ranking-list ${compact ? 'ranking-list--compact' : ''}`}>
      {rows.map((row, index) => {
        const highlighted = row.coupleId === highlightCoupleId;
        return (
          <li
            className={`ranking-row ${highlighted ? 'ranking-row--active' : ''}`}
            key={row.coupleId}
          >
            <span className="ranking-row__position">#{index + 1}</span>
            <div className="ranking-row__main">
              <span className="ranking-row__name">{row.coupleName}</span>
              <span className="ranking-row__badges">
                <span className="badge badge--warning">
                  <Flame aria-hidden="true" />
                  {row.morningStreak} combo
                </span>
                <span className="badge badge--success">
                  <Trophy aria-hidden="true" />
                  {row.gymStreak} gym
                </span>
              </span>
            </div>
            <strong className="ranking-row__score">{formatPoints(row.totalPoints)} PTS</strong>
          </li>
        );
      })}
    </ol>
  );
}
