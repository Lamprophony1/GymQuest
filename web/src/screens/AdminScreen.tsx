import { Ban, Plus, Shield, Users } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import type {
  AdminCheckIn,
  AdminToken,
  Couple,
  CreateCoupleRequest,
  CreateParticipantRequest,
  Participant,
  ParticipantRole
} from '../api/types';
import { checkInTypeLabel, formatShortDate, reasonCategoryLabel, statusTone, tokenTypeLabel } from '../components/format';

interface AdminScreenProps {
  participants: Participant[];
  couples: Couple[];
  recentCheckIns: AdminCheckIn[];
  recentTokens: AdminToken[];
  adminParticipantId: string;
  onCreateParticipant: (request: CreateParticipantRequest) => Promise<void>;
  onCreateCouple: (request: CreateCoupleRequest) => Promise<void>;
  onInvalidateCheckIn: (id: string, reason?: string) => Promise<void>;
  onInvalidateToken: (id: string, reason?: string) => Promise<void>;
}

export function AdminScreen({
  participants,
  couples,
  recentCheckIns,
  recentTokens,
  adminParticipantId,
  onCreateParticipant,
  onCreateCouple,
  onInvalidateCheckIn,
  onInvalidateToken
}: AdminScreenProps) {
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
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  useEffect(() => {
    setCoupleForm((current) => ({
      ...current,
      firstParticipantId: current.firstParticipantId || participants[0]?.id || '',
      secondParticipantId: current.secondParticipantId || participants[1]?.id || participants[0]?.id || ''
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

      <section className="panel-section" aria-labelledby="admin-create-title">
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
        </div>
      </section>

      <section className="panel-section" aria-labelledby="recent-title">
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
                    <span>{formatShortDate(checkIn.activityDate)} - {checkInTypeLabel(checkIn.type)}</span>
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
            <h3>Fichas</h3>
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
                    aria-label={`Invalidar ficha de ${token.participantName}`}
                    disabled={busyAction === token.id || token.status.toLowerCase() === 'rejected'}
                    onClick={() =>
                      runAdminAction(
                        token.id,
                        () => onInvalidateToken(token.id, `Admin ${adminParticipantId}`),
                        'Ficha invalidada.'
                      )
                    }
                  >
                    <Ban aria-hidden="true" />
                  </button>
                </div>
              ))
            ) : (
              <p className="empty-state">Sin fichas recientes.</p>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}
