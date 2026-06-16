using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Hosting;
using System.Net;
using System.Net.Http.Json;

namespace GymChall.Api.Tests;

public sealed class GymChallApiTests
{
    [Fact]
    public async Task Health_endpoint_returns_ok()
    {
        await using var app = CreateApp();
        using var client = app.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Challenge_endpoint_returns_seeded_challenge()
    {
        await using var app = CreateApp();
        using var client = app.CreateClient();

        var response = await client.GetAsync("/api/challenge");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("Reto septiembre 2026", body);
    }

    [Fact]
    public async Task Ranking_endpoint_returns_seeded_couples()
    {
        await using var app = CreateApp();
        using var client = app.CreateClient();

        var response = await client.GetAsync("/api/rankings/general?throughDate=2026-06-15");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var rows = await response.Content.ReadFromJsonAsync<List<RankingRow>>();
        Assert.NotNull(rows);
        Assert.Equal(3, rows.Count);
    }

    [Fact]
    public async Task Participants_endpoints_list_and_create_participants()
    {
        await using var app = CreateApp();
        using var client = app.CreateClient();

        var before = await client.GetFromJsonAsync<List<ParticipantRow>>("/api/participants");
        var username = $"ana-{Guid.NewGuid():N}";

        var create = await client.PostAsJsonAsync("/api/participants", new
        {
            displayName = "Ana",
            username,
            role = 0,
            gender = "female"
        });
        var after = await client.GetFromJsonAsync<List<ParticipantRow>>("/api/participants");

        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        Assert.NotNull(before);
        Assert.NotNull(after);
        Assert.Equal(before.Count + 1, after.Count);
        Assert.Contains(after, participant => participant.Username == username);
    }

    [Fact]
    public async Task Couples_endpoints_list_and_create_couples()
    {
        await using var app = CreateApp();
        using var client = app.CreateClient();
        var participants = await client.GetFromJsonAsync<List<ParticipantRow>>("/api/participants");
        Assert.NotNull(participants);
        var first = Assert.Single(participants, x => x.Username == "rafa");
        var second = Assert.Single(participants, x => x.Username == "clari");

        var before = await client.GetFromJsonAsync<List<CoupleRow>>("/api/couples");
        var create = await client.PostAsJsonAsync("/api/couples", new
        {
            name = "Rafa + Clari Bis",
            firstParticipantId = first.Id,
            secondParticipantId = second.Id
        });
        var after = await client.GetFromJsonAsync<List<CoupleRow>>("/api/couples");

        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        Assert.NotNull(before);
        Assert.NotNull(after);
        Assert.Equal(before.Count + 1, after.Count);
        Assert.Contains(after, couple => couple.Name == "Rafa + Clari Bis");
    }

    [Fact]
    public async Task Settings_endpoint_returns_challenge_settings()
    {
        await using var app = CreateApp();
        using var client = app.CreateClient();

        var settings = await client.GetFromJsonAsync<SettingsRow>("/api/challenge/settings");

        Assert.NotNull(settings);
        Assert.Equal(45, settings.GymMinimumMinutes);
        Assert.Equal(4m, settings.MondayMorningPoints);
    }

    [Fact]
    public async Task Weekly_ranking_endpoints_return_all_weeks_and_specific_week()
    {
        await using var app = CreateApp();
        using var client = app.CreateClient();

        var weeks = await client.GetFromJsonAsync<List<WeeklyRanking>>("/api/rankings/weeks?throughDate=2026-06-26");
        var week = await client.GetFromJsonAsync<WeeklyRanking>("/api/rankings/weeks/2026-06-15?throughDate=2026-06-26");

        Assert.NotNull(weeks);
        Assert.Equal(2, weeks.Count);
        Assert.NotNull(week);
        Assert.Equal(new DateOnly(2026, 6, 15), week.WeekStartDate);
        Assert.Equal(3, week.Rows.Count);
    }

    [Fact]
    public async Task Invalidate_checkin_removes_it_from_ranking()
    {
        await using var app = CreateApp();
        using var client = app.CreateClient();
        var participants = await client.GetFromJsonAsync<List<ParticipantRow>>("/api/participants");
        Assert.NotNull(participants);
        var rafa = Assert.Single(participants, x => x.Username == "rafa");

        var create = await client.PostAsJsonAsync("/api/check-ins", new
        {
            participantId = rafa.Id,
            occurredAt = new DateTimeOffset(2026, 6, 15, 5, 5, 0, TimeSpan.FromHours(-4)),
            type = 0,
            durationMinutes = 45,
            createdByParticipantId = rafa.Id,
            notes = "5am"
        });
        var created = await create.Content.ReadFromJsonAsync<CreatedRecord>();

        var before = await client.GetFromJsonAsync<List<RankingRow>>("/api/rankings/general?throughDate=2026-06-15");
        var invalidate = await client.PostAsJsonAsync($"/api/admin/check-ins/{created!.Id}/invalidate", new
        {
            actorParticipantId = rafa.Id,
            reason = "acuerdo del grupo"
        });
        var after = await client.GetFromJsonAsync<List<RankingRow>>("/api/rankings/general?throughDate=2026-06-15");

        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, invalidate.StatusCode);
        Assert.NotNull(before);
        Assert.NotNull(after);
        Assert.True(before.Sum(x => x.TotalPoints) > after.Sum(x => x.TotalPoints));
    }

