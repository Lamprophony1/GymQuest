using GymChall.Api.Endpoints;
using GymChall.Application.Challenges;
using GymChall.Infrastructure;
using GymChall.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddScoped<GymChallService>();
builder.Services.AddGymChallInfrastructure(builder.Configuration);

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<GymChallDbContext>();
    await db.Database.EnsureCreatedAsync();
    await SeedData.EnsureSeededAsync(db);
}

app.MapGet("/health", () => Results.Ok(new
{
    service = "GymChall.Api",
    status = "ok"
}));

app.MapGymChallEndpoints();

app.Run();

public partial class Program
{
}
