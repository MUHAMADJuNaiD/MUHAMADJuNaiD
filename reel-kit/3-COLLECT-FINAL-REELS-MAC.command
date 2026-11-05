#!/bin/bash
cd "$(dirname "$0")"
eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || /usr/local/bin/brew shellenv 2>/dev/null)"
node collect.js out FINAL-REELS && open FINAL-REELS
read -p "Enter dabayein..."
