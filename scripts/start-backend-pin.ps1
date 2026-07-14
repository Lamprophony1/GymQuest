param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
    [string]$Url = 'http://127.0.0.1:5020',
    [string]$BootstrapPin = '123456'
)

$env:Auth__Mode = 'PinLogin'
$env:Auth__BootstrapAdminPin = $BootstrapPin
$env:Auth__CookieSecure = 'false'

$localDotnet = Join-Path $Root '.tools\dotnet\dotnet.exe'
if (Test-Path -LiteralPath $localDotnet -PathType Leaf) {
    $dotnet = $localDotnet
}
else {
    $dotnetCommand = Get-Command 'dotnet.exe' -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -eq $dotnetCommand) {
        throw 'No se encontro .tools\dotnet\dotnet.exe ni dotnet.exe en PATH.'
    }

    $dotnet = $dotnetCommand.Source
}

& $dotnet run `
    --project (Join-Path $Root 'src\GymChall.Api\GymChall.Api.csproj') `
    --urls $Url
