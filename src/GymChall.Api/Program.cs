using GymChall.Api.Auth;
using GymChall.Api.Endpoints;
using GymChall.Application.Auth;
using GymChall.Application.Challenges;
using GymChall.Infrastructure;
using GymChall.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;

var builder = WebApplication.CreateBuilder(args);
var authSettings = AuthSettings.From(builder.Configuration, builder.Environment);
var dataProtectionKeysPath = builder.Configuration["Auth:DataProtectionKeysPath"] ??
    Path.Combine(builder.Environment.ContentRootPath, ".data-protection-keys");

builder.Logging.ClearProviders();
builder.Logging.AddConsole();

Directory.CreateDirectory(dataProtectionKeysPath);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSingleton(authSettings);
builder.Services.AddSingleton<PinHasher>();
builder.Services.AddScoped<PinAuthService>();
builder.Services.AddScoped<GymChallService>();
builder.Services.AddGymChallInfrastructure(builder.Configuration);
builder.Services
    .AddDataProtection()
    .SetApplicationName("GymChall.Api")
    .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionKeysPath));
builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "ProyectoRM.Auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = authSettings.CookieSecure
            ? CookieSecurePolicy.Always
            : CookieSecurePolicy.SameAsRequest;
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    });
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(EndpointAuthExtensions.AdminPolicy, policy => policy.RequireRole("Admin"));
});

var app = builder.Build();
var spaRoot = app.Environment.WebRootPath ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot");
var spaIndexPath = Path.Combine(spaRoot, "index.html");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<GymChallDbContext>();
    await db.Database.EnsureCreatedAsync();
    await DatabaseSchema.EnsureAuthSchemaAsync(db);
    await DatabaseSchema.EnsureParticipantProfileSchemaAsync(db);
    await DatabaseSchema.EnsureExceptionTokenSpecialSchemaAsync(db);
    await SeedData.EnsureSeededAsync(db);

    if (!string.IsNullOrWhiteSpace(authSettings.BootstrapAdminPin))
    {
        var auth = scope.ServiceProvider.GetRequiredService<PinAuthService>();
        await auth.EnsureBootstrapPinAsync(SeedData.RafaId, authSettings.BootstrapAdminPin);
    }
}

app.MapGet("/health", () => Results.Ok(new
{
    service = "GymChall.Api",
    status = "ok"
}));

if (Directory.Exists(spaRoot))
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapAuthEndpoints(authSettings);
app.MapGymChallEndpoints(authSettings);

if (File.Exists(spaIndexPath))
{
    app.MapFallback(async context =>
    {
        if (context.Request.Path.StartsWithSegments("/api") ||
            context.Request.Path.StartsWithSegments("/health"))
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return;
        }

        context.Response.ContentType = "text/html; charset=utf-8";
        await context.Response.SendFileAsync(spaIndexPath);
    });
}

app.Run();

public partial class Program
{
}
