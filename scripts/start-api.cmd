@echo off
setlocal
cd /d "%~dp0.."
".tools\dotnet\dotnet.exe" "src\GymChall.Api\bin\Debug\net10.0\GymChall.Api.dll" --urls http://127.0.0.1:5020
