import { Dumbbell, Save } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import type { ChallengeSettings, CheckInType, Participant, RegisterCheckInRequest } from '../api/types';

interface CheckInScreenProps {
  selectedParticipant: Participant | null;
  settings?: ChallengeSettings | null;
  onSubmit: (request: RegisterCheckInRequest) => Promise<void>;
}

function localDateTimeValue(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function CheckInScreen({ selectedParticipant, settings, onSubmit }: CheckInScreenProps) {
  const [occurredAt, setOccurredAt] = useState(localDateTimeValue);
  const [type, setType] = useState<CheckInType>(0);
  const [durationMinutes, setDurationMinutes] = useState(settings?.gymMinimumMinutes ?? 45);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedParticipant) {
      setError('Elegir jugador antes de registrar.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      await onSubmit({
        participantId: selectedParticipant.id,
        occurredAt: new Date(occurredAt).toISOString(),
        type,
        durationMinutes,
        createdByParticipantId: selectedParticipant.id,
        notes: notes.trim() || null
      });
      setMessage('Check-in registrado.');
      setNotes('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo registrar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel-section form-screen" aria-labelledby="checkin-title">
      <div className="section-heading">
        <span className="eyebrow">Gym input</span>
        <h2 id="checkin-title">Check-in</h2>
      </div>
      <form className="arcade-form" onSubmit={handleSubmit}>
        <label htmlFor="checkin-type">Tipo</label>
        <select id="checkin-type" value={type} onChange={(event) => setType(Number(event.currentTarget.value) as CheckInType)}>
          <option value={0}>5AM</option>
          <option value={1}>Recuperacion</option>
        </select>

        <label htmlFor="checkin-occurred">Fecha y hora</label>
        <input
          id="checkin-occurred"
          type="datetime-local"
          value={occurredAt}
          onChange={(event) => setOccurredAt(event.currentTarget.value)}
        />

        <label htmlFor="checkin-duration">Minutos</label>
        <input
          id="checkin-duration"
          min={1}
          type="number"
          value={durationMinutes}
          onChange={(event) => setDurationMinutes(Number(event.currentTarget.value))}
        />

        <label htmlFor="checkin-notes">Notas</label>
        <textarea
          id="checkin-notes"
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.currentTarget.value)}
          placeholder="Detalle corto"
        />

        {message ? <div className="alert alert--success">{message}</div> : null}
        {error ? <div className="alert alert--danger">{error}</div> : null}

        <button className="button button--success" type="submit" disabled={submitting || !selectedParticipant}>
          {submitting ? <Dumbbell aria-hidden="true" /> : <Save aria-hidden="true" />}
          Registrar 5AM
        </button>
      </form>
    </section>
  );
}
