@echo off
title Outlook Styles - Reels ban rahi hain
cd /d "%~dp0"
echo reels.json ki saari reels ban rahi hain. Har reel ~5-10 minute leti hai...
call node batch.js reels.json out
echo.
echo Reels tayyar hain: "out" folder dekhein.
start "" "%~dp0out"
pause
