@echo off
setlocal
cd /d "%~dp0.."
set "DOTNET=.tools\dotnet\dotnet.exe"
if not exist "%DOTNET%" set "DOTNET=dotnet.exe"
set "Auth__Mode=DevSelector"
set "Auth__CookieSecure=false"
"%DOTNET%" "src\GymChall.Api\bin\Debug\net10.0\GymChall.Api.dll" --urls http://127.0.0.1:5020
