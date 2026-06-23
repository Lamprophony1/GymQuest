import type { Participant, WeeklyCalendarEvent } from '../api/types';
import { WeeklyMarkingsCalendar } from '../components/WeeklyMarkingsCalendar';

interface MarkingsScreenProps {
  participants: Participant[];
  calendarEvents: WeeklyCalendarEvent[];
  calendarWeekStart: string;
  onCalendarWeekChange: (weekStart: string) => void;
}

export function MarkingsScreen({
  participants,
  calendarEvents,
  calendarWeekStart,
  onCalendarWeekChange
}: MarkingsScreenProps) {
  return (
    <div className="screen-stack">
      <WeeklyMarkingsCalendar
        participants={participants}
        events={calendarEvents}
        calendarWeekStart={calendarWeekStart}
        onCalendarWeekChange={onCalendarWeekChange}
        title="Marcaciones semanales"
        eyebrow="Marcaciones"
        readOnly
        labelledBy="markings-calendar-title"
      />
    </div>
  );
}