    [Fact]
    public async Task Admin_recent_checkins_endpoint_returns_recent_rows()
    {
        await using var app = CreateApp();
        using var client = app.CreateClient();
        var participants = await client.GetFromJsonAsync<List<ParticipantRow>>("/api/participants");
        Assert.NotNull(participants);
        var rafa = Assert.Single(participants, x => x.Username == "rafa");

        await client.PostAsJsonAsync("/api/check-ins", new
        {
            participantId = rafa.Id,
            occurredAt = new DateTimeOffset(2026, 6, 15, 5, 5, 0, TimeSpan.FromHours(-4)),
            type = 0,
            durationMinutes = 45,
            createdByParticipantId = rafa.Id,
            notes = "5am"
        });

        var rows = await client.GetFromJsonAsync<List<AdminCheckInRow>>("/api/admin/check-ins?limit=10");

        Assert.NotNull(rows);
        var row = Assert.Single(rows);
        Assert.Equal("Rafa", row.ParticipantName);
        Assert.Equal("Valid", row.Status);
    }

    [Fact]
    public async Task Admin_recent_tokens_endpoint_returns_recent_rows()
    {
        await using var app = CreateApp();
        using var client = app.CreateClient();
        var participants = await client.GetFromJsonAsync<List<ParticipantRow>>("/api/participants");
        Assert.NotNull(participants);
        var rafa = Assert.Single(participants, x => x.Username == "rafa");

        await client.PostAsJsonAsync("/api/tokens/full-coverage", new
        {
            participantId = rafa.Id,
            targetDate = new DateOnly(2026, 6, 16),
            reasonCategory = 0,
            assignedByAdminId = rafa.Id,
            notes = "salud"
        });

        var rows = await client.GetFromJsonAsync<List<AdminTokenRow>>("/api/admin/tokens?limit=10");

        Assert.NotNull(rows);
        var row = Assert.Single(rows);
        Assert.Equal("Rafa", row.ParticipantName);
        Assert.Equal("Applied", row.Status);
    }

    private static WebApplicationFactory<Program> CreateApp()
    {
        var databasePath = Path.Combine(Path.GetTempPath(), $"gymchall-api-tests-{Guid.NewGuid():N}.db");
        return new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder => builder.UseSetting("ConnectionStrings:GymChall", $"Data Source={databasePath}"));
    }

    private sealed record RankingRow(Guid CoupleId, string CoupleName, decimal TotalPoints, int MorningStreak, int GymStreak);
    private sealed record ParticipantRow(Guid Id, string DisplayName, string Username, int Role, string? Gender, bool Active);
    private sealed record CoupleRow(Guid Id, string Name, List<ParticipantRow> Participants, bool Active);
    private sealed record SettingsRow(decimal MondayMorningPoints, int GymMinimumMinutes);
    private sealed record WeeklyRanking(DateOnly WeekStartDate, DateOnly WeekEndDate, List<WeeklyRankingRow> Rows);
    private sealed record WeeklyRankingRow(Guid CoupleId, string CoupleName, decimal TotalPoints, string WeeklyBonusType);
    private sealed record CreatedRecord(Guid Id);
    private sealed record AdminCheckInRow(Guid Id, Guid ParticipantId, string ParticipantName, DateOnly ActivityDate, string Status);
    private sealed record AdminTokenRow(Guid Id, Guid ParticipantId, string ParticipantName, DateOnly TargetDate, string Status);
}
