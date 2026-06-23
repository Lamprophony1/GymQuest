import {
  Ban,
  CalendarDays,
  ClipboardList,
  Plus,
  Shield,
  SlidersHorizontal,
  Users
} from 'lucide-react';
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import type {
  AdminCheckIn,
  AdminToken,
  Couple,
  CreateCoupleRequest,
  CreateParticipantRequest,
  Participant,
  ParticipantRole,
  WeeklyCalendarEvent
} from '../api/types';
import { checkInTypeLabel, formatShortDate, reasonCategoryLabel, statusTone, tokenTypeLabel } from '../components/format';
import { WeeklyMarkingsCalendar } from '../components/WeeklyMarkingsCalendar';

type AdminSection = 'calendar' | 'records' | 'setup';

interface AdminScreenProps {
  participants: Participant[];
  couples: Couple[];
  recentCheckIns: AdminCheckIn[];
  calendarEvents: WeeklyCalendarEvent[];
  calendarCheckIns: AdminCheckIn[];
  calendarWeekStart: string;
  recentTokens: AdminToken[];
  adminParticipantId: string;
  onCreateParticipant: (request: CreateParticipantRequest) => Promise<void>;
  onCreateCouple: (request: CreateCoupleRequest) => Promise<void>;
  onInvalidateCheckIn: (id: string, reason?: string) => Promise<void>;
  onInvalidateToken: (id: string, reason?: string) => Promise<void>;
  onSetParticipantPin: (participantId: string, pin: string) => Promise<void>;
  onCalendarWeekChange: (weekStart: string) => void;
}

function adminCheckInToCalendarEvent(checkIn: AdminCheckIn): WeeklyCalendarEvent {
  return {
    id: checkIn.id,
    participantId: checkIn.participantId,
    participantName: checkIn.participantName,
    activityDate: checkIn.activityDate,
    occurredAt: checkIn.occurredAt,
    kind: 0,
    label: checkIn.type.toString(),
    status: checkIn.status,
    checkInType: checkIn.type,
    coinType: null,
    notes: checkIn.notes
  };
}

