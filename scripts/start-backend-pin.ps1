param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
    [string]$Url = 'http://127.0.0.1:5020',
    [string]$BootstrapPin = '123456'
)

$env:Auth__Mode = 'PinLogin'
$env:Auth__BootstrapAdminPin = $BootstrapPin
$env:Auth__CookieSecure = 'false'

& (Join-Path $Root '.tools\dotnet\dotnet.exe') run `
    --project (Join-Path $Root 'src\GymChall.Api\GymChall.Api.csproj') `
    --urls $Url
