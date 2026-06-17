using Microsoft.EntityFrameworkCore;

namespace GymChall.Infrastructure.Persistence;

public static class DatabaseSchema
{
    public static async Task EnsureAuthSchemaAsync(GymChallDbContext db, CancellationToken cancellationToken = default)
    {
        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE TABLE IF NOT EXISTS "AuthCredentials" (
                "ParticipantId" TEXT NOT NULL CONSTRAINT "PK_AuthCredentials" PRIMARY KEY,
                "PinHash" TEXT NOT NULL,
                "FailedAttemptCount" INTEGER NOT NULL DEFAULT 0,
                "LockedUntil" TEXT NULL,
                "PinUpdatedAt" TEXT NULL,
                "CreatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "UpdatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "FK_AuthCredentials_Participants_ParticipantId"
                    FOREIGN KEY ("ParticipantId") REFERENCES "Participants" ("Id") ON DELETE CASCADE
            );
            """,
            cancellationToken);
    }
}
