import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AppShell } from '../components/AppShell';
import { IdentitySelector } from '../components/IdentitySelector';
import { RankingList } from '../components/RankingList';
import { AdminScreen } from '../screens/AdminScreen';
import { CheckInScreen } from '../screens/CheckInScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RankingScreen } from '../screens/RankingScreen';
import type {
  AdminCheckIn,
  AdminToken,
  LoginOption,
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
    name: 'Reto septiembre 2026',
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
    morningWindowStart: '05:00',
    morningWindowEnd: '06:00'
  },
  participants: [rafa, clari],
  couples: [],
  checkIns: [],
  fullCoverageTokens: []
};

const challengeWithCoins: ChallengeSnapshot = {
  ...challenge,
  fullCoverageTokens: [
    {
      id: 'health-coin-id',
      challengeId: 'challenge-id',
      participantId: 'rafa-id',
      targetDate: '2026-06-16',
      type: 0,
      reasonCategory: 0,
      status: 1,
      notes: null
    },
    {
      id: 'flex-coin-id',
      challengeId: 'challenge-id',
      participantId: 'rafa-id',
      targetDate: '2026-06-16',
      type: 2,
      reasonCategory: 4,
      status: 1,
      notes: null
    }
  ]
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
        weeklyBonusCandidateType: 'Perfect',
        weeklyBonusCandidatePoints: 12,
        requiredBusinessDays: 5
      }
    ]
  }
];

const perfectWeeklyRankings: WeeklyRanking[] = [
  {
    weekStartDate: '2026-06-15',
    weekEndDate: '2026-06-21',
    rows: [
      {
        coupleId: 'couple-id',
        coupleName: 'Rafa + Clari',
        individualPoints: 32,
        dailyBonusPoints: 5,
        weeklyBonusPoints: 12,
        totalPoints: 49,
        weeklyBonusType: 'Perfect',
        weeklyBonusCandidateType: 'Perfect',
        weeklyBonusCandidatePoints: 12,
        requiredBusinessDays: 5
      }
    ]
  }
];

