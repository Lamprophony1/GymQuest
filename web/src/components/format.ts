import type {
  ChallengeSettings,
  CheckInType,
  ExceptionReasonCategory,
  ExceptionTokenType,
  FullCoverageToken,
  WeeklyRanking,
  WeeklyRankingRow
} from '../api/types';

export const coinTypes: ExceptionTokenType[] = [0, 1, 2];
export const specialCoinOptions = [
  { code: 'albirroja', label: 'Albirroja coin' }
] as const;

export type CoinDisplayInput = Pick<FullCoverageToken, 'type' | 'specialCode' | 'specialLabel'>;

export function formatPoints(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '0';
  }

  return Number.isInteger(value) ? value.toString() : value.toFixed(1).replace(/\.0$/, '');
}

export function formatShortDate(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }

  const [date] = value.split('T');
  const parts = date.split('-');
  if (parts.length !== 3) {
    return value;
  }

  return `${parts[2]}/${parts[1]}`;
}

export function latestWeeklyRanking(weeklyRankings: WeeklyRanking[]): WeeklyRanking | null {
  return weeklyRankings.reduce<WeeklyRanking | null>(
    (latest, week) => (!latest || week.weekStartDate > latest.weekStartDate ? week : latest),
    null
  );
}

export function formatCoupleName(name: string | null | undefined): string {
  if (!name) {
    return 'Sin pareja';
  }

  return name.replace(/\s*\+\s*/g, ' y ');
}

export function weeklyBonusLabel(value: string | null | undefined): string {
  switch (value) {
    case 'Perfect':
    case 'PerfectWeek':
      return 'Perfect week';
    case 'Complete':
    case 'CompleteWeek':
      return 'Complete week';
    case 'Rescued':
    case 'RescuedWeek':
      return 'Rescue week';
    default:
      return 'Sin bonus semanal';
  }
}

export function weeklyBreakdown(row: WeeklyRankingRow): string {
  return `Base ${formatPoints(row.individualPoints)} · dupla ${formatPoints(row.dailyBonusPoints)} · semana ${formatPoints(row.weeklyBonusPoints)}`;
}

export function weeklyBonusStatus(
  row: WeeklyRankingRow | null | undefined,
  _settings: ChallengeSettings | null | undefined
): { title: string; description: string } {
  if (!row) {
    return {
      title: 'Bonus semanal',
      description: 'Semana sin datos'
    };
  }

  if (row.weeklyBonusPoints > 0) {
    return {
      title: weeklyBonusLabel(row.weeklyBonusType),
      description: `+${formatPoints(row.weeklyBonusPoints)} pts ganados esta semana`
    };
  }

  if (row.weeklyBonusCandidatePoints > 0 && row.weeklyBonusCandidateType !== 'None') {
    return {
      title: `${weeklyBonusLabel(row.weeklyBonusCandidateType)} en juego`,
      description: `+${formatPoints(row.weeklyBonusCandidatePoints)} pts si finalizan la semana`
    };
  }

  return {
    title: 'Bonus semanal',
    description: 'Sin bonus semanal en juego'
  };
}

export function isWeeklyRedZone(row: WeeklyRankingRow | null | undefined): boolean {
  if (!row || row.weeklyBonusPoints > 0) {
    return false;
  }

  return row.weeklyBonusCandidateType === 'None';
}

export function checkInTypeLabel(type: CheckInType): string {
  switch (type) {
    case 0:
      return '5AM';
    case 1:
      return 'Recuperacion dia';
    case 2:
      return 'Recuperacion finde';
    default:
      return 'Check-in';
  }
}

export function tokenTypeLabel(type: ExceptionTokenType): string {
  switch (type) {
    case 0:
      return 'Health coin';
    case 1:
      return 'Commit coin';
    case 2:
      return 'Flex coin';
    default:
      return 'Coin';
  }
}

export function tokenDisplayLabel(token: CoinDisplayInput): string {
  if (token.specialLabel?.trim()) {
    return token.specialLabel;
  }

  if (token.specialCode?.trim()) {
    return specialCoinOptions.find((option) => option.code === token.specialCode)?.label ?? 'Coin especial';
  }

  return tokenTypeLabel(token.type);
}

export function coinTone(type: ExceptionTokenType): 'health' | 'commit' | 'flex' {
  switch (type) {
    case 0:
      return 'health';
    case 1:
      return 'commit';
    default:
      return 'flex';
  }
}

export function coinDisplayTone(token: CoinDisplayInput): 'health' | 'commit' | 'flex' | 'albirroja' {
  if (token.specialCode === 'albirroja') {
    return 'albirroja';
  }

  return coinTone(token.type);
}

export function reasonCategoryLabel(category: ExceptionReasonCategory): string {
  switch (category) {
    case 0:
      return 'Salud';
    case 1:
      return 'Periodo';
    case 2:
      return 'Viaje laboral';
    case 3:
      return 'Viaje obligatorio';
    case 4:
      return 'Aprobada';
    default:
      return 'Coin';
  }
}

export function statusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  const normalized = status.toLowerCase();
  if (normalized.includes('invalid') || normalized.includes('void') || normalized.includes('reject')) {
    return 'danger';
  }

  if (normalized.includes('valid') || normalized.includes('applied')) {
    return 'success';
  }

  if (normalized.includes('pending') || normalized.includes('available')) {
    return 'warning';
  }

  return 'neutral';
}
