import { Ban, CircleDollarSign, Save, X } from 'lucide-react';
import { type FormEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ChallengeSnapshot,
  ExceptionReasonCategory,
  ExceptionTokenType,
  FullCoverageToken,
  GrantTokenRequest,
  Participant
} from '../api/types';
import {
  coinDisplayTone,
  coinTone,
  coinTypes,
  reasonCategoryLabel,
  specialCoinOptions,
  tokenDisplayLabel,
  tokenTypeLabel
} from '../components/format';
import { PlayerAvatar } from '../components/PlayerAvatar';

interface TokenScreenProps {
  challenge: ChallengeSnapshot | null;
  participants: Participant[];
  selectedParticipant: Participant | null;
  adminParticipantId?: string | null;
  onSubmit: (request: GrantTokenRequest) => Promise<void>;
  onInvalidateToken: (id: string, reason?: string) => Promise<void>;
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

function isAvailableToken(token: FullCoverageToken): boolean {
  return token.status === 1;
}

function coinKey(token: Pick<FullCoverageToken, 'type' | 'specialCode'>): string {
  return token.specialCode?.trim() ? `special:${token.specialCode}` : `type:${token.type}`;
}

function availableTokensForParticipant(challenge: ChallengeSnapshot | null, participantId: string): FullCoverageToken[] {
  return (challenge?.fullCoverageTokens ?? [])
    .filter((token) => token.participantId === participantId && isAvailableToken(token))
    .sort((first, second) => tokenDisplayLabel(first).localeCompare(tokenDisplayLabel(second)));
}

function baseCoinCount(tokens: FullCoverageToken[], type: ExceptionTokenType): number {
  return tokens.filter((token) => !token.specialCode && token.type === type).length;
}

function specialCoinGroups(tokens: FullCoverageToken[]): Array<{ key: string; token: FullCoverageToken; count: number }> {
  const groups = new Map<string, { token: FullCoverageToken; count: number }>();

  for (const token of tokens) {
    if (!token.specialCode) {
      continue;
    }

    const key = coinKey(token);
    const existing = groups.get(key);
    groups.set(key, {
      token,
      count: (existing?.count ?? 0) + 1
    });
  }

  return [...groups.entries()].map(([key, value]) => ({ key, ...value }));
}

export function TokenScreen({
  challenge,
  participants,
  selectedParticipant,
  adminParticipantId,
  onSubmit,
  onInvalidateToken
}: TokenScreenProps) {
  const activeParticipants = useMemo(() => participants.filter((participant) => participant.active), [participants]);
  const [participantId, setParticipantId] = useState(selectedParticipant?.id ?? activeParticipants[0]?.id ?? '');
  const [assigningParticipantId, setAssigningParticipantId] = useState<string | null>(null);
  const [removeToken, setRemoveToken] = useState<FullCoverageToken | null>(null);
  const [type, setType] = useState<ExceptionTokenType>(0);
  const [reasonCategory, setReasonCategory] = useState<ExceptionReasonCategory>(0);
  const [variant, setVariant] = useState<TokenVariant>('normal');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const assignButtonRef = useRef<HTMLButtonElement | null>(null);
  const removeButtonRef = useRef<HTMLButtonElement | null>(null);
  const totalAvailable = useMemo(
    () => (challenge?.fullCoverageTokens ?? []).filter(isAvailableToken).length,
    [challenge]
  );
  const specialAvailable = useMemo(
    () => (challenge?.fullCoverageTokens ?? []).filter((token) => isAvailableToken(token) && Boolean(token.specialCode)).length,
    [challenge]
  );

  function openAssignDialog(nextParticipantId: string, trigger: HTMLButtonElement) {
    setParticipantId(nextParticipantId);
    assignButtonRef.current = trigger;
    setAssigningParticipantId(nextParticipantId);
    setError(null);
    setMessage(null);
  }

  function closeAssignDialog() {
    setAssigningParticipantId(null);
    assignButtonRef.current?.focus();
  }

  function openRemoveDialog(token: FullCoverageToken, trigger: HTMLButtonElement) {
    setRemoveToken(token);
    removeButtonRef.current = trigger;
    setError(null);
    setMessage(null);
  }

  function closeRemoveDialog() {
    setRemoveToken(null);
    removeButtonRef.current?.focus();
  }

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
      setMessage('Coin asignada.');
      setNotes('');
      closeAssignDialog();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo asignar coin.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveToken() {
    const actorId = adminParticipantId || selectedParticipant?.id;
    if (!removeToken || !actorId) {
      setError('Falta coin para quitar.');
      return;
    }

    setRemoving(true);
    setError(null);
    setMessage(null);

    try {
      await onInvalidateToken(removeToken.id, `Admin ${actorId}`);
      setMessage('Coin quitada.');
      closeRemoveDialog();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'No se pudo quitar coin.');
    } finally {
      setRemoving(false);
    }
  }

