import { CircleDollarSign, Save } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import type {
  ExceptionReasonCategory,
  ExceptionTokenType,
  GrantTokenRequest,
  Participant
} from '../api/types';
import { reasonCategoryLabel, specialCoinOptions, tokenTypeLabel } from '../components/format';

interface TokenScreenProps {
  participants: Participant[];
  selectedParticipant: Participant | null;
  adminParticipantId?: string | null;
  onSubmit: (request: GrantTokenRequest) => Promise<void>;
}

const tokenTypeOptions: ExceptionTokenType[] = [0, 1, 2];
const reasonOptions: ExceptionReasonCategory[] = [0, 1, 2, 3, 4];
type TokenVariant = 'normal' | (typeof specialCoinOptions)[number]['code'];

function defaultReasonForType(type: ExceptionTokenType): ExceptionReasonCategory {
  if (type === 0) {
    return 0;
  }

  if (type === 1) {
    return 3;
  }

  return 4;
}

export function TokenScreen({ participants, selectedParticipant, adminParticipantId, onSubmit }: TokenScreenProps) {
  const activeParticipants = useMemo(() => participants.filter((participant) => participant.active), [participants]);
  const [participantId, setParticipantId] = useState(selectedParticipant?.id ?? activeParticipants[0]?.id ?? '');
  const [type, setType] = useState<ExceptionTokenType>(0);
  const [reasonCategory, setReasonCategory] = useState<ExceptionReasonCategory>(0);
  const [variant, setVariant] = useState<TokenVariant>('normal');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const actorId = adminParticipantId || selectedParticipant?.id;
    if (!participantId || !actorId) {
      setError('Falta jugador para otorgar coin.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      await onSubmit({
        participantId,
        type,
        reasonCategory,
        assignedByAdminId: actorId,
        notes: notes.trim() || null,
        specialCode: variant === 'normal' ? null : variant
      });
      setMessage('Coin otorgada.');
      setNotes('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo otorgar coin.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel-section form-screen" aria-labelledby="token-title">
      <div className="section-heading">
        <span className="eyebrow">Power-up</span>
        <h2 id="token-title">Otorgar coin</h2>
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

        <label htmlFor="token-variant">Variante</label>
        <select
          id="token-variant"
          value={variant}
          onChange={(event) => {
            const nextVariant = event.currentTarget.value as TokenVariant;
            setVariant(nextVariant);
            if (nextVariant === 'albirroja') {
              setType(1);
              setReasonCategory(4);
            }
          }}
        >
          <option value="normal">Normal</option>
          {specialCoinOptions.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>

        <label htmlFor="token-type">Tipo</label>
        <select
          id="token-type"
          value={type}
          disabled={variant !== 'normal'}
          onChange={(event) => {
            const nextType = Number(event.currentTarget.value) as ExceptionTokenType;
            setType(nextType);
            setReasonCategory(defaultReasonForType(nextType));
          }}
        >
          {tokenTypeOptions.map((option) => (
            <option key={option} value={option}>
              {tokenTypeLabel(option)}
            </option>
          ))}
        </select>

        <label htmlFor="token-reason">Motivo</label>
        <select
          id="token-reason"
          value={reasonCategory}
          disabled={variant !== 'normal'}
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
          {submitting ? <CircleDollarSign aria-hidden="true" /> : <Save aria-hidden="true" />}
          Otorgar coin
        </button>
      </form>
    </section>
  );
}
