using System.Data;
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

    public static async Task EnsureParticipantProfileSchemaAsync(GymChallDbContext db, CancellationToken cancellationToken = default)
    {
        await EnsureColumnAsync(db, "Participants", "WeightKg", "REAL NULL", cancellationToken);
        await EnsureColumnAsync(db, "Participants", "HeightCm", "REAL NULL", cancellationToken);
    }

    private static async Task EnsureColumnAsync(GymChallDbContext db, string tableName, string columnName, string columnDefinition, CancellationToken cancellationToken)
    {
        var connection = db.Database.GetDbConnection();
        var shouldClose = connection.State != ConnectionState.Open;

        if (shouldClose)
        {
            await connection.OpenAsync(cancellationToken);
        }

        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText = $"""PRAGMA table_info("{tableName}")""";
            {
                await using var reader = await command.ExecuteReaderAsync(cancellationToken);
                while (await reader.ReadAsync(cancellationToken))
                {
                    if (string.Equals(reader.GetString(1), columnName, StringComparison.OrdinalIgnoreCase))
                    {
                        return;
                    }
                }
            }

            await using var alterCommand = connection.CreateCommand();
            alterCommand.CommandText = $"""ALTER TABLE "{tableName}" ADD COLUMN "{columnName}" {columnDefinition}""";
            await alterCommand.ExecuteNonQueryAsync(cancellationToken);
        }
        finally
        {
            if (shouldClose)
            {
                await connection.CloseAsync();
            }
        }
    }
}
