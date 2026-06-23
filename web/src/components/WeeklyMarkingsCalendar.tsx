import { Ban, ChevronLeft, ChevronRight } from 'lucide-react';
import { type CSSProperties, type UIEvent, useMemo, useState } from 'react';
import type { CheckInType, Participant, WeeklyCalendarEvent } from '../api/types';
import { checkInTypeLabel, formatShortDate, statusTone, tokenTypeLabel } from './format';
import { QuestIcon, questCoinIconName } from './QuestIcon';
import { addDaysToDateOnly, buildWeekDays, startOfWeekMonday } from '../utils/date';

type CalendarStatusFilter = 'all' | 'valid' | 'rejected';
type CalendarTypeFilter = 'all' | `${CheckInType}` | 'coin';

interface WeeklyMarkingsCalendarProps {
  participants: Participant[];
  events: WeeklyCalendarEvent[];
  calendarWeekStart: string;
  onCalendarWeekChange: (weekStart: string) => void;
  title?: string;
  eyebrow?: string;
  readOnly?: boolean;
  busyActionId?: string | null;
  labelledBy?: string;
  onInvalidateCheckIn?: (event: WeeklyCalendarEvent) => void;
  onInvalidateToken?: (event: WeeklyCalendarEvent) => void;
}

const weekDayLabels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

function formatWeekRange(weekStart: string): string {
  return `Semana ${formatShortDate(weekStart)} - ${formatShortDate(addDaysToDateOnly(weekStart, 6))}`;
}

