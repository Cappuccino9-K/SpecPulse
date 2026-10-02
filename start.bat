@echo off
cd /d "%~dp0"

set "PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%PS%" set "PS=%SystemRoot%\Sysnative\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%PS%" set "PS=C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"

if not exist "%PS%" (
  echo PowerShell was not found.
  echo Install Windows PowerShell, then run start.bat again.
  pause
  exit /b 1
)

"%PS%" -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1"
echo.
echo SpecPulse stopped.
pause