export function AdminScreen({
  participants,
  couples,
  recentCheckIns,
  calendarEvents,
  calendarCheckIns,
  calendarWeekStart,
  recentTokens,
  adminParticipantId,
  onCreateParticipant,
  onCreateCouple,
  onInvalidateCheckIn,
  onInvalidateToken,
  onSetParticipantPin,
  onCalendarWeekChange
}: AdminScreenProps) {
  const [activeSection, setActiveSection] = useState<AdminSection>('calendar');
  const [participantForm, setParticipantForm] = useState({
    displayName: '',
    username: '',
    role: 0 as ParticipantRole,
    gender: ''
  });
  const [coupleForm, setCoupleForm] = useState({
    name: '',
    firstParticipantId: participants[0]?.id ?? '',
    secondParticipantId: participants[1]?.id ?? ''
  });
  const [pinForm, setPinForm] = useState({
    participantId: participants[0]?.id ?? '',
    pin: ''
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const adminCalendarEvents = useMemo(() => {
    const eventIds = new Set(calendarEvents.map((event) => event.id));
    return [
      ...calendarEvents,
      ...calendarCheckIns
        .filter((checkIn) => !eventIds.has(checkIn.id))
        .map(adminCheckInToCalendarEvent)
    ];
  }, [calendarCheckIns, calendarEvents]);

  useEffect(() => {
    setCoupleForm((current) => ({
      ...current,
      firstParticipantId: current.firstParticipantId || participants[0]?.id || '',
      secondParticipantId: current.secondParticipantId || participants[1]?.id || participants[0]?.id || ''
    }));
    setPinForm((current) => ({
      ...current,
      participantId: current.participantId || participants[0]?.id || ''
    }));
  }, [participants]);

  async function runAdminAction(action: string, callback: () => Promise<void>, successMessage: string) {
    setBusyAction(action);
    setError(null);
    setMessage(null);

    try {
      await callback();
      setMessage(successMessage);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Accion no completada.');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCreateParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAdminAction(
      'participant',
      async () => {
        await onCreateParticipant({
          displayName: participantForm.displayName.trim(),
          username: participantForm.username.trim(),
          role: participantForm.role,
          gender: participantForm.gender.trim() || null
        });
        setParticipantForm({ displayName: '', username: '', role: 0, gender: '' });
      },
      'Participante creado.'
    );
  }

  async function handleCreateCouple(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (coupleForm.firstParticipantId === coupleForm.secondParticipantId) {
      setError('La pareja necesita dos participantes distintos.');
      return;
    }

    await runAdminAction(
      'couple',
      async () => {
        await onCreateCouple({
          name: coupleForm.name.trim(),
          firstParticipantId: coupleForm.firstParticipantId,
          secondParticipantId: coupleForm.secondParticipantId
        });
        setCoupleForm((current) => ({ ...current, name: '' }));
      },
      'Pareja creada.'
    );
  }

  async function handleSetPin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{4,6}$/.test(pinForm.pin)) {
      setError('El PIN debe tener 4 a 6 numeros.');
      return;
    }

    await runAdminAction(
      'pin',
      async () => {
        await onSetParticipantPin(pinForm.participantId, pinForm.pin);
        setPinForm((current) => ({ ...current, pin: '' }));
      },
      'PIN actualizado.'
    );
  }

  function renderTab(id: AdminSection, label: string, icon: ReactNode) {
    const selected = activeSection === id;

    return (
      <button
        className={`tab-button${selected ? ' tab-button--active' : ''}`}
        type="button"
        role="tab"
        aria-selected={selected}
        aria-controls={`admin-${id}`}
        id={`admin-${id}-tab`}
        onClick={() => setActiveSection(id)}
      >
        {icon}
        {label}
      </button>
    );
  }

  return (
    <div className="screen-stack">
      <section className="panel-section admin-overview" aria-labelledby="admin-title">
        <div className="section-heading">
          <span className="eyebrow">Control room</span>
          <h2 id="admin-title">Admin panel</h2>
        </div>
        <div className="admin-stats">
          <article className="mini-stat">
            <Users aria-hidden="true" />
            <span>Participantes</span>
            <strong>{participants.length}</strong>
          </article>
          <article className="mini-stat">
            <Shield aria-hidden="true" />
            <span>Parejas</span>
            <strong>{couples.length}</strong>
          </article>
        </div>
        {message ? <div className="alert alert--success">{message}</div> : null}
        {error ? <div className="alert alert--danger">{error}</div> : null}
      </section>

      <nav className="tab-row tab-row--admin" role="tablist" aria-label="Secciones admin">
        {renderTab('calendar', 'Calendario', <CalendarDays aria-hidden="true" />)}
        {renderTab('records', 'Registros', <ClipboardList aria-hidden="true" />)}
        {renderTab('setup', 'Setup', <SlidersHorizontal aria-hidden="true" />)}
      </nav>

      {activeSection === 'calendar' ? (
        <WeeklyMarkingsCalendar
          participants={participants}
          events={adminCalendarEvents}
          calendarWeekStart={calendarWeekStart}
          onCalendarWeekChange={onCalendarWeekChange}
          busyActionId={busyAction}
          labelledBy="admin-calendar-title"
          onInvalidateCheckIn={(event) =>
            runAdminAction(
              event.id,
              () => onInvalidateCheckIn(event.id, `Admin ${adminParticipantId}`),
              'Check-in invalidado.'
            )
          }
          onInvalidateToken={(event) =>
            runAdminAction(
              event.id,
              () => onInvalidateToken(event.id, `Admin ${adminParticipantId}`),
              'Coin devuelta al player.'
            )
          }
        />
      ) : null}

      {activeSection === 'setup' ? (
        <section
          className="panel-section"
          id="admin-setup"
          role="tabpanel"
          aria-labelledby="admin-setup-tab"
        >
          <div className="section-heading">
            <span className="eyebrow">Setup</span>
            <h2 id="admin-create-title">Carga rapida</h2>
          </div>
          <div className="admin-forms">
            <form className="arcade-form" onSubmit={handleCreateParticipant}>
              <h3>Participante</h3>
              <label htmlFor="participant-display">Nombre</label>
              <input
                id="participant-display"
                required
                value={participantForm.displayName}
                onChange={(event) => setParticipantForm((current) => ({ ...current, displayName: event.currentTarget.value }))}
              />
              <label htmlFor="participant-username">Usuario</label>
              <input
                id="participant-username"
                required
                value={participantForm.username}
                onChange={(event) => setParticipantForm((current) => ({ ...current, username: event.currentTarget.value }))}
              />
              <label htmlFor="participant-role">Rol</label>
              <select
                id="participant-role"
                value={participantForm.role}
                onChange={(event) =>
                  setParticipantForm((current) => ({ ...current, role: Number(event.currentTarget.value) as ParticipantRole }))
                }
              >
                <option value={0}>Player</option>
                <option value={1}>Admin</option>
              </select>
              <label htmlFor="participant-gender">Genero</label>
              <input
                id="participant-gender"
                value={participantForm.gender}
                onChange={(event) => setParticipantForm((current) => ({ ...current, gender: event.currentTarget.value }))}
              />
              <button className="button button--secondary" type="submit" disabled={busyAction === 'participant'}>
                <Plus aria-hidden="true" />
                Crear jugador
              </button>
            </form>

            <form className="arcade-form" onSubmit={handleCreateCouple}>
              <h3>Pareja</h3>
              <label htmlFor="couple-name">Nombre</label>
              <input
                id="couple-name"
                required
                value={coupleForm.name}
                onChange={(event) => setCoupleForm((current) => ({ ...current, name: event.currentTarget.value }))}
              />
              <label htmlFor="couple-first">Jugador 1</label>
              <select
                id="couple-first"
                value={coupleForm.firstParticipantId}
                onChange={(event) => setCoupleForm((current) => ({ ...current, firstParticipantId: event.currentTarget.value }))}
              >
                {participants.map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.displayName}
                  </option>
                ))}
              </select>
              <label htmlFor="couple-second">Jugador 2</label>
              <select
                id="couple-second"
                value={coupleForm.secondParticipantId}
                onChange={(event) => setCoupleForm((current) => ({ ...current, secondParticipantId: event.currentTarget.value }))}
              >
                {participants.map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.displayName}
                  </option>
                ))}
              </select>
              <button className="button button--tertiary" type="submit" disabled={busyAction === 'couple'}>
                <Plus aria-hidden="true" />
                Crear pareja
              </button>
            </form>

            <form className="arcade-form" onSubmit={handleSetPin}>
              <h3>PIN</h3>
              <label htmlFor="pin-participant">Jugador PIN</label>
              <select
                id="pin-participant"
                value={pinForm.participantId}
                onChange={(event) => {
                  const participantId = event.currentTarget.value;
                  setPinForm((current) => ({ ...current, participantId }));
                }}
              >
                {participants.map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.displayName}
                  </option>
                ))}
              </select>
              <label htmlFor="pin-value">Nuevo PIN</label>
              <input
                id="pin-value"
                inputMode="numeric"
                pattern="[0-9]*"
                minLength={4}
                maxLength={6}
                required
                value={pinForm.pin}
                onChange={(event) => {
                  const pin = event.currentTarget.value.replace(/\D/g, '').slice(0, 6);
                  setPinForm((current) => ({ ...current, pin }));
                }}
              />
              <button className="button button--dark" type="submit" disabled={busyAction === 'pin'}>
                <Shield aria-hidden="true" />
                Guardar PIN
              </button>
            </form>
          </div>
        </section>
      ) : null}

      {activeSection === 'records' ? (
        <section
          className="panel-section"
          id="admin-records"
          role="tabpanel"
          aria-labelledby="admin-records-tab"
        >
          <div className="section-heading">
            <span className="eyebrow">Audit trail</span>
            <h2 id="recent-title">Registros recientes</h2>
          </div>
          <div className="admin-lists">
            <article className="admin-list">
              <h3>Check-ins</h3>
              {recentCheckIns.length ? (
                recentCheckIns.map((checkIn) => (
                  <div className="record-row" key={checkIn.id}>
                    <div>
                      <strong>{checkIn.participantName}</strong>
                      <span>
                        {formatShortDate(checkIn.activityDate)} - {checkInTypeLabel(checkIn.type)}
                      </span>
                      {checkIn.notes ? <small>{checkIn.notes}</small> : null}
                    </div>
                    <span className={`badge badge--${statusTone(checkIn.status)}`}>{checkIn.status}</span>
                    <button
                      className="icon-button icon-button--danger"
                      type="button"
                      aria-label={`Invalidar check-in de ${checkIn.participantName}`}
                      disabled={busyAction === checkIn.id || checkIn.status.toLowerCase() !== 'valid'}
                      onClick={() =>
                        runAdminAction(
                          checkIn.id,
                          () => onInvalidateCheckIn(checkIn.id, `Admin ${adminParticipantId}`),
                          'Check-in invalidado.'
                        )
                      }
                    >
                      <Ban aria-hidden="true" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="empty-state">Sin check-ins recientes.</p>
              )}
            </article>

            <article className="admin-list">
              <h3>Coins</h3>
              {recentTokens.length ? (
                recentTokens.map((token) => (
                  <div className="record-row" key={token.id}>
                    <div>
                      <strong>{token.participantName}</strong>
                      <span>
                        {token.status.toLowerCase() === 'available' ? 'Disponible' : formatShortDate(token.targetDate)}
                        {' - '}
                        {tokenTypeLabel(token.type)}
                        {' - '}
                        {reasonCategoryLabel(token.reasonCategory)}
                      </span>
                      {token.notes ? <small>{token.notes}</small> : null}
                    </div>
                    <span className={`badge badge--${statusTone(token.status)}`}>{token.status}</span>
                    <button
                      className="icon-button icon-button--danger"
                      type="button"
                      aria-label={`Invalidar coin de ${token.participantName}`}
                      disabled={busyAction === token.id || token.status.toLowerCase() === 'rejected'}
                      onClick={() =>
                        runAdminAction(
                          token.id,
                          () => onInvalidateToken(token.id, `Admin ${adminParticipantId}`),
                          'Coin invalidada.'
                        )
                      }
                    >
                      <Ban aria-hidden="true" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="empty-state">Sin coins recientes.</p>
              )}
            </article>
          </div>
        </section>
      ) : null}
    </div>
  );
}
