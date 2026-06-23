import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AppShell } from '../components/AppShell';
import { IdentitySelector } from '../components/IdentitySelector';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { RankingList } from '../components/RankingList';
import { AdminScreen } from '../screens/AdminScreen';
import { CheckInScreen } from '../screens/CheckInScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { MarkingsScreen } from '../screens/MarkingsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RankingScreen } from '../screens/RankingScreen';
import type {
  AdminCheckIn,
  AdminToken,
  LoginOption,
  ChallengeSnapshot,
  Couple,
  Participant,
  ParticipantProfile,
  RankingRow,
  WeeklyCalendarEvent,
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

const avatarParticipants: Participant[] = [
  rafa,
  clari,
  { id: 'obelar-id', displayName: 'Obelar', username: 'obelar', role: 0, gender: 'male', active: true },
  { id: 'chachi-id', displayName: 'Chachi', username: 'chachi', role: 0, gender: 'female', active: true },
  { id: 'cieli-id', displayName: 'Cieli', username: 'cieli', role: 0, gender: 'female', active: true },
  { id: 'naldo-id', displayName: 'Naldo', username: 'naldo', role: 0, gender: 'male', active: true }
];

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

const weeklyCalendarEvents: WeeklyCalendarEvent[] = [
  {
    id: 'calendar-valid-id',
    participantId: 'rafa-id',
    participantName: 'Rafa',
    activityDate: '2026-06-15',
    occurredAt: '2026-06-15T09:05:00Z',
    kind: 0,
    label: 'GymMorning',
    status: 'Valid',
    checkInType: 0,
    coinType: null,
    notes: '5am'
  },
  {
    id: 'weekly-coin-id',
    participantId: 'clari-id',
    participantName: 'Clari',
    activityDate: '2026-06-16',
    occurredAt: null,
    kind: 1,
    label: 'Mandatory',
    status: 'Applied',
    checkInType: null,
    coinType: 1,
    notes: 'feriado'
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

  expect(container.querySelector('.login-card__mark .login-card__brand-image')).toBeInTheDocument();

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
  const leadIcon = container.querySelector('.score-grid .score-panel:first-child .quest-icon--lead');
  expect(leadIcon).toBeInTheDocument();
  expect(leadIcon?.closest('.icon-frame')).toHaveClass('icon-frame--asset');
  expect(container.querySelector('.score-grid .score-panel:first-child .lucide-shield-alert')).not.toBeInTheDocument();

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

test('dashboard keeps a coin-covered Monday out of red zone even when weekly points are still low', () => {
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
  expect(screen.getByText('Fuera de peligro')).toBeInTheDocument();
  expect(screen.queryByText('Warning state')).not.toBeInTheDocument();
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
  expect(screen.getByText('Warning state')).toBeInTheDocument();
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
  expect(container.querySelector('.app-header__brand-mark .app-header__brand-image')).toBeInTheDocument();
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

test('app shell profile button uses the player avatar token in the header', () => {
  render(
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

  const profileButton = screen.getByRole('button', { name: /menu de usuario/i });

  expect(profileButton).toHaveClass('profile-menu__button--avatar');
  expect(profileButton.querySelector('.player-avatar--header')).toBeInTheDocument();
  expect(profileButton.querySelector('img.player-avatar__image')).toHaveAttribute('src', '/avatars/rafa.png');
  expect(profileButton.querySelector('.profile-menu__avatar-gear')).not.toBeInTheDocument();
});

test('app shell exposes markings tab for players', () => {
  const onTabChange = vi.fn();

  render(
    <AppShell
      activeTab="dashboard"
      identity={{ participantId: 'clari-id', mode: 'participant' }}
      isAdmin={false}
      participant={clari}
      challengeName="Reto septiembre 2026"
      onTabChange={onTabChange}
      onChangeIdentity={() => undefined}
    >
      <div>Contenido</div>
    </AppShell>
  );

  fireEvent.click(screen.getByRole('button', { name: /marcaciones/i }));

  expect(onTabChange).toHaveBeenCalledWith('markings');
});

test('markings screen renders a readonly weekly calendar with applied coins', () => {
  const { container } = render(
    <MarkingsScreen
      participants={[rafa, clari]}
      calendarEvents={weeklyCalendarEvents}
      calendarWeekStart="2026-06-15"
      onCalendarWeekChange={() => undefined}
    />
  );

  expect(screen.getByText('Marcaciones semanales')).toBeInTheDocument();
  expect(screen.getByText('Semana 15/06 - 21/06')).toBeInTheDocument();
  expect(screen.getByText('5AM')).toBeInTheDocument();
  const coinEntry = container.querySelector('.calendar-entry--coin');
  expect(coinEntry).toHaveAttribute('aria-label', expect.stringContaining('Commit coin'));
  expect(coinEntry?.querySelector('.calendar-entry__main strong')).toHaveTextContent('Commit coin');
  expect(coinEntry?.querySelector('.calendar-entry__main span')).toHaveTextContent('aplicada');
  expect(coinEntry?.querySelector('.calendar-entry__coin-icon .quest-icon--coin-commit')).toBeInTheDocument();
  expect(coinEntry?.querySelector('.badge')).not.toBeInTheDocument();
  expect(screen.getByText('Commit coin')).toBeInTheDocument();
  expect(screen.getByText('aplicada')).toBeInTheDocument();
  expect(screen.queryByText('feriado')).not.toBeInTheDocument();
  expect(screen.getByText('2 validos')).toBeInTheDocument();
  expect(screen.getByLabelText('Estado')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /invalidar/i })).not.toBeInTheDocument();
});

test('player avatar renders configured sticker images for every seeded participant', () => {
  const { container } = render(
    <div>
      {avatarParticipants.map((participant) => (
        <PlayerAvatar key={participant.id} participant={participant} />
      ))}
      <PlayerAvatar
        participant={{ id: 'guest-id', displayName: 'Invitado Nuevo', username: 'guest', role: 0, gender: null, active: true }}
      />
    </div>
  );

  for (const participant of avatarParticipants) {
    const image = container.querySelector(`img[src^="/avatars/${participant.username}.png"]`);
    const avatar = image?.closest('.player-avatar');

    expect(image).toBeInTheDocument();
    if (participant.username === 'rafa') {
      expect(avatar).not.toHaveClass('player-avatar--profile-subtle-zoom');
    } else {
      expect(avatar).toHaveClass('player-avatar--profile-subtle-zoom');
    }
  }

  expect(container.querySelectorAll('img.player-avatar__image')).toHaveLength(avatarParticipants.length);
  expect(screen.getByText('IN')).toBeInTheDocument();
});

test('app shell profile menu can switch an admin user between player and admin mode', () => {
  const onSwitchMode = vi.fn();
  const onLogout = vi.fn();
  const onOpenProfile = vi.fn();

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
      onOpenProfile={onOpenProfile}
      onSwitchMode={onSwitchMode}
      onLogout={onLogout}
    >
      <div>Contenido</div>
    </AppShell>
  );

  fireEvent.click(screen.getByRole('button', { name: /menu de usuario/i }));
  fireEvent.click(screen.getByRole('button', { name: /mi perfil/i }));
  expect(onOpenProfile).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: /menu de usuario/i }));
  fireEvent.click(screen.getByRole('button', { name: /modo admin/i }));
  expect(screen.queryByRole('button', { name: /cerrar sesion/i })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /menu de usuario/i }));
  fireEvent.click(screen.getByRole('button', { name: /cerrar sesion/i }));

  expect(onSwitchMode).toHaveBeenCalledWith('admin');
  expect(onLogout).toHaveBeenCalledTimes(1);
});

