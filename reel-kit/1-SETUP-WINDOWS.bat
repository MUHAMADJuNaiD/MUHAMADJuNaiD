@echo off
title Outlook Styles Reel Kit - Setup
cd /d "%~dp0"
echo ==========================================
echo   OUTLOOK STYLES REEL KIT - SETUP
echo ==========================================
set NEED_RESTART=0
where node >nul 2>nul
if errorlevel 1 (
  echo [1/4] Node.js install ho raha hai...
  winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
  set NEED_RESTART=1
) else ( echo [1/4] Node.js pehle se installed hai. )
where ffmpeg >nul 2>nul
if errorlevel 1 (
  echo [2/4] ffmpeg install ho raha hai...
  winget install -e --id Gyan.FFmpeg --accept-source-agreements --accept-package-agreements
  set NEED_RESTART=1
) else ( echo [2/4] ffmpeg pehle se installed hai. )
if "%NEED_RESTART%"=="1" (
  echo.
  echo Node.js / ffmpeg install ho gaye.
  echo Ye window band karein aur 1-SETUP-WINDOWS.bat DOBARA double-click karein.
  pause
  exit /b
)
echo [3/4] Reel kit ke packages install ho rahe hain...
call npm install
echo [4/4] 3D browser download ho raha hai...
call npx playwright install chromium
echo.
echo ==========================================
echo   SETUP MUKAMMAL! Ab 2-MAKE-REELS-WINDOWS.bat chalayein.
echo ==========================================
pause
