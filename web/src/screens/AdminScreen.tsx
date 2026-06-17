import {
  Ban,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Plus,
  Shield,
  SlidersHorizontal,
  Users
} from 'lucide-react';
import { type CSSProperties, type FormEvent, type ReactNode, type UIEvent, useEffect, useMemo, useState } from 'react';
import type {
  AdminCheckIn,
  AdminToken,
  CheckInType,
  Couple,
  CreateCoupleRequest,
  CreateParticipantRequest,
  Participant,
  ParticipantRole
} from '../api/types';
import { checkInTypeLabel, formatShortDate, reasonCategoryLabel, statusTone, tokenTypeLabel } from '../components/format';
import { addDaysToDateOnly, buildWeekDays, startOfWeekMonday } from '../utils/date';

type AdminSection = 'calendar' | 'records' | 'setup';
type CalendarStatusFilter = 'all' | 'valid' | 'rejected';
type CalendarTypeFilter = 'all' | `${CheckInType}`;

interface AdminScreenProps {
  participants: Participant[];
  couples: Couple[];
  recentCheckIns: AdminCheckIn[];
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

const weekDayLabels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

function formatWeekRange(weekStart: string): string {
  return `Semana ${formatShortDate(weekStart)} - ${formatShortDate(addDaysToDateOnly(weekStart, 6))}`;
}

function formatCheckInTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }

  return new Intl.DateTimeFormat('es-PY', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

function matchesStatusFilter(checkIn: AdminCheckIn, filter: CalendarStatusFilter): boolean {
  if (filter === 'all') {
    return true;
  }

  const tone = statusTone(checkIn.status);
  return filter === 'valid' ? tone === 'success' : tone === 'danger';
}

function matchesTypeFilter(checkIn: AdminCheckIn, filter: CalendarTypeFilter): boolean {
  if (filter === 'all') {
    return true;
  }

  return checkIn.type === Number(filter);
}

export function AdminScreen({
  participants,
  couples,
  recentCheckIns,
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
  const [calendarStatusFilter, setCalendarStatusFilter] = useState<CalendarStatusFilter>('valid');
  const [calendarTypeFilter, setCalendarTypeFilter] = useState<CalendarTypeFilter>('all');
  const [calendarScrolledX, setCalendarScrolledX] = useState(false);
  const [calendarScrolledY, setCalendarScrolledY] = useState(false);
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

  const weekDays = useMemo(() => buildWeekDays(calendarWeekStart), [calendarWeekStart]);
  const filteredCalendarCheckIns = useMemo(
    () =>
      calendarCheckIns.filter(
        (checkIn) => matchesStatusFilter(checkIn, calendarStatusFilter) && matchesTypeFilter(checkIn, calendarTypeFilter)
      ),
    [calendarCheckIns, calendarStatusFilter, calendarTypeFilter]
  );
  const calendarCheckInsBySlot = useMemo(() => {
    const slots = new Map<string, AdminCheckIn[]>();

    for (const checkIn of filteredCalendarCheckIns) {
      const key = `${checkIn.participantId}:${checkIn.activityDate}`;
      const current = slots.get(key) ?? [];
      current.push(checkIn);
      slots.set(key, current);
    }

    for (const rows of slots.values()) {
      rows.sort((first, second) => first.occurredAt.localeCompare(second.occurredAt));
    }

    return slots;
  }, [filteredCalendarCheckIns]);
  const visibleValidCheckIns = filteredCalendarCheckIns.filter((checkIn) => statusTone(checkIn.status) === 'success').length;
  const visibleRejectedCheckIns = filteredCalendarCheckIns.filter((checkIn) => statusTone(checkIn.status) === 'danger').length;
  const calendarPlayerNameChars = Math.min(
    10,
    Math.max(5, ...participants.map((participant) => participant.displayName.trim().length))
  );
  const calendarScrollerStyle = {
    '--calendar-player-name-ch': `${calendarPlayerNameChars}ch`
  } as CSSProperties;
  const calendarScrollerClassName = [
    'admin-calendar__scroller',
    calendarScrolledX ? 'admin-calendar__scroller--x-scrolled' : '',
    calendarScrolledY ? 'admin-calendar__scroller--y-scrolled' : ''
  ].filter(Boolean).join(' ');

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

  function handleCalendarScroll(event: UIEvent<HTMLDivElement>) {
    const target = event.currentTarget;
    const nextScrolledX = target.scrollLeft > 12;
    const nextScrolledY = target.scrollTop > 12;

    setCalendarScrolledX((current) => (current === nextScrolledX ? current : nextScrolledX));
    setCalendarScrolledY((current) => (current === nextScrolledY ? current : nextScrolledY));
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

  function renderCalendarCell(participant: Participant, date: string) {
    const rows = calendarCheckInsBySlot.get(`${participant.id}:${date}`) ?? [];

    if (!rows.length) {
      return <span className="calendar-empty">Sin marca</span>;
    }

    return rows.map((checkIn) => {
      const tone = statusTone(checkIn.status);
      const canInvalidate = checkIn.status.toLowerCase() === 'valid';

      return (
        <div className={`calendar-entry calendar-entry--${tone}`} key={checkIn.id}>
          <div className="calendar-entry__main">
            <strong>{formatCheckInTime(checkIn.occurredAt)}</strong>
            <span>{checkInTypeLabel(checkIn.type)}</span>
          </div>
          <span className={`badge badge--${tone}`}>{checkIn.status}</span>
          {checkIn.notes ? <small>{checkIn.notes}</small> : null}
          <button
            className="icon-button icon-button--danger calendar-entry__action"
            type="button"
            aria-label={`Invalidar check-in de ${checkIn.participantName}`}
            disabled={busyAction === checkIn.id || !canInvalidate}
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
      );
    });
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
        <section
          className="panel-section admin-calendar"
          id="admin-calendar"
          role="tabpanel"
          aria-labelledby="admin-calendar-tab"
        >
          <div className="section-heading section-heading--with-action">
            <div>
              <span className="eyebrow">Check-ins</span>
              <h2>Calendario semanal</h2>
            </div>
            <div className="calendar-summary" aria-label="Resumen visible">
              <span>{visibleValidCheckIns} validos</span>
              <span>{visibleRejectedCheckIns} rejected</span>
            </div>
          </div>

          <div className="calendar-toolbar" aria-label="Navegacion semanal">
            <button
              className="icon-button"
              type="button"
              aria-label="Semana anterior"
              onClick={() => onCalendarWeekChange(addDaysToDateOnly(calendarWeekStart, -7))}
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <strong>{formatWeekRange(calendarWeekStart)}</strong>
            <button
              className="icon-button"
              type="button"
              aria-label="Semana siguiente"
              onClick={() => onCalendarWeekChange(addDaysToDateOnly(calendarWeekStart, 7))}
            >
              <ChevronRight aria-hidden="true" />
            </button>
            <button className="button button--tertiary calendar-toolbar__today" type="button" onClick={() => onCalendarWeekChange(startOfWeekMonday())}>
              Hoy
            </button>
          </div>

          <div className="calendar-filters">
            <label htmlFor="calendar-status-filter">
              Estado
              <select
                id="calendar-status-filter"
                value={calendarStatusFilter}
                onChange={(event) => setCalendarStatusFilter(event.currentTarget.value as CalendarStatusFilter)}
              >
                <option value="all">Todos</option>
                <option value="valid">Validos</option>
                <option value="rejected">Anulados</option>
              </select>
            </label>
            <label htmlFor="calendar-type-filter">
              Tipo
              <select
                id="calendar-type-filter"
                value={calendarTypeFilter}
                onChange={(event) => setCalendarTypeFilter(event.currentTarget.value as CalendarTypeFilter)}
              >
                <option value="all">Todos</option>
                <option value="0">5am</option>
                <option value="1">Recup. dia</option>
                <option value="2">Recup. finde</option>
              </select>
            </label>
          </div>

          <div
            className={calendarScrollerClassName}
            role="region"
            aria-label="Calendario de check-ins"
            tabIndex={0}
            onScroll={handleCalendarScroll}
            style={calendarScrollerStyle}
          >
            <table className="admin-calendar-table">
              <thead>
                <tr>
                  <th scope="col">Jugador</th>
                  {weekDays.map((date, index) => (
                    <th scope="col" key={date}>
                      <span>{weekDayLabels[index]}</span>
                      <small>{formatShortDate(date)}</small>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {participants.map((participant) => (
                  <tr key={participant.id}>
                    <th scope="row">{participant.displayName}</th>
                    {weekDays.map((date) => (
                      <td key={date}>{renderCalendarCell(participant, date)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
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