test('profile screen saves private metrics and changes PIN', async () => {
  const loadedProfile: ParticipantProfile = {
    ...rafa,
    weightKg: null,
    heightCm: null,
    bodyMassIndex: null
  };
  const savedProfile: ParticipantProfile = {
    ...rafa,
    weightKg: 82.4,
    heightCm: 178,
    bodyMassIndex: 26
  };
  const onLoadProfile = vi.fn().mockResolvedValue(loadedProfile);
  const onSaveProfile = vi.fn().mockResolvedValue(savedProfile);
  const onChangePin = vi.fn().mockResolvedValue(undefined);

  render(
    <ProfileScreen
      participant={rafa}
      onLoadProfile={onLoadProfile}
      onSaveProfile={onSaveProfile}
      onChangePin={onChangePin}
    />
  );

  await screen.findByText('@rafa');

  expect(document.querySelector('.profile-player-card .player-avatar--profile-token')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText(/peso kg/i), { target: { value: '82.4' } });
  fireEvent.change(screen.getByLabelText(/altura cm/i), { target: { value: '178' } });

  expect(screen.getByText('26')).toBeInTheDocument();
  expect(screen.getByText('Sobrepeso')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /guardar datos/i }));

  await waitFor(() => {
    expect(onSaveProfile).toHaveBeenCalledWith({
      participantId: 'rafa-id',
      weightKg: 82.4,
      heightCm: 178
    });
  });

  fireEvent.change(screen.getByLabelText(/pin actual/i), { target: { value: '123456' } });
  fireEvent.change(screen.getByLabelText(/^nuevo pin$/i), { target: { value: '2468' } });
  fireEvent.change(screen.getByLabelText(/confirmar pin/i), { target: { value: '2468' } });
  fireEvent.click(screen.getByRole('button', { name: /cambiar pin/i }));

  await waitFor(() => {
    expect(onChangePin).toHaveBeenCalledWith({
      participantId: 'rafa-id',
      currentPin: '123456',
      newPin: '2468'
    });
  });
});

