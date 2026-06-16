$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$dotnet = Join-Path $root '.tools\dotnet\dotnet.exe'
$dll = Join-Path $root 'src\GymChall.Api\bin\Debug\net10.0\GymChall.Api.dll'

Set-Location $root
& $dotnet $dll --urls 'http://127.0.0.1:5020'
