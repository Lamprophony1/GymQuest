import { useCallback, useEffect, useMemo, useState } from 'react';
import { gymChallApi } from '../api/client';
import type {
  AdminCheckIn,
  AdminToken,
  ChallengeSnapshot,
  Couple,
  Participant,
  RankingRow,
  WeeklyRanking
} from '../api/types';

export interface GymChallDataState {
  challenge: ChallengeSnapshot | null;
  participants: Participant[];
  couples: Couple[];
  ranking: RankingRow[];
  weeklyRankings: WeeklyRanking[];
  recentCheckIns: AdminCheckIn[];
  recentTokens: AdminToken[];
  loading: boolean;
  error: string | null;
}

export function useGymChallData() {
  const [state, setState] = useState<GymChallDataState>({
    challenge: null,
    participants: [],
    couples: [],
    ranking: [],
    weeklyRankings: [],
    recentCheckIns: [],
    recentTokens: [],
    loading: true,
    error: null
  });

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const today = new Date();
      const [challenge, participants, couples, ranking, weeklyRankings, recentCheckIns, recentTokens] =
        await Promise.all([
          gymChallApi.getChallenge(),
          gymChallApi.listParticipants(),
          gymChallApi.listCouples(),
          gymChallApi.getGeneralRanking(today),
          gymChallApi.getWeeklyRankings(today),
          gymChallApi.listRecentCheckIns(),
          gymChallApi.listRecentTokens()
        ]);

      setState({
        challenge,
        participants,
        couples,
        ranking,
        weeklyRankings,
        recentCheckIns,
        recentTokens,
        loading: false,
        error: null
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error instanceof Error ? error.message : 'No se pudo cargar GymChall.'
      }));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return useMemo(() => ({ ...state, refresh }), [state, refresh]);
}
