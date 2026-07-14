@echo off
REM The Hollow Oath — launcher (Windows)
REM Installs dependencies on first run, builds the production bundle once,
REM then serves it locally and opens your browser.
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js / npm is required. Install it from https://nodejs.org ^(v20 or newer^).
  pause
  exit /b 1
)

if not exist node_modules (
  echo First run: installing dependencies - one time only...
  call npm install
  if errorlevel 1 ( echo npm install failed. & pause & exit /b 1 )
)

if not exist dist (
  echo Building the game - one time only...
  call npm run build
  if errorlevel 1 ( echo Build failed. & pause & exit /b 1 )
)

echo.
echo   The Hollow Oath is starting at http://localhost:4173
echo   Keep this window open while playing. Close it to quit.
echo.
start "" http://localhost:4173
call npm run preview