const missedWeeklyRankings: WeeklyRanking[] = [
  {
    weekStartDate: '2026-06-15',
    weekEndDate: '2026-06-21',
    rows: [
      {
        coupleId: 'couple-id',
        coupleName: 'Rafa + Clari',
        individualPoints: 15,
        dailyBonusPoints: 2,
        weeklyBonusPoints: 0,
        totalPoints: 17,
        weeklyBonusType: 'None',
        weeklyBonusCandidateType: 'None',
        weeklyBonusCandidatePoints: 0,
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

const calendarCheckIns: AdminCheckIn[] = [
  {
    id: 'calendar-valid-id',
    participantId: 'rafa-id',
    participantName: 'Rafa',
    activityDate: '2026-06-15',
    occurredAt: '2026-06-15T09:05:00Z',
    type: 0,
    status: 'Valid',
    durationMinutes: 0,
    notes: '5am',
    createdAt: '2026-06-15T09:05:00Z'
  },
  {
    id: 'calendar-rejected-id',
    participantId: 'clari-id',
    participantName: 'Clari',
    activityDate: '2026-06-16',
    occurredAt: '2026-06-16T23:00:00Z',
    type: 1,
    status: 'Rejected',
    durationMinutes: 0,
    notes: 'tarde anulada',
    createdAt: '2026-06-16T23:00:00Z'
  }
];

const recentTokens: AdminToken[] = [
  {
    id: 'token-id',
    participantId: 'clari-id',
    participantName: 'Clari',
    targetDate: '2026-06-16',
    type: 0,
    reasonCategory: 1,
    status: 'Applied',
    notes: 'periodo',
    createdAt: '2026-06-16T09:05:00Z'
  }
];

const loginOptions: LoginOption[] = [
  { id: 'rafa-id', displayName: 'Rafa', username: 'rafa' },
  { id: 'clari-id', displayName: 'Clari', username: 'clari' }
];

test('login screen uses participant select and custom numeric keypad', () => {
  const onLogin = vi.fn();
  const { container } = render(<LoginScreen options={loginOptions} loading={false} error={null} onLogin={onLogin} />);

  expect(container.querySelector('.login-card__mark .login-card__barbell')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('Participante'), { target: { value: 'clari-id' } });
  fireEvent.click(screen.getByRole('button', { name: '1' }));
  fireEvent.click(screen.getByRole('button', { name: '2' }));
  fireEvent.click(screen.getByRole('button', { name: '3' }));
  fireEvent.click(screen.getByRole('button', { name: '4' }));
  fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

  expect(onLogin).toHaveBeenCalledWith({ participantId: 'clari-id', pin: '1234' });
});

test('identity selector renders participants and admin entry', () => {
  render(<IdentitySelector challenge={challenge} participants={[rafa, clari]} onSelect={() => undefined} />);

  expect(screen.getByText('Rafa')).toBeInTheDocument();
  expect(screen.getByText('Clari')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /admin/i })).toBeInTheDocument();
});

test('dashboard renders the scoreboard, own couple, and quick actions', () => {
  const { container } = render(
    <DashboardScreen
      challenge={challengeWithCoins}
      participants={[rafa, clari]}
      couples={[couple]}
      ranking={ranking}
      weeklyRankings={weeklyRankings}
      selectedParticipant={rafa}
      onNavigate={() => undefined}
    />
  );

  expect(screen.getAllByText('Rafa y Clari').length).toBeGreaterThan(0);
  expect(screen.queryByText('Rafa + Clari')).not.toBeInTheDocument();
  expect(screen.getByText('9 pts')).toBeInTheDocument();
  expect(screen.getByText('Health coin x1')).toBeInTheDocument();
  expect(screen.getByText('Commit coin x0')).toBeInTheDocument();
  expect(screen.getByText('Flex coin x1')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /check-in/i })).toBeInTheDocument();
  expect(screen.getByText('Side quest')).toBeInTheDocument();
  expect(screen.getByText('Soon')).toBeInTheDocument();
  expect(screen.getByText('Cardio opcional en desarrollo')).toBeInTheDocument();
  expect(screen.queryByText('Arcade ladder')).not.toBeInTheDocument();
  expect(screen.queryByText(/lago/i)).not.toBeInTheDocument();

  const scoreHeadings = [...container.querySelectorAll('.score-grid .score-panel h3')].map(
    (heading) => heading.textContent
  );
  expect(scoreHeadings).toEqual(['Rafa y Clari', 'Streak board', 'Puntos', 'Coins']);
});

test('check-in duplicate warning appears only after submitting the covered date', () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const coveredChallenge: ChallengeSnapshot = {
    ...challenge,
    checkIns: [
      {
        id: 'covered-check-in-id',
        challengeId: 'challenge-id',
        participantId: 'rafa-id',
        activityDate: '2026-06-16',
        type: 0,
        durationMinutes: 0
      }
    ]
  };

  render(
    <CheckInScreen
      challenge={coveredChallenge}
      selectedParticipant={rafa}
      onSubmit={onSubmit}
      onUseToken={async () => undefined}
    />
  );

  fireEvent.change(screen.getByLabelText('Fecha y hora'), { target: { value: '2026-06-16T05:00' } });

  expect(screen.queryByText(/Ya entrenaste ese dia/i)).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /registrar check-in/i }));

  expect(screen.getByText(/Ya entrenaste ese dia/i)).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
});

