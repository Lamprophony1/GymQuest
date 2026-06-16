namespace GymChall.Application.Challenges;

public sealed record ClassifiedCheckIn(DateOnly ActivityDate, CheckInTypeDto Type);

public static class CheckInClassifier
{
    public static ClassifiedCheckIn Classify(
        DateTimeOffset occurredAt,
        DateOnly? recoveryTargetDate,
        ChallengeSettingsDto settings)
    {
        var localDate = DateOnly.FromDateTime(occurredAt.DateTime);
        var localTime = TimeOnly.FromDateTime(occurredAt.DateTime);

        if (localDate.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
        {
            if (recoveryTargetDate is null)
            {
                throw new InvalidOperationException("Elegir el dia habil que queres recuperar.");
            }

            ValidateWeekendRecoveryTarget(localDate, recoveryTargetDate.Value);
            return new ClassifiedCheckIn(recoveryTargetDate.Value, CheckInTypeDto.GymWeekendRecovery);
        }

        if (localTime >= settings.MorningWindowStart && localTime <= settings.MorningWindowEnd)
        {
            return new ClassifiedCheckIn(localDate, CheckInTypeDto.GymMorning);
        }

        return new ClassifiedCheckIn(localDate, CheckInTypeDto.GymSameDayRecovery);
    }

    public static DateOnly StartOfWeek(DateOnly date)
    {
        var daysSinceMonday = ((int)date.DayOfWeek - (int)DayOfWeek.Monday + 7) % 7;
        return date.AddDays(-daysSinceMonday);
    }

    private static void ValidateWeekendRecoveryTarget(DateOnly weekendDate, DateOnly targetDate)
    {
        if (targetDate.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
        {
            throw new InvalidOperationException("La recuperacion debe apuntar a un dia habil.");
        }

        if (StartOfWeek(weekendDate) != StartOfWeek(targetDate))
        {
            throw new InvalidOperationException("La recuperacion debe ser de la misma semana.");
        }
    }
}
