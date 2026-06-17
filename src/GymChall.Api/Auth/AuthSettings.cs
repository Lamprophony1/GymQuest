namespace GymChall.Api.Auth;

public sealed class AuthSettings
{
    public string Mode { get; init; } = "DevSelector";
    public string? BootstrapAdminPin { get; init; }
    public bool CookieSecure { get; init; }

    public bool IsPinLogin => string.Equals(Mode, "PinLogin", StringComparison.OrdinalIgnoreCase);

    public static AuthSettings From(IConfiguration configuration, IWebHostEnvironment environment)
    {
        var mode = configuration["Auth:Mode"] ?? (environment.IsDevelopment() ? "DevSelector" : "PinLogin");
        var cookieSecure = bool.TryParse(configuration["Auth:CookieSecure"], out var configuredCookieSecure)
            ? configuredCookieSecure
            : !environment.IsDevelopment();

        return new AuthSettings
        {
            Mode = mode,
            BootstrapAdminPin = configuration["Auth:BootstrapAdminPin"],
            CookieSecure = cookieSecure
        };
    }
}
