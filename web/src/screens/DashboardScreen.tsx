import { Flame, ShieldAlert, Ticket, Trophy } from 'lucide-react';
import type { AppTab } from '../components/AppShell';
import { formatPoints } from '../components/format';
import { RankingList } from '../components/RankingList';
import { ScorePanel } from '../components/ScorePanel';
import { StatusPanel } from '../components/StatusPanel';
import type { ChallengeSnapshot, Couple, Participant, RankingRow, WeeklyRanking } from '../api/types';

interface DashboardScreenProps {
  challenge: ChallengeSnapshot | null;
  participants: Participant[];
  couples: Couple[];
  ranking: RankingRow[];
  weeklyRankings: WeeklyRanking[];
  selectedParticipant: Participant | null;
  onNavigate: (tab: AppTab) => void;
}

export function DashboardScreen({
  challenge,
  couples,
  ranking,
  weeklyRankings,
  selectedParticipant,
  onNavigate
}: DashboardScreenProps) {
  const ownCouple =
    couples.find((couple) => couple.participants.some((participant) => participant.id === selectedParticipant?.id)) ??
    null;
  const ownRanking = ranking.find((row) => row.coupleId === ownCouple?.id) ?? null;
  const leadPoints = ranking[0]?.totalPoints ?? null;
  const leaders = leadPoints === null ? [] : ranking.filter((row) => row.totalPoints === leadPoints);
  const leadTitle = leaders.length === 0 ? 'Sin lider' : leaders.length === 1 ? leaders[0].coupleName : 'Empate';
  const leadMeta =
    leaders.length === 0
      ? 'Sin ranking'
      : leaders.length === 1
        ? `${formatPoints(leaders[0].totalPoints)} PTS lider`
        : `${leaders.length} parejas con ${formatPoints(leadPoints)} PTS`;
  const participantTokens =
    challenge?.fullCoverageTokens.filter((token) => token.participantId === selectedParticipant?.id && token.status === 1).length ?? 0;

  return (
    <div className="screen-stack">
      <section className="dashboard-hero" aria-labelledby="dashboard-title">
        <span className="eyebrow">Scoreboard</span>
        <h2 id="dashboard-title">{challenge?.challenge.name ?? 'Reto activo'}</h2>
        <div className="score-grid">
          <ScorePanel
            eyebrow="Tu dupla"
            title="Puntos"
            value={formatPoints(ownRanking?.totalPoints)}
            suffix="pts"
            meta={ownCouple ? 'En carrera' : 'Sin pareja activa'}
            tone="brand"
            icon={<Trophy />}
          />
          <ScorePanel
            eyebrow="Combo"
            title="Racha"
            value={ownRanking?.morningStreak ?? 0}
            suffix="x"
            meta={`${ownRanking?.gymStreak ?? 0} gym streak`}
            tone="warning"
            icon={<Flame />}
          />
          <ScorePanel
            eyebrow="Power-up"
            title="Fichas"
            value={participantTokens}
            meta="Disponibles"
            tone="info"
            icon={<Ticket />}
          />
          <ScorePanel
            eyebrow="Lead"
            title={leadTitle}
            value={leaders.length ? '#1' : '-'}
            meta={leadMeta}
            tone="success"
            icon={<ShieldAlert />}
          />
        </div>
        <div className="quick-actions">
          <button className="button button--success" type="button" onClick={() => onNavigate('checkin')}>
            <Flame aria-hidden="true" />
            Check-in
          </button>
        </div>
      </section>

      <section className="panel-section" aria-labelledby="ranking-preview-title">
        <div className="section-heading">
          <span className="eyebrow">Arcade ladder</span>
          <h2 id="ranking-preview-title">Ranking parejas</h2>
        </div>
        <RankingList rows={ranking} highlightCoupleId={ownCouple?.id} compact />
      </section>

      <StatusPanel
        challenge={challenge}
        selectedParticipant={selectedParticipant}
        ownCouple={ownCouple}
        ownRanking={ownRanking}
        weeklyRankings={weeklyRankings}
      />
    </div>
  );
}
