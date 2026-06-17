# syntax=docker/dockerfile:1

FROM node:24-alpine AS web-build
WORKDIR /src/web

COPY web/package*.json ./
RUN npm ci

COPY web/ ./
ENV VITE_AUTH_MODE=pin-login
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS api-build
WORKDIR /src

COPY src/GymChall.Domain/GymChall.Domain.csproj src/GymChall.Domain/
COPY src/GymChall.Application/GymChall.Application.csproj src/GymChall.Application/
COPY src/GymChall.Infrastructure/GymChall.Infrastructure.csproj src/GymChall.Infrastructure/
COPY src/GymChall.Api/GymChall.Api.csproj src/GymChall.Api/
RUN dotnet restore src/GymChall.Api/GymChall.Api.csproj

COPY src/ src/
RUN dotnet publish src/GymChall.Api/GymChall.Api.csproj \
    --configuration Release \
    --output /app/publish \
    --no-restore

COPY --from=web-build /src/web/dist /app/publish/wwwroot

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    TZ=America/Asuncion \
    Auth__Mode=PinLogin \
    Auth__CookieSecure=true \
    Auth__DataProtectionKeysPath=/var/lib/gymquest/keys \
    ConnectionStrings__GymChall="Data Source=/var/lib/gymquest/data/gymchall.db"

RUN mkdir -p /var/lib/gymquest/data /var/lib/gymquest/keys \
    && chown -R 1001:1001 /var/lib/gymquest /app

COPY --from=api-build --chown=1001:1001 /app/publish ./

USER 1001:1001
EXPOSE 8080

ENTRYPOINT ["dotnet", "GymChall.Api.dll"]
