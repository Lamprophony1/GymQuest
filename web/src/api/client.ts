import type {
  AdminCheckIn,
  AdminToken,
  ChallengeSettings,
  ChallengeSnapshot,
  Couple,
  CreateCoupleRequest,
  CreatedRecord,
  CreateFullCoverageTokenRequest,
  CreateParticipantRequest,
  InvalidateRecordRequest,
  Participant,
  RankingRow,
  RegisterCheckInRequest,
  WeeklyRanking
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers
    },
    ...init
  });

  if (!response.ok) {
    throw new Error(`API ${response.status}: ${response.statusText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function formatApiDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function jsonPost<TBody>(body: TBody): RequestInit {
  return {
    method: 'POST',
    body: JSON.stringify(body)
  };
}

export const gymChallApi = {
  getChallenge: () => apiRequest<ChallengeSnapshot>('/api/challenge'),
  getSettings: () => apiRequest<ChallengeSettings>('/api/challenge/settings'),
  listParticipants: () => apiRequest<Participant[]>('/api/participants'),
  createParticipant: (request: CreateParticipantRequest) =>
    apiRequest<CreatedRecord>('/api/participants', jsonPost(request)),
  listCouples: () => apiRequest<Couple[]>('/api/couples'),
  createCouple: (request: CreateCoupleRequest) => apiRequest<CreatedRecord>('/api/couples', jsonPost(request)),
  registerCheckIn: (request: RegisterCheckInRequest) =>
    apiRequest<CreatedRecord>('/api/check-ins', jsonPost(request)),
  createFullCoverageToken: (request: CreateFullCoverageTokenRequest) =>
    apiRequest<CreatedRecord>('/api/tokens/full-coverage', jsonPost(request)),
  invalidateCheckIn: (id: string, request: InvalidateRecordRequest) =>
    apiRequest<void>(`/api/admin/check-ins/${id}/invalidate`, jsonPost(request)),
  invalidateToken: (id: string, request: InvalidateRecordRequest) =>
    apiRequest<void>(`/api/admin/tokens/${id}/invalidate`, jsonPost(request)),
  listRecentCheckIns: (limit = 50) => apiRequest<AdminCheckIn[]>(`/api/admin/check-ins?limit=${limit}`),
  listRecentTokens: (limit = 50) => apiRequest<AdminToken[]>(`/api/admin/tokens?limit=${limit}`),
  getGeneralRanking: (throughDate: Date) =>
    apiRequest<RankingRow[]>(`/api/rankings/general?throughDate=${formatApiDate(throughDate)}`),
  getWeeklyRankings: (throughDate: Date) =>
    apiRequest<WeeklyRanking[]>(`/api/rankings/weeks?throughDate=${formatApiDate(throughDate)}`),
  getWeeklyRanking: (weekStartDate: string, throughDate: Date) =>
    apiRequest<WeeklyRanking>(
      `/api/rankings/weeks/${weekStartDate}?throughDate=${formatApiDate(throughDate)}`
    )
};
