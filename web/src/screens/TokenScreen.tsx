import { Save, Ticket } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import type {
  CreateFullCoverageTokenRequest,
  ExceptionReasonCategory,
  Participant
} from '../api/types';
import { reasonCategoryLabel } from '../components/format';

interface TokenScreenProps {
  participants: Participant[];
  selectedParticipant: Participant | null;
  adminParticipantId?: string | null;
  onSubmit: (request: CreateFullCoverageTokenRequest) => Promise<void>;
}

function todayValue(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

const reasonOptions: ExceptionReasonCategory[] = [0, 1, 2, 3, 4];

export function TokenScreen({ participants, selectedParticipant, adminParticipantId, onSubmit }: TokenScreenProps) {
  const activeParticipants = useMemo(() => participants.filter((participant) => participant.active), [participants]);
  const [participantId, setParticipantId] = useState(selectedParticipant?.id ?? activeParticipants[0]?.id ?? '');
  const [targetDate, setTargetDate] = useState(todayValue);
  const [reasonCategory, setReasonCategory] = useState<ExceptionReasonCategory>(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const actorId = adminParticipantId || selectedParticipant?.id;
    if (!participantId || !actorId) {
      setError('Falta jugador para la ficha.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      await onSubmit({
        participantId,
        targetDate,
        reasonCategory,
        assignedByAdminId: actorId,
        notes: notes.trim() || null
      });
      setMessage('Ficha cargada.');
      setNotes('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo cargar la ficha.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel-section form-screen" aria-labelledby="token-title">
      <div className="section-heading">
        <span className="eyebrow">Power-up</span>
        <h2 id="token-title">Ficha</h2>
      </div>
      <form className="arcade-form" onSubmit={handleSubmit}>
        <label htmlFor="token-participant">Jugador</label>
        <select id="token-participant" value={participantId} onChange={(event) => setParticipantId(event.currentTarget.value)}>
          {activeParticipants.map((participant) => (
            <option key={participant.id} value={participant.id}>
              {participant.displayName}
            </option>
          ))}
        </select>

        <label htmlFor="token-date">Fecha objetivo</label>
        <input id="token-date" type="date" value={targetDate} onChange={(event) => setTargetDate(event.currentTarget.value)} />

        <label htmlFor="token-reason">Motivo</label>
        <select
          id="token-reason"
          value={reasonCategory}
          onChange={(event) => setReasonCategory(Number(event.currentTarget.value) as ExceptionReasonCategory)}
        >
          {reasonOptions.map((option) => (
            <option key={option} value={option}>
              {reasonCategoryLabel(option)}
            </option>
          ))}
        </select>

        <label htmlFor="token-notes">Notas</label>
        <textarea
          id="token-notes"
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.currentTarget.value)}
          placeholder="Justificacion breve"
        />

        {message ? <div className="alert alert--success">{message}</div> : null}
        {error ? <div className="alert alert--danger">{error}</div> : null}

        <button className="button button--quaternary" type="submit" disabled={submitting || !participantId}>
          {submitting ? <Ticket aria-hidden="true" /> : <Save aria-hidden="true" />}
          Cargar ficha
        </button>
      </form>
    </section>
  );
}
