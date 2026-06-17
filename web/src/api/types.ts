export type ParticipantRole = 0 | 1;
export type CheckInType = 0 | 1 | 2;
export type ExceptionTokenType = 0 | 1 | 2;
export type ExceptionTokenStatus = 0 | 1 | 2 | 3;
export type ExceptionReasonCategory = 0 | 1 | 2 | 3 | 4;

export interface Challenge {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  adminParticipantId: string;
  timezone: string;
}

export interface ChallengeSnapshot {
  challenge: Challenge;
  settings: ChallengeSettings;
  participants: Participant[];
  couples: Couple[];
  checkIns: CheckIn[];
  fullCoverageTokens: FullCoverageToken[];
}

export interface ChallengeSettings {
  mondayMorningPoints: number;
  weekdayMorningPoints: number;
  sameDayRecoveryPoints: number;
  weekendRecoveryPoints: number;
  dailyCoupleBonus: number;
  perfectWeekBonus: number;
  completeWeekBonus: number;
  rescuedWeekBonus: number;
  gymMinimumMinutes: number;
  morningWindowStart: string;
  morningWindowEnd: string;
}

export interface Participant {
  id: string;
  displayName: string;
  username: string;
  role: ParticipantRole;
  gender?: string | null;
  active: boolean;
}

export interface LoginOption {
  id: string;
  displayName: string;
  username: string;
}

export interface LoginRequest {
  participantId: string;
  pin: string;
}

export interface SetPinRequest {
  pin: string;
}

export interface AuthenticatedParticipant extends Participant {}

export interface AuthResponse {
  participant: AuthenticatedParticipant;
}

export interface Couple {
  id: string;
  name: string;
  participants: Participant[];
  active: boolean;
}

export interface CoupleSnapshot {
  id: string;
  challengeId: string;
  name: string;
  participantIds: string[];
  active: boolean;
}

export interface CheckIn {
  id: string;
  challengeId: string;
  participantId: string;
  activityDate: string;
  type: CheckInType;
  durationMinutes: number;
}

export interface FullCoverageToken {
  id: string;
  challengeId: string;
  participantId: string;
  targetDate: string;
  type: ExceptionTokenType;
  reasonCategory: ExceptionReasonCategory;
  status: ExceptionTokenStatus;
  notes?: string | null;
}

export interface RankingRow {
  coupleId: string;
  coupleName: string;
  totalPoints: number;
  morningStreak: number;
  gymStreak: number;
}

export interface WeeklyRanking {
  weekStartDate: string;
  weekEndDate: string;
  rows: WeeklyRankingRow[];
}

export interface WeeklyRankingRow {
  coupleId: string;
  coupleName: string;
  individualPoints: number;
  dailyBonusPoints: number;
  weeklyBonusPoints: number;
  totalPoints: number;
  weeklyBonusType: string;
  weeklyBonusCandidateType: string;
  weeklyBonusCandidatePoints: number;
  requiredBusinessDays: number;
}

export interface AdminCheckIn {
  id: string;
  participantId: string;
  participantName: string;
  activityDate: string;
  occurredAt: string;
  type: CheckInType;
  status: string;
  durationMinutes: number;
  notes?: string | null;
  createdAt: string;
}

export interface AdminToken {
  id: string;
  participantId: string;
  participantName: string;
  targetDate: string;
  type: ExceptionTokenType;
  reasonCategory: ExceptionReasonCategory;
  status: string;
  notes?: string | null;
  createdAt: string;
}

export interface CreateParticipantRequest {
  displayName: string;
  username: string;
  role: ParticipantRole;
  gender?: string | null;
}

export interface CreateCoupleRequest {
  name: string;
  firstParticipantId: string;
  secondParticipantId: string;
}

export interface RegisterCheckInRequest {
  participantId: string;
  occurredAt: string;
  recoveryTargetDate?: string | null;
  createdByParticipantId: string;
  notes?: string | null;
}

export interface CreateFullCoverageTokenRequest {
  participantId: string;
  targetDate: string;
  reasonCategory: ExceptionReasonCategory;
  assignedByAdminId: string;
  notes?: string | null;
}

export interface GrantTokenRequest {
  participantId: string;
  type: ExceptionTokenType;
  reasonCategory: ExceptionReasonCategory;
  assignedByAdminId: string;
  notes?: string | null;
}

export interface UseTokenRequest {
  participantId: string;
  targetDate: string;
  usedByParticipantId: string;
  occurredAt?: string | null;
  recoveryTargetDate?: string | null;
  notes?: string | null;
}

export interface InvalidateRecordRequest {
  actorParticipantId: string;
  reason?: string | null;
}

export interface CreatedRecord {
  id: string;
}
