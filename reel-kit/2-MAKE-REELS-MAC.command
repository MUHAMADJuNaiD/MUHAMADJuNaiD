#!/bin/bash
cd "$(dirname "$0")"
eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || /usr/local/bin/brew shellenv 2>/dev/null)"
echo "reels.json ki saari reels ban rahi hain. Har reel ~5-10 minute..."
node batch.js reels.json out && open out
read -p "Reels tayyar! Enter dabayein..."
