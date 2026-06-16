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
  const lead = ranking[0] ?? null;
  const participantTokens =
    challenge?.fullCoverageTokens.filter((token) => token.participantId === selectedParticipant?.id).length ?? 0;

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
            meta="Cobertura completa"
            tone="info"
            icon={<Ticket />}
          />
          <ScorePanel
            eyebrow="Lead"
            title="Top pareja"
            value={lead ? '#1' : '-'}
            meta={lead ? `${formatPoints(lead.totalPoints)} PTS lider` : 'Sin ranking'}
            tone="success"
            icon={<ShieldAlert />}
          />
        </div>
        <div className="quick-actions">
          <button className="button button--success" type="button" onClick={() => onNavigate('checkin')}>
            <Flame aria-hidden="true" />
            5AM
          </button>
          <button className="button button--quaternary" type="button" onClick={() => onNavigate('token')}>
            <Ticket aria-hidden="true" />
            Ficha
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