  return (
    <section className="panel-section coin-admin-screen" aria-labelledby="token-title">
      <div className="section-heading section-heading--with-action">
        <div>
          <span className="eyebrow">Power-up</span>
          <h2 id="token-title">Administrar coins</h2>
        </div>
      </div>
      <div className="coin-admin-summary" aria-label="Resumen de coins">
        <span><strong>{activeParticipants.length}</strong> players</span>
        <span><strong>{totalAvailable}</strong> disponibles</span>
        <span><strong>{specialAvailable}</strong> especiales</span>
      </div>
      {message ? <div className="alert alert--success">{message}</div> : null}
      {error && !assigningParticipantId && !removeToken ? <div className="alert alert--danger">{error}</div> : null}
      <div className="coin-admin-grid">
        {activeParticipants.map((participant) => {
          const availableTokens = availableTokensForParticipant(challenge, participant.id);
          const specials = specialCoinGroups(availableTokens);

          return (
            <article className="player-coin-card" key={participant.id} aria-label={`Coins de ${participant.displayName}`}>
              <div className="player-coin-card__header">
                <PlayerAvatar participant={participant} />
                <div>
                  <h3>{participant.displayName}</h3>
                  <span>@{participant.username}</span>
                </div>
              </div>
              <div className="player-coin-card__counts" aria-label={`Conteos de coins de ${participant.displayName}`}>
                {coinTypes.map((coinType) => (
                  <span className={`coin-chip coin-chip--${coinTone(coinType)}`} key={coinType}>
                    <span>{tokenTypeLabel(coinType)} x{baseCoinCount(availableTokens, coinType)}</span>
                  </span>
                ))}
                {specials.map((group) => (
                  <span className={`coin-chip coin-chip--${coinDisplayTone(group.token)}`} key={group.key}>
                    <span>{tokenDisplayLabel(group.token)} x{group.count}</span>
                  </span>
                ))}
              </div>
              <div className="player-coin-card__available">
                <strong>Disponibles</strong>
                {availableTokens.length ? (
                  availableTokens.map((token) => (
                    <div className="player-coin-token-row" key={token.id}>
                      <span>{tokenDisplayLabel(token)}</span>
                      <button
                        className="button button--danger"
                        type="button"
                        aria-label={`Quitar ${tokenDisplayLabel(token)} de ${participant.displayName}`}
                        onClick={(event) => openRemoveDialog(token, event.currentTarget)}
                      >
                        <Ban aria-hidden="true" />
                        Quitar
                      </button>
                    </div>
                  ))
                ) : (
                  <span className="empty-state">Sin coins disponibles.</span>
                )}
              </div>
              <button
                className="button button--quaternary"
                type="button"
                aria-label={`Asignar coin a ${participant.displayName}`}
                onClick={(event) => openAssignDialog(participant.id, event.currentTarget)}
              >
                <CircleDollarSign aria-hidden="true" />
                Asignar coin
              </button>
            </article>
          );
        })}
      </div>
      {assigningParticipantId ? (
        <AssignCoinDialog
          participants={activeParticipants}
          participantId={participantId}
          type={type}
          reasonCategory={reasonCategory}
          variant={variant}
          notes={notes}
          submitting={submitting}
          error={error}
          onSubmit={handleSubmit}
          onClose={closeAssignDialog}
          onVariantChange={(nextVariant) => {
            setVariant(nextVariant);
            if (nextVariant === 'albirroja') {
              setType(1);
              setReasonCategory(4);
            }
          }}
          onTypeChange={(nextType) => {
            setType(nextType);
            setReasonCategory(defaultReasonForType(nextType));
          }}
          onReasonChange={setReasonCategory}
          onNotesChange={setNotes}
        />
      ) : null}
      {removeToken ? (
        <RemoveCoinDialog
          token={removeToken}
          participant={activeParticipants.find((participant) => participant.id === removeToken.participantId) ?? null}
          removing={removing}
          error={error}
          onConfirm={handleRemoveToken}
          onClose={closeRemoveDialog}
        />
      ) : null}
    </section>
  );
}

