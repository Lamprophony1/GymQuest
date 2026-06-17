import { useCallback, useEffect, useState } from 'react';
import type { Participant } from '../api/types';

const STORAGE_KEY = 'gymchall.identity.v1';

export interface SelectedIdentity {
  mode: 'participant' | 'admin';
  participantId: string;
}

export function loadSelectedIdentity(): SelectedIdentity | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as SelectedIdentity;
    if ((parsed.mode === 'participant' || parsed.mode === 'admin') && parsed.participantId) {
      return parsed;
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return null;
}

export function saveSelectedIdentity(identity: SelectedIdentity | null): void {
  if (!identity) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
}

export function useSelectedIdentity(participants: Participant[]) {
  const [identity, setIdentityState] = useState<SelectedIdentity | null>(() => loadSelectedIdentity());

  useEffect(() => {
    if (!identity) {
      return;
    }

    if (participants.length === 0) {
      return;
    }

    if (!participants.some((participant) => participant.id === identity.participantId)) {
      setIdentityState(null);
      saveSelectedIdentity(null);
    }
  }, [identity, participants]);

  const setIdentity = useCallback((nextIdentity: SelectedIdentity | null) => {
    setIdentityState(nextIdentity);
    saveSelectedIdentity(nextIdentity);
  }, []);

  return { identity, setIdentity };
}
