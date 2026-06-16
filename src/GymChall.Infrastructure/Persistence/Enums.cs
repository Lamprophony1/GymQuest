namespace GymChall.Infrastructure.Persistence;

public enum ChallengeStatus { Draft = 0, Active = 1, Finished = 2 }
public enum ParticipantRole { Participant = 0, Admin = 1 }
public enum CheckInType { GymMorning = 0, GymSameDayRecovery = 1, GymWeekendRecovery = 2 }
public enum RecordStatus { Valid = 0, Corrected = 1, Rejected = 2 }
public enum ExceptionTokenType { Health = 0, Mandatory = 1, ScheduleChange = 2 }
public enum ExceptionTokenStatus { Applied = 0, Available = 1, Corrected = 2, Rejected = 3 }
public enum ExceptionReasonCategory { Health = 0, Period = 1, WorkTrip = 2, MandatoryTrip = 3, OtherApproved = 4 }