test('profile screen rejects profile data that belongs to a different participant', async () => {
  const rafaProfile: ParticipantProfile = {
    ...rafa,
    weightKg: 82.4,
    heightCm: 178,
    bodyMassIndex: 26
  };
  const onLoadProfile = vi.fn().mockResolvedValue(rafaProfile);
  const onSaveProfile = vi.fn().mockResolvedValue(rafaProfile);
  const onChangePin = vi.fn().mockResolvedValue(undefined);

  render(
    <ProfileScreen
      participant={clari}
      onLoadProfile={onLoadProfile}
      onSaveProfile={onSaveProfile}
      onChangePin={onChangePin}
    />
  );

  await screen.findByText('@clari');

  expect(screen.getByText('Clari')).toBeInTheDocument();
  expect(screen.queryByText('Rafa')).not.toBeInTheDocument();
  expect(screen.queryByDisplayValue('82.4')).not.toBeInTheDocument();
  expect(screen.queryByDisplayValue('178')).not.toBeInTheDocument();
  expect(screen.getByText(/no coincide con el participante seleccionado/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /guardar datos/i })).toBeDisabled();
  expect(screen.getByRole('button', { name: /cambiar pin/i })).toBeDisabled();
});

test('admin screen renders recent check-ins and token sections', () => {
  render(
    <AdminScreen
      participants={[rafa, clari]}
      couples={[couple]}
      recentCheckIns={recentCheckIns}
      calendarEvents={weeklyCalendarEvents}
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
  const onInvalidateToken = vi.fn().mockResolvedValue(undefined);

  render(
    <AdminScreen
      participants={[rafa, clari]}
      couples={[couple]}
      recentCheckIns={recentCheckIns}
      calendarEvents={weeklyCalendarEvents}
      calendarCheckIns={calendarCheckIns}
      calendarWeekStart="2026-06-15"
      recentTokens={recentTokens}
      adminParticipantId="rafa-id"
      onCreateParticipant={async () => undefined}
      onCreateCouple={async () => undefined}
      onInvalidateCheckIn={async () => undefined}
      onInvalidateToken={onInvalidateToken}
      onSetParticipantPin={async () => undefined}
      onCalendarWeekChange={() => undefined}
    />
  );

  expect(screen.getByRole('tab', { name: /calendario/i })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByText('Semana 15/06 - 21/06')).toBeInTheDocument();
  expect(screen.getByText('Rafa')).toBeInTheDocument();
  expect(screen.getByText('Clari')).toBeInTheDocument();
  expect(screen.getByText('5AM')).toBeInTheDocument();
  expect(screen.getByText('Commit coin')).toBeInTheDocument();
  expect(screen.getByText('aplicada')).toBeInTheDocument();
  expect(screen.getByText('2 validos')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /invalidar coin de clari/i }));
  expect(onInvalidateToken).toHaveBeenCalledWith('weekly-coin-id', 'Admin rafa-id');
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
      calendarEvents={[]}
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
