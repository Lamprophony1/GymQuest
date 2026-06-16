@echo off
setlocal
cd /d "%~dp0..\web"
"..\.tools\node-v24.16.0-win-x64\npm.cmd" run dev
