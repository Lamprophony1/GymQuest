using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Net.Http.Json;

namespace GymChall.Api.Tests;

public sealed class GymChallApiTests
{
    [Fact]
    public async Task Health_endpoint_returns_ok()
    {
        await using var app = new WebApplicationFactory<Program>();
        using var client = app.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Challenge_endpoint_returns_seeded_challenge()
    {
        await using var app = new WebApplicationFactory<Program>();
        using var client = app.CreateClient();

        var response = await client.GetAsync("/api/challenge");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("Reto Parejas - Rumbo a Septiembre", body);
    }

    [Fact]
    public async Task Ranking_endpoint_returns_seeded_couples()
    {
        await using var app = new WebApplicationFactory<Program>();
        using var client = app.CreateClient();

        var response = await client.GetAsync("/api/rankings/general?throughDate=2026-06-15");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var rows = await response.Content.ReadFromJsonAsync<List<RankingRow>>();
        Assert.NotNull(rows);
        Assert.Equal(3, rows.Count);
    }

    private sealed record RankingRow(Guid CoupleId, string CoupleName, decimal TotalPoints, int MorningStreak, int GymStreak);
}
