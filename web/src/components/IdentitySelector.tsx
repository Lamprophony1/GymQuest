import { Shield, UserRound } from 'lucide-react';
import type { ChallengeSnapshot, Participant } from '../api/types';
import type { SelectedIdentity } from '../state/useSelectedIdentity';

interface IdentitySelectorProps {
  challenge: ChallengeSnapshot | null;
  participants: Participant[];
  onSelect: (identity: SelectedIdentity) => void;
}

export function IdentitySelector({ challenge, participants, onSelect }: IdentitySelectorProps) {
  const activeParticipants = participants.filter((participant) => participant.active);
  const admin =
    activeParticipants.find((participant) => participant.id === challenge?.challenge.adminParticipantId) ??
    activeParticipants.find((participant) => participant.role === 1) ??
    activeParticipants[0];

  return (
    <main className="identity-screen">
      <section className="identity-card" aria-labelledby="identity-title">
        <span className="eyebrow">Insert coin</span>
        <h1 id="identity-title">GymChall</h1>
        <p>{challenge?.challenge.name ?? 'Reto fitness por parejas'}</p>
        <div className="identity-grid" aria-label="Participantes">
          {activeParticipants.map((participant) => (
            <button
              className="button button--secondary identity-button"
              key={participant.id}
              type="button"
              onClick={() => onSelect({ mode: 'participant', participantId: participant.id })}
            >
              <UserRound aria-hidden="true" />
              <span>
                <strong>{participant.displayName}</strong>
                <small>@{participant.username}</small>
              </span>
            </button>
          ))}
        </div>
        {admin ? (
          <button
            className="button button--dark identity-admin"
            type="button"
            onClick={() => onSelect({ mode: 'admin', participantId: admin.id })}
          >
            <Shield aria-hidden="true" />
            Admin
          </button>
        ) : null}
      </section>
    </main>
  );
}
