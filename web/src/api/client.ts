import type {
  AdminCheckIn,
  AdminToken,
  AuthResponse,
  ChallengeSettings,
  ChallengeSnapshot,
  ChangePinRequest,
  Couple,
  CreateCoupleRequest,
  CreatedRecord,
  CreateFullCoverageTokenRequest,
  CreateParticipantRequest,
  GrantTokenRequest,
  InvalidateRecordRequest,
  LoginOption,
  LoginRequest,
  Participant,
  ParticipantProfile,
  RankingRow,
  RegisterCheckInRequest,
  SetPinRequest,
  UpdateParticipantProfileRequest,
  UseTokenRequest,
  WeeklyCalendarEvent,
  WeeklyRanking
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
const CHALLENGE_TIMEZONE = 'America/Asuncion';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    message?: string
  ) {
    super(message ?? `API ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers
    },
    ...init
  });

  if (!response.ok) {
    let message: string | undefined;
    try {
      const body = (await response.json()) as { message?: string };
      message = body.message;
    } catch {
      message = undefined;
    }

    throw new ApiError(response.status, response.statusText, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function formatApiDate(date: Date, timeZone = CHALLENGE_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    return date.toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

function jsonPost<TBody>(body: TBody): RequestInit {
  return {
    method: 'POST',
    body: JSON.stringify(body)
  };
}

function jsonPut<TBody>(body: TBody): RequestInit {
  return {
    method: 'PUT',
    body: JSON.stringify(body)
  };
}

export const gymChallApi = {
  listLoginOptions: () => apiRequest<LoginOption[]>('/api/auth/login-options'),
  login: (request: LoginRequest) => apiRequest<AuthResponse>('/api/auth/login', jsonPost(request)),
  getCurrentParticipant: async () => {
    try {
      return await apiRequest<AuthResponse>('/api/auth/me');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return null;
      }

      throw error;
    }
  },
  logout: () => apiRequest<void>('/api/auth/logout', { method: 'POST' }),
  changePin: (request: ChangePinRequest) => apiRequest<void>('/api/auth/change-pin', jsonPost(request)),
  setParticipantPin: (participantId: string, request: SetPinRequest) =>
    apiRequest<void>(`/api/admin/participants/${participantId}/pin`, jsonPost(request)),
  getChallenge: () => apiRequest<ChallengeSnapshot>('/api/challenge'),
  getSettings: () => apiRequest<ChallengeSettings>('/api/challenge/settings'),
  listParticipants: () => apiRequest<Participant[]>('/api/participants'),
  getProfile: (participantId?: string) =>
    apiRequest<ParticipantProfile>(`/api/profile${participantId ? `?participantId=${encodeURIComponent(participantId)}` : ''}`),
  updateProfile: (request: UpdateParticipantProfileRequest) =>
    apiRequest<ParticipantProfile>('/api/profile', jsonPut(request)),
  createParticipant: (request: CreateParticipantRequest) =>
    apiRequest<CreatedRecord>('/api/participants', jsonPost(request)),
  listCouples: () => apiRequest<Couple[]>('/api/couples'),
  createCouple: (request: CreateCoupleRequest) => apiRequest<CreatedRecord>('/api/couples', jsonPost(request)),
  registerCheckIn: (request: RegisterCheckInRequest) =>
    apiRequest<CreatedRecord>('/api/check-ins', jsonPost(request)),
  createFullCoverageToken: (request: CreateFullCoverageTokenRequest) =>
    apiRequest<CreatedRecord>('/api/tokens/full-coverage', jsonPost(request)),
  grantToken: (request: GrantTokenRequest) => apiRequest<CreatedRecord>('/api/admin/tokens', jsonPost(request)),
  useToken: (id: string, request: UseTokenRequest) => apiRequest<void>(`/api/tokens/${id}/use`, jsonPost(request)),
  invalidateCheckIn: (id: string, request: InvalidateRecordRequest) =>
    apiRequest<void>(`/api/admin/check-ins/${id}/invalidate`, jsonPost(request)),
  invalidateToken: (id: string, request: InvalidateRecordRequest) =>
    apiRequest<void>(`/api/admin/tokens/${id}/invalidate`, jsonPost(request)),
  listRecentCheckIns: (limit = 50) => apiRequest<AdminCheckIn[]>(`/api/admin/check-ins?limit=${limit}`),
  listCalendarCheckIns: (from: string, to: string) =>
    apiRequest<AdminCheckIn[]>(`/api/admin/check-ins/calendar?from=${from}&to=${to}`),
  listWeeklyCalendarEvents: (from: string, to: string) =>
    apiRequest<WeeklyCalendarEvent[]>(`/api/calendar/weekly?from=${from}&to=${to}`),
  listRecentTokens: (limit = 50) => apiRequest<AdminToken[]>(`/api/admin/tokens?limit=${limit}`),
  getGeneralRanking: (throughDate?: Date) =>
    apiRequest<RankingRow[]>(
      throughDate ? `/api/rankings/general?throughDate=${formatApiDate(throughDate)}` : '/api/rankings/general'
    ),
  getWeeklyRankings: (throughDate?: Date) =>
    apiRequest<WeeklyRanking[]>(
      throughDate ? `/api/rankings/weeks?throughDate=${formatApiDate(throughDate)}` : '/api/rankings/weeks'
    ),
  getWeeklyRanking: (weekStartDate: string, throughDate?: Date) =>
    apiRequest<WeeklyRanking>(
      throughDate
        ? `/api/rankings/weeks/${weekStartDate}?throughDate=${formatApiDate(throughDate)}`
        : `/api/rankings/weeks/${weekStartDate}`
    )
};
