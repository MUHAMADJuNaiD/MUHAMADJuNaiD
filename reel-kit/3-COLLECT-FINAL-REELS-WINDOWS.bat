@echo off
title Outlook Styles - Final reels jama ho rahi hain
cd /d "%~dp0"
call node collect.js out FINAL-REELS
start "" "%~dp0FINAL-REELS"
pause
