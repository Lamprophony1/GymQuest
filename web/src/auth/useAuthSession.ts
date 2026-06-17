import { useCallback, useEffect, useMemo, useState } from 'react';
import { gymChallApi } from '../api/client';
import type { AuthenticatedParticipant, LoginOption, LoginRequest } from '../api/types';
import type { AuthMode } from './authMode';

interface AuthSessionState {
  participant: AuthenticatedParticipant | null;
  loginOptions: LoginOption[];
  loading: boolean;
  error: string | null;
}

export function useAuthSession(mode: AuthMode) {
  const [state, setState] = useState<AuthSessionState>({
    participant: null,
    loginOptions: [],
    loading: mode === 'pin-login',
    error: null
  });

  const refresh = useCallback(async () => {
    if (mode === 'dev-selector') {
      setState({
        participant: null,
        loginOptions: [],
        loading: false,
        error: null
      });
      return;
    }

    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const [loginOptions, authResponse] = await Promise.all([
        gymChallApi.listLoginOptions(),
        gymChallApi.getCurrentParticipant()
      ]);

      setState({
        participant: authResponse?.participant ?? null,
        loginOptions,
        loading: false,
        error: null
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error instanceof Error ? error.message : 'No se pudo cargar la sesion.'
      }));
    }
  }, [mode]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (request: LoginRequest) => {
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const response = await gymChallApi.login(request);
      setState((current) => ({
        ...current,
        participant: response.participant,
        loading: false,
        error: null
      }));
      return response.participant;
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error instanceof Error ? error.message : 'No se pudo iniciar sesion.'
      }));
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      await gymChallApi.logout();
    } finally {
      setState((current) => ({
        ...current,
        participant: null,
        loading: false,
        error: null
      }));
    }
  }, []);

  return useMemo(() => ({ ...state, refresh, login, logout }), [state, refresh, login, logout]);
}