test('dashboard uses readable streak and weekly bonus labels', () => {
  render(
    <DashboardScreen
      challenge={challenge}
      participants={[rafa, clari]}
      couples={[couple]}
      ranking={ranking}
      weeklyRankings={perfectWeeklyRankings}
      selectedParticipant={rafa}
      onNavigate={() => undefined}
    />
  );

  expect(screen.getAllByText('Perfect streak').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Gym streak').length).toBeGreaterThan(0);
  expect(screen.getByText('2 dias 5am perfectos')).toBeInTheDocument();
  expect(screen.getByText('2 dias de gym cubiertos')).toBeInTheDocument();
  expect(screen.getByText('Perfect week')).toBeInTheDocument();
  expect(screen.getByText('+12 pts ganados esta semana')).toBeInTheDocument();
  expect(screen.queryByText(/combo/i)).not.toBeInTheDocument();
  expect(screen.queryByText('Sin bonus')).not.toBeInTheDocument();
});

test('ranking streak tags stay compact and icon-led', () => {
  render(<RankingList rows={ranking} highlightCoupleId="couple-id" />);

  expect(screen.getByLabelText('Perfect streak 2x')).toBeInTheDocument();
  expect(screen.getByLabelText('Gym streak 2x')).toBeInTheDocument();
  expect(screen.queryByText('Perfect streak')).not.toBeInTheDocument();
  expect(screen.queryByText('Gym streak')).not.toBeInTheDocument();
});

test('dashboard shows the weekly bonus still in play before the week closes', () => {
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

  expect(screen.getByText('Perfect week en juego')).toBeInTheDocument();
  expect(screen.getByText('+12 pts si finalizan la semana')).toBeInTheDocument();
});

test('dashboard does not show weekly bonus in play after a missed required day', () => {
  render(
    <DashboardScreen
      challenge={challenge}
      participants={[rafa, clari]}
      couples={[couple]}
      ranking={ranking}
      weeklyRankings={missedWeeklyRankings}
      selectedParticipant={rafa}
      onNavigate={() => undefined}
    />
  );

  expect(screen.getByText('Bonus semanal')).toBeInTheDocument();
  expect(screen.getByText('Sin bonus semanal en juego')).toBeInTheDocument();
  expect(screen.queryByText('Perfect week en juego')).not.toBeInTheDocument();
});


test('weekly ranking separates base, couple bonus, and weekly bonus', () => {
  render(
    <RankingScreen
      couples={[couple]}
      ranking={ranking}
      weeklyRankings={weeklyRankings}
      selectedParticipantId="rafa-id"
    />
  );

  fireEvent.click(screen.getByRole('tab', { name: /semana/i }));

  expect(screen.getByText('Base 8 · dupla 1 · semana 0')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Rafa y Clari' })).toBeInTheDocument();
  expect(screen.queryByText(/Base 8 \+ bonus 1/)).not.toBeInTheDocument();
});

test('app shell compacts header into a polished scorebar without player mode chrome', async () => {
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });

  const { container } = render(
    <AppShell
      activeTab="dashboard"
      identity={{ participantId: 'rafa-id', mode: 'participant' }}
      isAdmin={false}
      participant={rafa}
      challengeName="Reto septiembre 2026"
      onTabChange={() => undefined}
      onChangeIdentity={() => undefined}
    >
      <div>Contenido</div>
    </AppShell>
  );

  expect(screen.queryByText('Player mode')).not.toBeInTheDocument();
  expect(screen.queryByText('RM')).not.toBeInTheDocument();
  expect(container.querySelector('.app-header__brand-mark .app-header__barbell')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Proyecto RM' })).toBeInTheDocument();
  expect(screen.getByText('Rafa · Reto septiembre 2026')).toBeInTheDocument();

  Object.defineProperty(window, 'scrollY', { value: 104, configurable: true });
  fireEvent.scroll(window);

  await waitFor(() => {
    expect(screen.getByRole('banner')).toHaveClass('app-header--compact');
  });
  expect(screen.getByRole('heading', { name: 'Proyecto RM - Rafa' })).toBeInTheDocument();
  expect(container.querySelector('.app-header__meta-pill')).not.toBeInTheDocument();
  expect(screen.queryByText(/Reto septiembre 2026/)).not.toBeInTheDocument();
});

test('app shell profile menu can switch an admin user between player and admin mode', () => {
  const onSwitchMode = vi.fn();
  const onLogout = vi.fn();

  render(
    <AppShell
      activeTab="dashboard"
      identity={{ participantId: 'rafa-id', mode: 'participant' }}
      isAdmin={false}
      canSwitchAdminMode
      participant={rafa}
      challengeName="Reto septiembre 2026"
      onTabChange={() => undefined}
      onChangeIdentity={() => undefined}
      onSwitchMode={onSwitchMode}
      onLogout={onLogout}
    >
      <div>Contenido</div>
    </AppShell>
  );

  fireEvent.click(screen.getByRole('button', { name: /menu de usuario/i }));
  fireEvent.click(screen.getByRole('button', { name: /modo admin/i }));
  expect(screen.queryByRole('button', { name: /cerrar sesion/i })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /menu de usuario/i }));
  fireEvent.click(screen.getByRole('button', { name: /cerrar sesion/i }));

  expect(onSwitchMode).toHaveBeenCalledWith('admin');
  expect(onLogout).toHaveBeenCalledTimes(1);
});

