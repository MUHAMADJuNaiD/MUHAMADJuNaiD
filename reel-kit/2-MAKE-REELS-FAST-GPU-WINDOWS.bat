@echo off
title Outlook Styles - Reels (GPU fast mode)
cd /d "%~dp0"
echo GPU fast mode. Agar error aaye to 2-MAKE-REELS-WINDOWS.bat use karein.
set GPU=1
call node batch.js reels.json out
start "" "%~dp0out"
pause