function formatEventTime(event: WeeklyCalendarEvent): string {
  if (event.kind === 1) {
    return 'Coin';
  }

  if (!event.occurredAt) {
    return '--:--';
  }

  const date = new Date(event.occurredAt);
  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }

  return new Intl.DateTimeFormat('es-PY', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

function formatEventLabel(event: WeeklyCalendarEvent): string {
  if (event.kind === 1) {
    return event.coinType === null || event.coinType === undefined ? event.label || 'Coin' : tokenTypeLabel(event.coinType);
  }

  return event.checkInType === null || event.checkInType === undefined
    ? event.label || 'Check-in'
    : checkInTypeLabel(event.checkInType);
}

function matchesStatusFilter(event: WeeklyCalendarEvent, filter: CalendarStatusFilter): boolean {
  if (filter === 'all') {
    return true;
  }

  const tone = statusTone(event.status);
  return filter === 'valid' ? tone === 'success' : tone === 'danger';
}

function matchesTypeFilter(event: WeeklyCalendarEvent, filter: CalendarTypeFilter): boolean {
  if (filter === 'all') {
    return true;
  }

  if (filter === 'coin') {
    return event.kind === 1;
  }

  return event.kind === 0 && event.checkInType === Number(filter);
}

function compareCalendarEvents(first: WeeklyCalendarEvent, second: WeeklyCalendarEvent): number {
  return (
    first.activityDate.localeCompare(second.activityDate) ||
    first.participantName.localeCompare(second.participantName) ||
    first.kind - second.kind ||
    (first.occurredAt ?? '').localeCompare(second.occurredAt ?? '') ||
    first.id.localeCompare(second.id)
  );
}

export function WeeklyMarkingsCalendar({
  participants,
  events,
  calendarWeekStart,
  onCalendarWeekChange,
  title = 'Calendario semanal',
  eyebrow = 'Check-ins',
  readOnly = false,
  busyActionId = null,
  labelledBy,
  onInvalidateCheckIn,
  onInvalidateToken
}: WeeklyMarkingsCalendarProps) {
  const [statusFilter, setStatusFilter] = useState<CalendarStatusFilter>('valid');
  const [typeFilter, setTypeFilter] = useState<CalendarTypeFilter>('all');
  const [calendarScrolledX, setCalendarScrolledX] = useState(false);
  const [calendarScrolledY, setCalendarScrolledY] = useState(false);
  const weekDays = useMemo(() => buildWeekDays(calendarWeekStart), [calendarWeekStart]);
  const filteredEvents = useMemo(
    () => events.filter((event) => matchesStatusFilter(event, statusFilter) && matchesTypeFilter(event, typeFilter)),
    [events, statusFilter, typeFilter]
  );
  const eventsBySlot = useMemo(() => {
    const slots = new Map<string, WeeklyCalendarEvent[]>();

    for (const event of filteredEvents) {
      const key = `${event.participantId}:${event.activityDate}`;
      const current = slots.get(key) ?? [];
      current.push(event);
      slots.set(key, current);
    }

    for (const rows of slots.values()) {
      rows.sort(compareCalendarEvents);
    }

    return slots;
  }, [filteredEvents]);
  const visibleValidEvents = filteredEvents.filter((event) => statusTone(event.status) === 'success').length;
  const visibleRejectedEvents = filteredEvents.filter((event) => statusTone(event.status) === 'danger').length;
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

  function handleCalendarScroll(event: UIEvent<HTMLDivElement>) {
    const target = event.currentTarget;
    const nextScrolledX = target.scrollLeft > 12;
    const nextScrolledY = target.scrollTop > 12;

    setCalendarScrolledX((current) => (current === nextScrolledX ? current : nextScrolledX));
    setCalendarScrolledY((current) => (current === nextScrolledY ? current : nextScrolledY));
  }

  function renderCalendarCell(participant: Participant, date: string) {
    const rows = eventsBySlot.get(`${participant.id}:${date}`) ?? [];

    if (!rows.length) {
      return <span className="calendar-empty">Sin marca</span>;
    }

    return rows.map((event) => {
      const tone = statusTone(event.status);
      const isCheckIn = event.kind === 0;
      const canInvalidateCheckIn = !readOnly && isCheckIn && event.status.toLowerCase() === 'valid' && onInvalidateCheckIn;
      const canInvalidateToken = !readOnly && !isCheckIn && event.status.toLowerCase() === 'applied' && onInvalidateToken;
      const canInvalidate = canInvalidateCheckIn || canInvalidateToken;

      if (!isCheckIn) {
        const coinIconName = event.coinType === null || event.coinType === undefined ? 'coin-commit' : questCoinIconName(event.coinType);
        const coinLabel = formatEventLabel(event);
        const coinAccessibleLabel = `${coinLabel} usada por ${event.participantName} el ${formatShortDate(event.activityDate)}${
          event.notes ? `. ${event.notes}` : ''
        }`;

        return (
          <div
            className={`calendar-entry calendar-entry--${tone} calendar-entry--coin${readOnly ? '' : ' calendar-entry--coin-actionable'}`}
            key={event.id}
            aria-label={coinAccessibleLabel}
            title={coinAccessibleLabel}
          >
            <div className="calendar-entry__main">
              <strong>{coinLabel}</strong>
              <span>aplicada</span>
            </div>
            <span className="calendar-entry__coin-icon" aria-hidden="true">
              <QuestIcon name={coinIconName} />
            </span>
            {readOnly ? null : (
              <button
                className="icon-button icon-button--danger calendar-entry__action"
                type="button"
                aria-label={`Invalidar coin de ${event.participantName}`}
                disabled={busyActionId === event.id || !canInvalidate}
                onClick={() => onInvalidateToken?.(event)}
              >
                <Ban aria-hidden="true" />
              </button>
            )}
          </div>
        );
      }

      return (
        <div className={`calendar-entry calendar-entry--${tone}`} key={event.id}>
          <div className="calendar-entry__main">
            <strong>{formatEventTime(event)}</strong>
            <span>{formatEventLabel(event)}</span>
          </div>
          <span className={`badge badge--${tone}`}>{event.status}</span>
          {event.notes ? <small>{event.notes}</small> : null}
          {readOnly ? null : (
            <button
              className="icon-button icon-button--danger calendar-entry__action"
              type="button"
              aria-label={`Invalidar ${isCheckIn ? 'check-in' : 'coin'} de ${event.participantName}`}
              disabled={busyActionId === event.id || !canInvalidate}
              onClick={() => {
                onInvalidateCheckIn?.(event);
              }}
            >
              <Ban aria-hidden="true" />
            </button>
          )}
        </div>
      );
    });
  }

  return (
    <section className="panel-section admin-calendar" aria-labelledby={labelledBy}>
      <div className="section-heading section-heading--with-action">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2 id={labelledBy}>{title}</h2>
        </div>
        <div className="calendar-summary" aria-label="Resumen visible">
          <span>{visibleValidEvents} validos</span>
          <span>{visibleRejectedEvents} rejected</span>
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
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.currentTarget.value as CalendarStatusFilter)}
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
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.currentTarget.value as CalendarTypeFilter)}
          >
            <option value="all">Todos</option>
            <option value="0">5am</option>
            <option value="1">Recup. dia</option>
            <option value="2">Recup. finde</option>
            <option value="coin">Coins</option>
          </select>
        </label>
      </div>

      <div
        className={calendarScrollerClassName}
        role="region"
        aria-label="Calendario de marcaciones"
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
  );
}