interface AssignCoinDialogProps {
  participants: Participant[];
  participantId: string;
  type: ExceptionTokenType;
  reasonCategory: ExceptionReasonCategory;
  variant: TokenVariant;
  notes: string;
  submitting: boolean;
  error: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onClose: () => void;
  onVariantChange: (variant: TokenVariant) => void;
  onTypeChange: (type: ExceptionTokenType) => void;
  onReasonChange: (reason: ExceptionReasonCategory) => void;
  onNotesChange: (notes: string) => void;
}

function AssignCoinDialog({
  participants,
  participantId,
  type,
  reasonCategory,
  variant,
  notes,
  submitting,
  error,
  onSubmit,
  onClose,
  onVariantChange,
  onTypeChange,
  onReasonChange,
  onNotesChange
}: AssignCoinDialogProps) {
  const participant = participants.find((item) => item.id === participantId);
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      onClose();
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation" onKeyDown={handleKeyDown}>
      <section className="dialog-panel" role="dialog" aria-modal="true" aria-labelledby="assign-coin-title">
        <div className="dialog-panel__header">
          <div>
            <span className="eyebrow">Confirmacion</span>
            <h3 id="assign-coin-title" ref={titleRef} tabIndex={-1}>Asignar coin</h3>
          </div>
          <button className="icon-button" type="button" aria-label="Cerrar asignacion de coin" onClick={onClose}>
            <X aria-hidden="true" />
          </button>
        </div>
        <form className="arcade-form" onSubmit={onSubmit}>
          <div className="dialog-player-lock">
            <strong>{participant?.displayName ?? 'Player'}</strong>
            <span>Player seleccionado</span>
          </div>
          <label htmlFor="token-variant">Variante</label>
          <select id="token-variant" value={variant} onChange={(event) => onVariantChange(event.currentTarget.value as TokenVariant)}>
            <option value="normal">Normal</option>
            {specialCoinOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
          <label htmlFor="token-type">Tipo</label>
          <select id="token-type" value={type} disabled={variant !== 'normal'} onChange={(event) => onTypeChange(Number(event.currentTarget.value) as ExceptionTokenType)}>
            {tokenTypeOptions.map((option) => (
              <option key={option} value={option}>
                {tokenTypeLabel(option)}
              </option>
            ))}
          </select>
          <label htmlFor="token-reason">Motivo</label>
          <select id="token-reason" value={reasonCategory} disabled={variant !== 'normal'} onChange={(event) => onReasonChange(Number(event.currentTarget.value) as ExceptionReasonCategory)}>
            {reasonOptions.map((option) => (
              <option key={option} value={option}>
                {reasonCategoryLabel(option)}
              </option>
            ))}
          </select>
          <label htmlFor="token-notes">Notas</label>
          <textarea id="token-notes" rows={3} value={notes} onChange={(event) => onNotesChange(event.currentTarget.value)} placeholder="Justificacion breve" />
          {error ? <div className="alert alert--danger">{error}</div> : null}
          <div className="dialog-actions">
            <button className="button button--secondary" type="button" onClick={onClose}>
              Cancelar
            </button>
            <button className="button button--quaternary" type="submit" disabled={submitting || !participantId}>
              {submitting ? <CircleDollarSign aria-hidden="true" /> : <Save aria-hidden="true" />}
              Confirmar asignacion
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

interface RemoveCoinDialogProps {
  token: FullCoverageToken;
  participant: Participant | null;
  removing: boolean;
  error: string | null;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

function RemoveCoinDialog({ token, participant, removing, error, onConfirm, onClose }: RemoveCoinDialogProps) {
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      onClose();
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation" onKeyDown={handleKeyDown}>
      <section className="dialog-panel" role="dialog" aria-modal="true" aria-labelledby="remove-coin-title">
        <div className="dialog-panel__header">
          <div>
            <span className="eyebrow">Confirmacion</span>
            <h3 id="remove-coin-title" ref={titleRef} tabIndex={-1}>Quitar coin</h3>
          </div>
          <button className="icon-button" type="button" aria-label="Cerrar quitar coin" onClick={onClose}>
            <X aria-hidden="true" />
          </button>
        </div>
        <p className="dialog-copy">
          Quitar {tokenDisplayLabel(token)} de {participant?.displayName ?? 'este player'}.
        </p>
        {token.notes ? <p className="dialog-note">{token.notes}</p> : null}
        {error ? <div className="alert alert--danger">{error}</div> : null}
        <div className="dialog-actions">
          <button className="button button--secondary" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="button button--danger" type="button" disabled={removing} onClick={() => void onConfirm()}>
            <Ban aria-hidden="true" />
            Quitar coin
          </button>
        </div>
      </section>
    </div>
  );
}