test('admin screen renders recent check-ins and token sections', () => {
  render(
    <AdminScreen
      participants={[rafa, clari]}
      couples={[couple]}
      recentCheckIns={recentCheckIns}
      calendarCheckIns={calendarCheckIns}
      calendarWeekStart="2026-06-15"
      recentTokens={recentTokens}
      adminParticipantId="rafa-id"
      onCreateParticipant={async () => undefined}
      onCreateCouple={async () => undefined}
      onInvalidateCheckIn={async () => undefined}
      onInvalidateToken={async () => undefined}
      onSetParticipantPin={async () => undefined}
      onCalendarWeekChange={() => undefined}
    />
  );

  fireEvent.click(screen.getByRole('tab', { name: /registros/i }));

  expect(screen.getByText('Registros recientes')).toBeInTheDocument();
  expect(screen.getByText('Check-ins')).toBeInTheDocument();
  expect(screen.getByText('Coins')).toBeInTheDocument();
  expect(screen.getAllByText('Rafa').length).toBeGreaterThan(0);
});

test('admin screen shows weekly check-in calendar with rejected rows visible', () => {
  render(
    <AdminScreen
      participants={[rafa, clari]}
      couples={[couple]}
      recentCheckIns={recentCheckIns}
      calendarCheckIns={calendarCheckIns}
      calendarWeekStart="2026-06-15"
      recentTokens={recentTokens}
      adminParticipantId="rafa-id"
      onCreateParticipant={async () => undefined}
      onCreateCouple={async () => undefined}
      onInvalidateCheckIn={async () => undefined}
      onInvalidateToken={async () => undefined}
      onSetParticipantPin={async () => undefined}
      onCalendarWeekChange={() => undefined}
    />
  );

  expect(screen.getByRole('tab', { name: /calendario/i })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByText('Semana 15/06 - 21/06')).toBeInTheDocument();
  expect(screen.getByText('Rafa')).toBeInTheDocument();
  expect(screen.getByText('Clari')).toBeInTheDocument();
  expect(screen.getByText('5AM')).toBeInTheDocument();
  expect(screen.queryByText('Rejected')).not.toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'all' } });

  expect(screen.getByText('Recuperacion dia')).toBeInTheDocument();
  expect(screen.getByText('Rejected')).toBeInTheDocument();
  expect(screen.getByText('tarde anulada')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /invalidar check-in de clari/i })).toBeDisabled();
});

test('admin screen can reset a participant PIN', async () => {
  const onSetParticipantPin = vi.fn().mockResolvedValue(undefined);

  render(
    <AdminScreen
      participants={[rafa, clari]}
      couples={[couple]}
      recentCheckIns={[]}
      calendarCheckIns={[]}
      calendarWeekStart="2026-06-15"
      recentTokens={[]}
      adminParticipantId="rafa-id"
      onCreateParticipant={async () => undefined}
      onCreateCouple={async () => undefined}
      onInvalidateCheckIn={async () => undefined}
      onInvalidateToken={async () => undefined}
      onSetParticipantPin={onSetParticipantPin}
      onCalendarWeekChange={() => undefined}
    />
  );

  fireEvent.click(screen.getByRole('tab', { name: /setup/i }));
  fireEvent.change(screen.getByLabelText('Jugador PIN'), { target: { value: 'clari-id' } });
  fireEvent.change(screen.getByLabelText('Nuevo PIN'), { target: { value: '2468' } });
  fireEvent.click(screen.getByRole('button', { name: /guardar pin/i }));

  await waitFor(() => {
    expect(onSetParticipantPin).toHaveBeenCalledWith('clari-id', '2468');
  });
});
