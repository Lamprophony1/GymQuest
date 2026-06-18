import { UserRound } from 'lucide-react';
import type { Participant } from '../api/types';

interface PlayerAvatarProps {
  participant: Participant;
  variant?: 'profile' | 'header';
}

const avatarSources: Record<string, string> = {
  chachi: '/avatars/chachi.png',
  cieli: '/avatars/cieli.png',
  clari: '/avatars/clari.png',
  naldo: '/avatars/naldo.png',
  obelar: '/avatars/obelar.png',
  rafa: '/avatars/rafa.png'
};

function initials(displayName: string): string {
  return displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';
}

export function PlayerAvatar({ participant, variant = 'profile' }: PlayerAvatarProps) {
  const username = participant.username.toLowerCase();
  const avatarSrc = avatarSources[username];
  const className = [
    'player-avatar',
    avatarSrc ? 'player-avatar--sticker' : null,
    variant === 'profile' ? 'player-avatar--profile-token' : null,
    variant === 'profile' && avatarSrc && username !== 'rafa' ? 'player-avatar--profile-subtle-zoom' : null,
    variant === 'header' ? 'player-avatar--header' : null
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={className} aria-hidden="true">
      {avatarSrc ? (
        <img className="player-avatar__image" src={avatarSrc} alt="" />
      ) : (
        <>
          <UserRound />
          <strong>{initials(participant.displayName)}</strong>
        </>
      )}
    </span>
  );
}
