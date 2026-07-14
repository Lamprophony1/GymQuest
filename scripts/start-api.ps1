$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$localDotnet = Join-Path $root '.tools\dotnet\dotnet.exe'
$dll = Join-Path $root 'src\GymChall.Api\bin\Debug\net10.0\GymChall.Api.dll'

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

if (-not (Test-Path -LiteralPath $dll -PathType Leaf)) {
    throw "No se encontro '$dll'. Compile la API antes de iniciar."
}

$env:Auth__Mode = 'DevSelector'
$env:Auth__CookieSecure = 'false'

Set-Location $root
& $dotnet $dll --urls 'http://127.0.0.1:5020'
