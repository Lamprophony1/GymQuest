param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
    [string]$Port = '5174'
)

$nodeRoot = Join-Path $Root '.tools\node-v24.16.0-win-x64'
$env:PATH = "$nodeRoot;$env:PATH"
$env:VITE_AUTH_MODE = 'pin-login'

& (Join-Path $nodeRoot 'node.exe') `
    (Join-Path $Root 'web\node_modules\vite\bin\vite.js') `
    --host 127.0.0.1 `
    --port $Port
