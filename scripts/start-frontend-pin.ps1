param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
    [string]$Port = '5174'
)

$nodeRoot = Join-Path $Root '.tools\node-v24.16.0-win-x64'
$webRoot = Join-Path $Root 'web'
$env:PATH = "$nodeRoot;$env:PATH"
$env:VITE_AUTH_MODE = 'pin-login'

Push-Location $webRoot
try {
    & (Join-Path $nodeRoot 'node.exe') `
        (Join-Path $webRoot 'node_modules\vite\bin\vite.js') `
        --host 127.0.0.1 `
        --port $Port
}
finally {
    Pop-Location
}
