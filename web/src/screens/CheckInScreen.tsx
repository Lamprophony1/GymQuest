import { CircleDollarSign, Dumbbell, Save } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import type {
  ChallengeSettings,
  ChallengeSnapshot,
  FullCoverageToken,
  Participant,
  RegisterCheckInRequest,
  UseTokenRequest
} from '../api/types';
import { tokenTypeLabel } from '../components/format';

interface CheckInScreenProps {
  challenge: ChallengeSnapshot | null;
  selectedParticipant: Participant | null;
  settings?: ChallengeSettings | null;
  onSubmit: (request: RegisterCheckInRequest) => Promise<void>;
  onUseToken: (id: string, request: UseTokenRequest) => Promise<void>;
}

function localDateTimeInput(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function defaultCheckInValue(): string {
  const now = new Date();
  return localDateTimeInput(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 5, 0, 0));
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDateOnly(date: Date): string {
  return localDateTimeInput(date).slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function businessDaysForWeek(dateOnly: string): string[] {
  const date = parseDateOnly(dateOnly);
  const day = date.getDay();
  const daysSinceMonday = (day + 6) % 7;
  const monday = addDays(date, -daysSinceMonday);

  return Array.from({ length: 5 }, (_, index) => formatDateOnly(addDays(monday, index)));
}

function isWeekend(dateOnly: string): boolean {
  const day = parseDateOnly(dateOnly).getDay();
  return day === 0 || day === 6;
}

function isCovered(challenge: ChallengeSnapshot | null, participantId: string | undefined, dateOnly: string): boolean {
  if (!challenge || !participantId) {
    return false;
  }

  return (
    challenge.checkIns.some((checkIn) => checkIn.participantId === participantId && checkIn.activityDate === dateOnly) ||
    challenge.fullCoverageTokens.some(
      (token) => token.participantId === participantId && token.targetDate === dateOnly && token.status === 0
    )
  );
}

function tokenDefaultTarget(
  token: FullCoverageToken | null,
  selectedDate: string,
  weekendRecoveryTarget: string,
  targetOptions: string[]
): string {
  if (!token) {
    return '';
  }

  if (token.type === 2) {
    return isWeekend(selectedDate) ? weekendRecoveryTarget : selectedDate;
  }

  return targetOptions[0] ?? (isWeekend(selectedDate) ? weekendRecoveryTarget : selectedDate);
}

export function CheckInScreen({ challenge, selectedParticipant, onSubmit, onUseToken }: CheckInScreenProps) {
  const [occurredAt, setOccurredAt] = useState(defaultCheckInValue);
  const [recoveryTargetDate, setRecoveryTargetDate] = useState('');
  const [tokenTargetDate, setTokenTargetDate] = useState('');
  const [selectedTokenId, setSelectedTokenId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [usingToken, setUsingToken] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedDate = occurredAt.slice(0, 10);
  const weekend = isWeekend(selectedDate);
  const recoveryOptions = useMemo(
    () =>
      businessDaysForWeek(selectedDate).filter(
        (date) => !isCovered(challenge, selectedParticipant?.id, date)
      ),
    [challenge, selectedDate, selectedParticipant?.id]
  );
  const effectiveRecoveryTarget = recoveryTargetDate || recoveryOptions[0] || '';

  const availableTokens = useMemo(
    () =>
      challenge?.fullCoverageTokens.filter(
        (token) => token.participantId === selectedParticipant?.id && token.status === 1
      ) ?? [],
    [challenge?.fullCoverageTokens, selectedParticipant?.id]
  );
  const selectedToken =
    availableTokens.find((token) => token.id === selectedTokenId) ?? availableTokens[0] ?? null;
  const tokenTargetOptions = useMemo(() => {
    if (!selectedToken) {
      return [];
    }

    if (selectedToken.type === 2) {
      return weekend ? recoveryOptions : isCovered(challenge, selectedParticipant?.id, selectedDate) ? [] : [selectedDate];
    }

    return businessDaysForWeek(selectedDate).filter(
      (date) => !isCovered(challenge, selectedParticipant?.id, date)
    );
  }, [challenge, recoveryOptions, selectedDate, selectedParticipant?.id, selectedToken, weekend]);
  const effectiveTokenTarget =
    tokenTargetDate || tokenDefaultTarget(selectedToken, selectedDate, effectiveRecoveryTarget, tokenTargetOptions);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedParticipant) {
      setError('Elegir jugador antes de registrar.');
      return;
    }

    if (weekend && !effectiveRecoveryTarget) {
      setError('No hay dias disponibles para recuperar esta semana.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      await onSubmit({
        participantId: selectedParticipant.id,
        occurredAt: new Date(occurredAt).toISOString(),
        recoveryTargetDate: weekend ? effectiveRecoveryTarget : null,
        createdByParticipantId: selectedParticipant.id,
        notes: null
      });
      setMessage('Check-in registrado.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo registrar.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUseToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedParticipant || !selectedToken || !effectiveTokenTarget) {
      setError('Elegir coin y fecha.');
      return;
    }

    setUsingToken(true);
    setError(null);
    setMessage(null);

    const request: UseTokenRequest = {
      participantId: selectedParticipant.id,
      targetDate: effectiveTokenTarget,
      usedByParticipantId: selectedParticipant.id,
      notes: null
    };

    if (selectedToken.type === 2) {
      request.occurredAt = new Date(occurredAt).toISOString();
      request.recoveryTargetDate = weekend ? effectiveTokenTarget : null;
    }

    try {
      await onUseToken(selectedToken.id, request);
      setMessage('Coin usada.');
      setTokenTargetDate('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo usar coin.');
    } finally {
      setUsingToken(false);
    }
  }

  return (
    <section className="panel-section form-screen" aria-labelledby="checkin-title">
      <div className="section-heading">
        <span className="eyebrow">Gym input</span>
        <h2 id="checkin-title">Check-in</h2>
      </div>

      <form className="arcade-form" onSubmit={handleSubmit}>
        <label htmlFor="checkin-occurred">Fecha y hora</label>
        <input
          id="checkin-occurred"
          type="datetime-local"
          value={occurredAt}
          onChange={(event) => {
            setOccurredAt(event.currentTarget.value);
            setRecoveryTargetDate('');
            setTokenTargetDate('');
          }}
        />

        {weekend ? (
          <>
            <label htmlFor="checkin-recovery-target">Dia a recuperar</label>
            <select
              id="checkin-recovery-target"
              value={effectiveRecoveryTarget}
              onChange={(event) => {
                setRecoveryTargetDate(event.currentTarget.value);
                setTokenTargetDate('');
              }}
              disabled={recoveryOptions.length === 0}
            >
              {recoveryOptions.map((date) => (
                <option key={date} value={date}>
                  {date}
                </option>
              ))}
            </select>
          </>
        ) : null}

        {message ? <div className="alert alert--success">{message}</div> : null}
        {error ? <div className="alert alert--danger">{error}</div> : null}

        <button className="button button--success" type="submit" disabled={submitting || !selectedParticipant}>
          {submitting ? <Dumbbell aria-hidden="true" /> : <Save aria-hidden="true" />}
          Registrar check-in
        </button>
      </form>

      {availableTokens.length ? (
        <form className="arcade-form token-use-form" onSubmit={handleUseToken}>
          <h3>Usar coin</h3>

          <label htmlFor="token-use-id">Coin</label>
          <select
            id="token-use-id"
            value={selectedToken?.id ?? ''}
            onChange={(event) => {
              setSelectedTokenId(event.currentTarget.value);
              setTokenTargetDate('');
            }}
          >
            {availableTokens.map((token) => (
              <option key={token.id} value={token.id}>
                {tokenTypeLabel(token.type)}
              </option>
            ))}
          </select>

          {selectedToken?.type !== 2 ? (
            <>
              <label htmlFor="token-target-date">Fecha a cubrir</label>
              <select
                id="token-target-date"
                value={effectiveTokenTarget}
                onChange={(event) => setTokenTargetDate(event.currentTarget.value)}
                disabled={tokenTargetOptions.length === 0}
              >
                {tokenTargetOptions.map((date) => (
                  <option key={date} value={date}>
                    {date}
                  </option>
                ))}
              </select>
            </>
          ) : null}

          <button
            className="button button--quaternary"
            type="submit"
            disabled={usingToken || !selectedToken || !effectiveTokenTarget}
          >
            {usingToken ? <Dumbbell aria-hidden="true" /> : <CircleDollarSign aria-hidden="true" />}
            Usar coin
          </button>
        </form>
      ) : null}
    </section>
  );
}
