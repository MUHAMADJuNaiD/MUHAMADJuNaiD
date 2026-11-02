#!/bin/bash
cd "$(dirname "$0")"
echo "=== OUTLOOK STYLES REEL KIT - SETUP (Mac) ==="
if ! command -v brew >/dev/null 2>&1; then
  echo "[1/4] Homebrew install ho raha hai (password maanga jaye to apna Mac password dein)..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi
eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || /usr/local/bin/brew shellenv)"
command -v node >/dev/null 2>&1 || { echo "[2/4] Node.js install..."; brew install node; }
command -v ffmpeg >/dev/null 2>&1 || { echo "[3/4] ffmpeg install..."; brew install ffmpeg; }
echo "[4/4] Packages aur 3D browser..."
npm install && npx playwright install chromium
echo "SETUP MUKAMMAL! Ab 2-MAKE-REELS-MAC.command chalayein."
read -p "Enter dabayein..."
