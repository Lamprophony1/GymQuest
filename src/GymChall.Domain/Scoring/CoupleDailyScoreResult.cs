namespace GymChall.Domain.Scoring;

public sealed record CoupleDailyScoreResult(
    decimal FirstParticipantPoints,
    decimal SecondParticipantPoints,
    decimal DailyBonusPoints,
    decimal LakePoints,
    decimal TotalPoints,
    bool BothEligibleForDailyBonus,
    bool BothCoveredForWeeklyCount);
