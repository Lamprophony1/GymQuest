import { Dumbbell, Trophy } from 'lucide-react';
import type { AppTab } from '../components/AppShell';
import {
  coinDisplayTone,
  coinTone,
  coinTypes,
  formatCoupleName,
  formatPoints,
  tokenDisplayLabel,
  tokenTypeLabel
} from '../components/format';
import { QuestIcon, questCoinIconName } from '../components/QuestIcon';
import { ScorePanel } from '../components/ScorePanel';
import { StatusPanel } from '../components/StatusPanel';
import type { ChallengeSnapshot, Couple, ExceptionTokenType, FullCoverageToken, Participant, RankingRow, WeeklyRanking } from '../api/types';

interface DashboardScreenProps {
  challenge: ChallengeSnapshot | null;
  participants: Participant[];
  couples: Couple[];
  ranking: RankingRow[];
  weeklyRankings: WeeklyRanking[];
  selectedParticipant: Participant | null;
  onNavigate: (tab: AppTab) => void;
}

function coinIcon(type: ExceptionTokenType, specialCode?: string | null) {
  return <QuestIcon name={questCoinIconName(type, specialCode)} />;
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
  const ownCoupleName = ownCouple ? formatCoupleName(ownCouple.name) : 'Sin pareja';
  const leadPoints = ranking[0]?.totalPoints ?? null;
  const leaders = leadPoints === null ? [] : ranking.filter((row) => row.totalPoints === leadPoints);
  const leadTitle = leaders.length === 0 ? 'Sin lider' : leaders.length === 1 ? formatCoupleName(leaders[0].coupleName) : 'Empate';
  const leadMeta =
    leaders.length === 0
      ? 'Sin ranking'
      : leaders.length === 1
        ? `${formatPoints(leaders[0].totalPoints)} PTS lider`
        : `${leaders.length} parejas con ${formatPoints(leadPoints)} PTS`;
  const participantTokens =
    challenge?.fullCoverageTokens.filter((token) => token.participantId === selectedParticipant?.id && token.status === 1) ?? [];
  const tokenCount = participantTokens.length;
  const specialTokenGroups = groupSpecialTokens(participantTokens);

  function coinCount(type: ExceptionTokenType): number {
    return participantTokens.filter((token) => token.type === type && !token.specialCode).length;
  }

  return (
    <div className="screen-stack">
      <section className="dashboard-hero" aria-labelledby="dashboard-title">
        <span className="eyebrow">Scoreboard</span>
        <h2 id="dashboard-title">{challenge?.challenge.name ?? 'Reto activo'}</h2>
        <div className="score-grid">
          <ScorePanel
            eyebrow="Lead"
            title={leadTitle}
            value={leaders.length ? '#1' : '-'}
            meta={leadMeta}
            tone="success"
            icon={<QuestIcon name="lead" />}
            iconFrameClassName="icon-frame icon-frame--asset"
          />
          <article className="score-panel score-panel--warning score-panel--streaks">
            <div className="score-panel__topline">
              <div>
                <span className="eyebrow">Rachas</span>
                <h3>Streak board</h3>
              </div>
              <span className="icon-frame icon-frame--warning icon-frame--asset" aria-hidden="true">
                <QuestIcon name="streak-perfect" />
              </span>
            </div>
            <div className="streak-score-grid" aria-label="Rachas actuales">
              <div className="streak-score">
                <span className="icon-frame icon-frame--warning icon-frame--asset" aria-hidden="true">
                  <QuestIcon name="streak-perfect" />
                </span>
                <strong>{ownRanking?.morningStreak ?? 0}x</strong>
                <span>Perfect streak</span>
              </div>
              <div className="streak-score">
                <span className="icon-frame icon-frame--success icon-frame--asset" aria-hidden="true">
                  <QuestIcon name="streak-gym" />
                </span>
                <strong>{ownRanking?.gymStreak ?? 0}x</strong>
                <span>Gym streak</span>
              </div>
            </div>
          </article>
          <ScorePanel
            eyebrow={ownCoupleName}
            title="Puntos"
            value={formatPoints(ownRanking?.totalPoints)}
            suffix="pts"
            meta={ownCouple ? 'En carrera' : 'Sin pareja activa'}
            tone="brand"
            icon={<Trophy />}
          />
          <article className="score-panel score-panel--info score-panel--coins">
            <div className="score-panel__topline">
              <div>
                <span className="eyebrow">Power-up</span>
                <h3>Coins</h3>
              </div>
              <span className="icon-frame icon-frame--info icon-frame--asset" aria-hidden="true">
                <QuestIcon name="coin-commit" />
              </span>
            </div>
            <div className="coin-list" aria-label="Coins disponibles">
              {coinTypes.map((type) => (
                <span className={`coin-chip coin-chip--${coinTone(type)}`} key={type}>
                  <span className="coin-mark coin-mark--asset" aria-hidden="true">
                    {coinIcon(type)}
                  </span>
                  <span>{tokenTypeLabel(type)} x{coinCount(type)}</span>
                </span>
              ))}
              {specialTokenGroups.map((group) => (
                <span className={`coin-chip coin-chip--${coinDisplayTone(group.token)}`} key={group.key}>
                  <span className="coin-mark coin-mark--asset" aria-hidden="true">
                    {coinIcon(group.token.type, group.token.specialCode)}
                  </span>
                  <span>{tokenDisplayLabel(group.token)} x{group.count}</span>
                </span>
              ))}
            </div>
            <p className="score-panel__meta">{tokenCount ? `${tokenCount} disponibles` : 'Sin coins disponibles'}</p>
          </article>
        </div>
        <div className="quick-actions">
          <button className="button button--success" type="button" onClick={() => onNavigate('checkin')}>
            <Dumbbell aria-hidden="true" />
            Check-in
          </button>
        </div>
      </section>

      <StatusPanel
        challenge={challenge}
        ownCouple={ownCouple}
        ownRanking={ownRanking}
        weeklyRankings={weeklyRankings}
      />
    </div>
  );
}

function groupSpecialTokens(tokens: FullCoverageToken[]): Array<{ key: string; token: FullCoverageToken; count: number }> {
  const groups = new Map<string, { key: string; token: FullCoverageToken; count: number }>();

  for (const token of tokens) {
    if (!token.specialCode) {
      continue;
    }

    const key = `${token.specialCode}:${token.specialLabel ?? ''}:${token.type}`;
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
      continue;
    }

    groups.set(key, { key, token, count: 1 });
  }

  return [...groups.values()];
}
