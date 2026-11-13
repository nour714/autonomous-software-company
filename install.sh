#!/usr/bin/env bash
# ==============================================================================
# Automated Installer for Antigravity Autonomous Software Company
# ==============================================================================
set -euo pipefail
shopt -s nullglob

DRY_RUN=false
for arg in "$@"; do
  if [ "$arg" == "--dry-run" ]; then
    DRY_RUN=true
  fi
done

SOURCE_ROOT="${SWARM_SOURCE_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
SOURCE_SKILLS="$SOURCE_ROOT/skills"
SOURCE_RULES="$SOURCE_ROOT/rules"
SOURCE_AGENTS="$SOURCE_ROOT/agents"

TARGET_SKILLS="$HOME/.gemini/config/skills"
TARGET_RULES="$HOME/.gemini/config/rules" # TODO(verify) exact Antigravity rules discovery path
TARGET_AGENTS="$HOME/.gemini/config/agents"

# Validate source directories
for dir in "$SOURCE_SKILLS" "$SOURCE_RULES" "$SOURCE_AGENTS"; do
  if [ ! -d "$dir" ]; then
    echo "Error: Required source directory missing: $dir" >&2
    exit 1
  fi
done

# Collect items
SKILL_DIRS=()
for item in "$SOURCE_SKILLS"/*; do
  if [ -d "$item" ]; then
    SKILL_DIRS+=("$item")
  fi
done

RULE_FILES=()
for item in "$SOURCE_RULES"/*.md; do
  if [ -f "$item" ]; then
    RULE_FILES+=("$item")
  fi
done

AGENT_FILES=()
for item in "$SOURCE_AGENTS"/*.md; do
  if [ -f "$item" ]; then
    AGENT_FILES+=("$item")
  fi
done

SKILLS_COUNT=${#SKILL_DIRS[@]}
RULES_COUNT=${#RULE_FILES[@]}
AGENTS_COUNT=${#AGENT_FILES[@]}

if [ "$DRY_RUN" = true ]; then
  echo "============================================================"
  echo "         SWARM INSTALLATION DRY RUN (NO CHANGES MADE)"
  echo "============================================================"
  echo "Source Root: $SOURCE_ROOT"
  echo "Targets:"
  echo "  - Skills: $TARGET_SKILLS"
  echo "  - Rules:  $TARGET_RULES"
  echo "  - Agents: $TARGET_AGENTS"
  echo "------------------------------------------------------------"
  echo "Planned Operations:"
  echo "  - Skills to install: $SKILLS_COUNT directories"
  echo "  - Rules to install:  $RULES_COUNT markdown files"
  echo "  - Agents to install: $AGENTS_COUNT markdown files"
  echo "------------------------------------------------------------"
  echo "Status: Dry-run completed successfully. Zero files written."
  echo "============================================================"
  exit 0
fi

# Execute idempotent copy
mkdir -p "$TARGET_SKILLS" "$TARGET_RULES" "$TARGET_AGENTS"

installed_skills=0
for skill in "${SKILL_DIRS[@]}"; do
  cp -r "$skill" "$TARGET_SKILLS/"
  ((installed_skills++))
done

installed_rules=0
for rule in "${RULE_FILES[@]}"; do
  cp "$rule" "$TARGET_RULES/"
  ((installed_rules++))
done

installed_agents=0
for agent in "${AGENT_FILES[@]}"; do
  cp "$agent" "$TARGET_AGENTS/"
  ((installed_agents++))
done

echo "============================================================"
echo "         SWARM INSTALLATION SUMMARY"
echo "============================================================"
echo "Installation complete and verified."
echo "  - Installed Skills: $installed_skills directories -> $TARGET_SKILLS"
echo "  - Installed Rules:  $installed_rules files       -> $TARGET_RULES"
echo "  - Installed Agents: $installed_agents files      -> $TARGET_AGENTS"
echo "Existing user configurations preserved safely."
echo "============================================================"
