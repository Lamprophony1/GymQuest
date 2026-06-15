using GymChall.Application.Abstractions;
using GymChall.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace GymChall.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddGymChallInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("GymChall") ?? "Data Source=gymchall.db";
        services.AddDbContext<GymChallDbContext>(options => options.UseSqlite(connectionString));
        services.AddScoped<IGymChallRepository, GymChallRepository>();
        return services;
    }
}
