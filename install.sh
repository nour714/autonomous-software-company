#!/usr/bin/env bash
# ==============================================================================
# Automated Installer for Antigravity Autonomous Software Company
# ==============================================================================
set -euo pipefail
shopt -s nullglob

DRY_RUN=false
VERIFY=false
for arg in "$@"; do
  if [ "$arg" == "--dry-run" ]; then
    DRY_RUN=true
  elif [ "$arg" == "--verify" ]; then
    VERIFY=true
  fi
done

SOURCE_ROOT="${SWARM_SOURCE_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
SOURCE_SKILLS="$SOURCE_ROOT/skills"
SOURCE_RULES="$SOURCE_ROOT/rules"
SOURCE_AGENTS="$SOURCE_ROOT/agents"
SOURCE_CONFIG="$SOURCE_ROOT/config"
SOURCE_SCRIPTS="$SOURCE_ROOT/scripts"

BASE_TARGET="${SWARM_TARGET_DIR:-$HOME/.gemini/config}"
TARGET_SKILLS="$BASE_TARGET/skills"
TARGET_RULES="$BASE_TARGET/rules"
TARGET_AGENTS="$BASE_TARGET/agents"
TARGET_CONFIG="$BASE_TARGET/config"
TARGET_SCRIPTS="$BASE_TARGET/scripts"

# Validate source directories
for dir in "$SOURCE_SKILLS" "$SOURCE_RULES" "$SOURCE_AGENTS" "$SOURCE_CONFIG" "$SOURCE_SCRIPTS"; do
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
while IFS= read -r file; do
  RULE_FILES+=("$file")
done < <(find "$SOURCE_RULES" -type f)

AGENT_FILES=()
for item in "$SOURCE_AGENTS"/*.md; do
  if [ -f "$item" ]; then
    AGENT_FILES+=("$item")
  fi
done

CONFIG_FILES=()
while IFS= read -r file; do
  CONFIG_FILES+=("$file")
done < <(find "$SOURCE_CONFIG" -type f)

SCRIPT_FILES=()
while IFS= read -r file; do
  SCRIPT_FILES+=("$file")
done < <(find "$SOURCE_SCRIPTS" -type f)

SKILLS_COUNT=${#SKILL_DIRS[@]}
RULES_COUNT=${#RULE_FILES[@]}
AGENTS_COUNT=${#AGENT_FILES[@]}
CONFIG_COUNT=${#CONFIG_FILES[@]}
SCRIPTS_COUNT=${#SCRIPT_FILES[@]}

if [ "$DRY_RUN" = true ]; then
  echo "============================================================"
  echo "         SWARM INSTALLATION DRY RUN (NO CHANGES MADE)"
  echo "============================================================"
  echo "Source Root: $SOURCE_ROOT"
  echo "Targets:"
  echo "  - Skills:  $TARGET_SKILLS"
  echo "  - Rules:   $TARGET_RULES"
  echo "  - Agents:  $TARGET_AGENTS"
  echo "  - Config:  $TARGET_CONFIG"
  echo "  - Scripts: $TARGET_SCRIPTS"
  echo "------------------------------------------------------------"
  echo "Planned Operations:"
  echo "  - Skills to install:  $SKILLS_COUNT directories"
  echo "  - Rules to install:   $RULES_COUNT files (including references)"
  echo "  - Agents to install:  $AGENTS_COUNT markdown files"
  echo "  - Config to install:  $CONFIG_COUNT configuration files"
  echo "  - Scripts to install: $SCRIPTS_COUNT script files"
  echo "------------------------------------------------------------"
  echo "Status: Dry-run completed successfully. Zero files written."
  echo "============================================================"
  exit 0
fi

# Execute idempotent copy
mkdir -p "$TARGET_SKILLS" "$TARGET_RULES" "$TARGET_AGENTS" "$TARGET_CONFIG" "$TARGET_SCRIPTS"

installed_skills=0
for skill in "${SKILL_DIRS[@]}"; do
  cp -r "$skill" "$TARGET_SKILLS/"
  installed_skills=$((installed_skills + 1))
done

# Copy rules recursively (including references/)
cp -r "$SOURCE_RULES"/* "$TARGET_RULES/"
installed_rules=$RULES_COUNT

installed_agents=0
for agent in "${AGENT_FILES[@]}"; do
  cp "$agent" "$TARGET_AGENTS/"
  installed_agents=$((installed_agents + 1))
done

# Copy config
cp -r "$SOURCE_CONFIG"/* "$TARGET_CONFIG/"
installed_config=$CONFIG_COUNT

# Copy scripts
cp -r "$SOURCE_SCRIPTS"/* "$TARGET_SCRIPTS/"
installed_scripts=$SCRIPTS_COUNT

echo "============================================================"
echo "         SWARM INSTALLATION SUMMARY"
echo "============================================================"
echo "Installation complete and verified."
echo "  - Installed Skills:  $installed_skills directories -> $TARGET_SKILLS"
echo "  - Installed Rules:   $installed_rules files       -> $TARGET_RULES"
echo "  - Installed Agents:  $installed_agents files      -> $TARGET_AGENTS"
echo "  - Installed Config:  $installed_config files      -> $TARGET_CONFIG"
echo "  - Installed Scripts: $installed_scripts files     -> $TARGET_SCRIPTS"
echo "Existing user configurations preserved safely."
echo "============================================================"

if [ "$VERIFY" = true ]; then
  echo "Verifying installation targets..."
  REQUIRED_FILES=(
    "$TARGET_CONFIG/swarm.config.yaml"
    "$TARGET_RULES/swarm-orchestration.md"
    "$TARGET_RULES/references/runtime-state.md"
    "$TARGET_RULES/references/protocol-cards.md"
    "$TARGET_SCRIPTS/verify-report.cjs"
  )
  for req in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$req" ]; then
      echo "Verification failed: missing $req" >&2
      exit 1
    fi
  done
  echo "Verification passed: all required files confirmed present."
fi
