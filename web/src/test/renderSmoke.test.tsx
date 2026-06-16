import { render, screen } from '@testing-library/react';
import { IdentitySelector } from '../components/IdentitySelector';
import { AdminScreen } from '../screens/AdminScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import type {
  AdminCheckIn,
  AdminToken,
  ChallengeSnapshot,
  Couple,
  Participant,
  RankingRow,
  WeeklyRanking
} from '../api/types';

const rafa: Participant = {
  id: 'rafa-id',
  displayName: 'Rafa',
  username: 'rafa',
  role: 1,
  gender: 'male',
  active: true
};

const clari: Participant = {
  id: 'clari-id',
  displayName: 'Clari',
  username: 'clari',
  role: 0,
  gender: 'female',
  active: true
};

const challenge: ChallengeSnapshot = {
  challenge: {
    id: 'challenge-id',
    name: 'Reto Parejas - Rumbo a Septiembre',
    startDate: '2026-06-15',
    endDate: '2026-09-15',
    adminParticipantId: 'rafa-id',
    timezone: 'America/Asuncion'
  },
  settings: {
    mondayMorningPoints: 4,
    weekdayMorningPoints: 3,
    sameDayRecoveryPoints: 2,
    weekendRecoveryPoints: 1.5,
    dailyCoupleBonus: 1,
    perfectWeekBonus: 12,
    completeWeekBonus: 7,
    rescuedWeekBonus: 4,
    gymMinimumMinutes: 45,
    morningWindowStart: '04:50',
    morningWindowEnd: '05:30'
  },
  participants: [rafa, clari],
  couples: [],
  checkIns: [],
  fullCoverageTokens: []
};

const couple: Couple = {
  id: 'couple-id',
  name: 'Rafa + Clari',
  participants: [rafa, clari],
  active: true
};

const ranking: RankingRow[] = [
  {
    coupleId: 'couple-id',
    coupleName: 'Rafa + Clari',
    totalPoints: 9,
    morningStreak: 2,
    gymStreak: 2
  }
];

const weeklyRankings: WeeklyRanking[] = [
  {
    weekStartDate: '2026-06-15',
    weekEndDate: '2026-06-21',
    rows: [
      {
        coupleId: 'couple-id',
        coupleName: 'Rafa + Clari',
        individualPoints: 8,
        dailyBonusPoints: 1,
        weeklyBonusPoints: 0,
        totalPoints: 9,
        weeklyBonusType: 'None',
        requiredBusinessDays: 5
      }
    ]
  }
];

const recentCheckIns: AdminCheckIn[] = [
  {
    id: 'check-in-id',
    participantId: 'rafa-id',
    participantName: 'Rafa',
    activityDate: '2026-06-15',
    occurredAt: '2026-06-15T09:05:00Z',
    type: 0,
    status: 'Valid',
    durationMinutes: 45,
    notes: '5am',
    createdAt: '2026-06-15T09:05:00Z'
  }
];

const recentTokens: AdminToken[] = [
  {
    id: 'token-id',
    participantId: 'clari-id',
    participantName: 'Clari',
    targetDate: '2026-06-16',
    reasonCategory: 1,
    status: 'Applied',
    notes: 'periodo',
    createdAt: '2026-06-16T09:05:00Z'
  }
];

test('identity selector renders participants and admin entry', () => {
  render(<IdentitySelector challenge={challenge} participants={[rafa, clari]} onSelect={() => undefined} />);

  expect(screen.getByText('Rafa')).toBeInTheDocument();
  expect(screen.getByText('Clari')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /admin/i })).toBeInTheDocument();
});

test('dashboard renders ranking, own couple, and quick actions', () => {
  render(
    <DashboardScreen
      challenge={challenge}
      participants={[rafa, clari]}
      couples={[couple]}
      ranking={ranking}
      weeklyRankings={weeklyRankings}
      selectedParticipant={rafa}
      onNavigate={() => undefined}
    />
  );

  expect(screen.getByText('Rafa + Clari')).toBeInTheDocument();
  expect(screen.getByText('9 pts')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /5am/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /ficha/i })).toBeInTheDocument();
});

test('admin screen renders recent check-ins and token sections', () => {
  render(
    <AdminScreen
      participants={[rafa, clari]}
      couples={[couple]}
      recentCheckIns={recentCheckIns}
      recentTokens={recentTokens}
      adminParticipantId="rafa-id"
      onCreateParticipant={async () => undefined}
      onCreateCouple={async () => undefined}
      onInvalidateCheckIn={async () => undefined}
      onInvalidateToken={async () => undefined}
    />
  );

  expect(screen.getByText('Registros recientes')).toBeInTheDocument();
  expect(screen.getByText('Check-ins')).toBeInTheDocument();
  expect(screen.getByText('Fichas')).toBeInTheDocument();
  expect(screen.getAllByText('Rafa').length).toBeGreaterThan(0);
});
