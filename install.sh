#!/usr/bin/env bash
# Automated Installer for Antigravity Autonomous Software Company

TARGET_SKILLS="$HOME/.gemini/config/skills"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_SKILLS="$SCRIPT_DIR/skills"

mkdir -p "$TARGET_SKILLS"

for skill in "$SOURCE_SKILLS"/*; do
  if [ -d "$skill" ]; then
    cp -r "$skill" "$TARGET_SKILLS/"
    echo "Installed: $(basename "$skill")"
  fi
done

echo "Installation complete. Skills copied to $TARGET_SKILLS."
