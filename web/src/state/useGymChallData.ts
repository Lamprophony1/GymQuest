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
import { addDaysToDateOnly, startOfWeekMonday } from '../utils/date';

export interface GymChallDataState {
  challenge: ChallengeSnapshot | null;
  participants: Participant[];
  couples: Couple[];
  ranking: RankingRow[];
  weeklyRankings: WeeklyRanking[];
  recentCheckIns: AdminCheckIn[];
  calendarCheckIns: AdminCheckIn[];
  recentTokens: AdminToken[];
  loading: boolean;
  error: string | null;
}

interface UseGymChallDataOptions {
  enabled?: boolean;
  includeAdmin?: boolean;
}

function createEmptyState(loading: boolean): GymChallDataState {
  return {
    challenge: null,
    participants: [],
    couples: [],
    ranking: [],
    weeklyRankings: [],
    recentCheckIns: [],
    calendarCheckIns: [],
    recentTokens: [],
    loading,
    error: null
  };
}

export function useGymChallData({ enabled = true, includeAdmin = true }: UseGymChallDataOptions = {}) {
  const [state, setState] = useState<GymChallDataState>({
    challenge: null,
    participants: [],
    couples: [],
    ranking: [],
    weeklyRankings: [],
    recentCheckIns: [],
    calendarCheckIns: [],
    recentTokens: [],
    loading: true,
    error: null
  });
  const [calendarWeekStart, setCalendarWeekStart] = useState(() => startOfWeekMonday());

  const refresh = useCallback(async () => {
    if (!enabled) {
      setState(createEmptyState(false));
      return;
    }

    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const calendarWeekEnd = addDaysToDateOnly(calendarWeekStart, 6);
      const [challenge, participants, couples, ranking, weeklyRankings, recentCheckIns, calendarCheckIns, recentTokens] =
        await Promise.all([
          gymChallApi.getChallenge(),
          gymChallApi.listParticipants(),
          gymChallApi.listCouples(),
          gymChallApi.getGeneralRanking(),
          gymChallApi.getWeeklyRankings(),
          includeAdmin ? gymChallApi.listRecentCheckIns() : Promise.resolve([]),
          includeAdmin ? gymChallApi.listCalendarCheckIns(calendarWeekStart, calendarWeekEnd) : Promise.resolve([]),
          includeAdmin ? gymChallApi.listRecentTokens() : Promise.resolve([])
        ]);

      setState({
        challenge,
        participants,
        couples,
        ranking,
        weeklyRankings,
        recentCheckIns,
        calendarCheckIns,
        recentTokens,
        loading: false,
        error: null
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error instanceof Error ? error.message : 'No se pudo cargar Proyecto RM.'
      }));
    }
  }, [calendarWeekStart, enabled, includeAdmin]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return useMemo(
    () => ({ ...state, calendarWeekStart, refresh, setCalendarWeekStart }),
    [calendarWeekStart, state, refresh]
  );
}
