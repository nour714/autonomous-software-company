#!/usr/bin/env bash
# ==============================================================================
# Autonomous Engineering System — Full Automated Smoke Test & Verification Suite
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "============================================================"
echo "      SWARM AUTOMATED SMOKE TEST & VERIFICATION SUITE"
echo "============================================================"
echo "Repository Root: ${REPO_ROOT}"
echo "Node Runtime:    $(node -v 2>/dev/null || echo 'NOT FOUND')"
echo "Timestamp:       $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "============================================================"

# Run core validation checks (Checks 1 to 7) via embedded Node.js
node -e '
const fs = require("fs");
const path = require("path");

const repoRoot = process.argv[1];
let totalErrors = 0;
let passedChecks = 0;

function report(step, passed, errors = []) {
  if (passed && errors.length === 0) {
    console.log(`[PASS] Check ${step}`);
    passedChecks++;
  } else {
    console.error(`[FAIL] Check ${step}:`);
    for (const err of errors) {
      console.error(`  - ${err}`);
      totalErrors++;
    }
  }
}

// -------------------------------------------------------------
// Check 1: Skill validation (SKILL.md, frontmatter, references)
// -------------------------------------------------------------
const skillsDir = path.join(repoRoot, "skills");
const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

let skillValidationErrors = [];

for (const dir of skillDirs) {
  const skillPath = path.join(skillsDir, dir, "SKILL.md");
  if (!fs.existsSync(skillPath)) {
    skillValidationErrors.push(`Missing SKILL.md in skills/${dir}`);
    continue;
  }
  const content = fs.readFileSync(skillPath, "utf8");
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) {
    skillValidationErrors.push(`Missing frontmatter in skills/${dir}/SKILL.md`);
    continue;
  }
  const fmLines = fmMatch[1].split(/\r?\n/);
  let name = null;
  let hasDesc = false;
  let hasIcon = false;
  let inMeta = false;

  for (const line of fmLines) {
    const nMatch = line.match(/^name:\s*["\x27]?([a-zA-Z0-9_-]+)["\x27]?\s*$/);
    if (nMatch) name = nMatch[1];
    if (line.match(/^description:\s*\S+/)) hasDesc = true;
    if (line.match(/^metadata:\s*$/)) inMeta = true;
    else if (inMeta && line.match(/^\S/)) inMeta = false;
    if (inMeta && line.match(/^\s+icon:\s*\S+/)) hasIcon = true;
  }

  if (!name) skillValidationErrors.push(`Missing or invalid name in skills/${dir}/SKILL.md`);
  else if (name !== dir) skillValidationErrors.push(`Name mismatch in skills/${dir}/SKILL.md: got "${name}", expected "${dir}"`);
  if (!hasDesc) skillValidationErrors.push(`Missing description in skills/${dir}/SKILL.md`);
  if (!hasIcon) skillValidationErrors.push(`Missing metadata.icon in skills/${dir}/SKILL.md`);

  const refMatches = content.matchAll(/references\/([a-zA-Z0-9_.-]+)/g);
  for (const m of refMatches) {
    const refFile = path.join(skillsDir, dir, "references", m[1]);
    if (!fs.existsSync(refFile)) {
      skillValidationErrors.push(`skills/${dir}/SKILL.md references missing file: references/${m[1]}`);
    }
  }
}

report("1: Skill validation (47 skills, SKILL.md, frontmatter, references)", skillValidationErrors.length === 0, skillValidationErrors);

// -------------------------------------------------------------
// Check 2: Skill size bounds (New <=80, Split <=120, Unsplit <=150)
// -------------------------------------------------------------
const newSkills = [
  "architecture-patterns",
  "api-design-principles",
  "frontend-ui-engineering",
  "verification-before-completion",
  "swarm_monitor"
];

let sizeErrors = [];

for (const dir of skillDirs) {
  const skillPath = path.join(skillsDir, dir, "SKILL.md");
  if (!fs.existsSync(skillPath)) continue;
  const content = fs.readFileSync(skillPath, "utf8");
  const lineCount = content.split(/\r?\n/).length;
  const hasReferencesDir = fs.existsSync(path.join(skillsDir, dir, "references"));

  if (newSkills.includes(dir)) {
    if (lineCount > 80) {
      sizeErrors.push(`New skill "${dir}" exceeds 80 lines: ${lineCount}`);
    }
  } else if (hasReferencesDir) {
    if (lineCount > 120) {
      sizeErrors.push(`Split skill "${dir}" exceeds 120 lines: ${lineCount}`);
    }
  } else {
    if (lineCount > 150) {
      sizeErrors.push(`Unsplit skill "${dir}" exceeds 150 lines: ${lineCount}`);
    }
  }
}

// Validate rules/swarm-orchestration.md line count <= 120
const swarmRulesPath = path.join(repoRoot, "rules", "swarm-orchestration.md");
if (fs.existsSync(swarmRulesPath)) {
  const ruleLines = fs.readFileSync(swarmRulesPath, "utf8").split(/\r?\n/).length;
  if (ruleLines > 120) {
    sizeErrors.push(`rules/swarm-orchestration.md exceeds 120 lines: ${ruleLines}`);
  }
}

report("2: Skill size validation (bounds: new <=80, split <=120, unsplit <=150)", sizeErrors.length === 0, sizeErrors);

// -------------------------------------------------------------
// Check 3: Agent & Roster validation (10 agents, profiles, models)
// -------------------------------------------------------------
const expectedAgents = [
  "dispatcher", "architect", "arch-critic", "backend-dev", "backend-critic",
  "frontend-dev", "frontend-critic", "qa-tester", "release-gatekeeper", "monitor"
];

const agentsDir = path.join(repoRoot, "agents");
let agentErrors = [];
let parsedAgents = new Map();

for (const agentName of expectedAgents) {
  const agentPath = path.join(agentsDir, `${agentName}.md`);
  if (!fs.existsSync(agentPath)) {
    agentErrors.push(`Missing agent file: agents/${agentName}.md`);
    continue;
  }
  const content = fs.readFileSync(agentPath, "utf8");
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!fmMatch) {
    agentErrors.push(`Missing frontmatter in agents/${agentName}.md`);
    continue;
  }
  const fmBody = fmMatch[1];
  const operatingBrief = fmMatch[2];

  const briefLines = operatingBrief.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (briefLines.length > 40) {
    agentErrors.push(`Operating brief in agents/${agentName}.md exceeds 40 lines: ${briefLines.length}`);
  }

  const fields = {};
  let currentListKey = null;
  for (const line of fmBody.split(/\r?\n/)) {
    const listMatch = line.match(/^(\s*)-\s*(.*)$/);
    if (listMatch && currentListKey) {
      fields[currentListKey].push(listMatch[2].split(/\s+#/)[0].trim().replace(/^["\x27]|["\x27]$/g, ""));
      continue;
    }
    const kvMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      const rawVal = kvMatch[2].split(/\s+#/)[0].trim();
      const val = rawVal.replace(/^["\x27]|["\x27]$/g, "");
      if (val === "" || val === "[]") {
        fields[key] = [];
        currentListKey = key;
      } else if (val.startsWith("[") && val.endsWith("]")) {
        fields[key] = val.slice(1, -1).split(",").map(s => s.split(/\s+#/)[0].trim().replace(/^["\x27]|["\x27]$/g, "")).filter(Boolean);
        currentListKey = null;
      } else {
        fields[key] = val;
        currentListKey = null;
      }
    }
  }

  const reqFields = ["name", "role", "model_primary", "model_fallback", "skills", "tools", "workspace", "timeout_minutes", "max_review_rounds"];
  for (const rf of reqFields) {
    if (fields[rf] === undefined || fields[rf] === null) {
      agentErrors.push(`Missing required field "${rf}" in agents/${agentName}.md`);
    }
  }

  if (fields.name !== agentName) {
    agentErrors.push(`Agent name mismatch in agents/${agentName}.md: got "${fields.name}", expected "${agentName}"`);
  }

  const agentSkills = Array.isArray(fields.skills) ? fields.skills : [];
  if (agentSkills.length > 3) {
    agentErrors.push(`Agent agents/${agentName}.md has > 3 preloaded skills: ${agentSkills.length}`);
  }
  for (const sk of agentSkills) {
    const skPath = path.join(skillsDir, sk, "SKILL.md");
    if (!fs.existsSync(skPath)) {
      agentErrors.push(`Agent agents/${agentName}.md references nonexistent skill: skills/${sk}/SKILL.md`);
    }
  }

  parsedAgents.set(agentName, fields);
}

const configContent = fs.readFileSync(path.join(repoRoot, "config", "swarm.config.yaml"), "utf8");

for (const [agentName, agentData] of parsedAgents.entries()) {
  const modelAgentRegex = new RegExp(`^\\s*${agentName}:\\s*["\x27]?([^\\s"\x27#]+)`, "m");
  const match = configContent.match(modelAgentRegex);
  if (!match) {
    agentErrors.push(`Agent "${agentName}" not found in config/swarm.config.yaml models.agents`);
  } else {
    const cfgPrimary = match[1].trim().replace(/^["\x27]|["\x27]$/g, "");
    if (cfgPrimary !== agentData.model_primary) {
      agentErrors.push(`model_primary mismatch for "${agentName}": config has "${cfgPrimary}", agent has "${agentData.model_primary}"`);
    }
  }
}

report("3: Agent & Roster validation (10 agents, briefs <=40 lines, max 3 skills)", agentErrors.length === 0, agentErrors);

// -------------------------------------------------------------
// Check 4: Markdown Link validation
// -------------------------------------------------------------
let linkErrors = [];
function checkMarkdownLinksInFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  const dir = path.dirname(filePath);

  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    let target = match[2].trim();
    if (target.startsWith("http://") || target.startsWith("https://") || target.startsWith("mailto:") || target.startsWith("#")) {
      continue;
    }
    target = target.split("?")[0].split("#")[0];
    if (!target) continue;

    const resolved = path.resolve(dir, target);
    if (!fs.existsSync(resolved)) {
      linkErrors.push(`Broken link in ${path.relative(repoRoot, filePath)}: target "${match[2]}" (resolved "${path.relative(repoRoot, resolved)}") not found`);
    }
  }
}

checkMarkdownLinksInFile(path.join(repoRoot, "README.md"));

const rulesDir = path.join(repoRoot, "rules");
if (fs.existsSync(rulesDir)) {
  for (const f of fs.readdirSync(rulesDir)) {
    const fullP = path.join(rulesDir, f);
    if (f.endsWith(".md")) {
      checkMarkdownLinksInFile(fullP);
    } else if (fs.statSync(fullP).isDirectory()) {
      for (const rf of fs.readdirSync(fullP)) {
        if (rf.endsWith(".md")) {
          checkMarkdownLinksInFile(path.join(fullP, rf));
        }
      }
    }
  }
}

for (const dir of skillDirs) {
  const sPath = path.join(skillsDir, dir, "SKILL.md");
  checkMarkdownLinksInFile(sPath);
  const refDir = path.join(skillsDir, dir, "references");
  if (fs.existsSync(refDir)) {
    for (const rf of fs.readdirSync(refDir)) {
      if (rf.endsWith(".md")) {
        checkMarkdownLinksInFile(path.join(refDir, rf));
      }
    }
  }
}

report("4: Markdown link integrity (README.md, rules/*.md, skills/**)", linkErrors.length === 0, linkErrors);

// -------------------------------------------------------------
// Check 5: Zero Hard-Coded Configured Provider Model IDs
// -------------------------------------------------------------
const forbiddenModelRegex = /\b(claude-3-5-sonnet|claude-3-5-haiku|claude-3-opus|claude-3-7-sonnet|claude-sonnet-4-6|claude-opus-4-6|gemini-2\.0-flash|gemini-1\.5-pro|gemini-3\.8-flash|gpt-4o|gpt-4o-mini|gpt-oss-120b)\b/i;

const filesToCheckForModels = [
  path.join(repoRoot, "README.md"),
  path.join(repoRoot, "rules", "swarm-orchestration.md"),
  path.join(repoRoot, "skills", "four-agent-swarm", "SKILL.md")
];

let modelIdErrors = [];
for (const f of filesToCheckForModels) {
  if (!fs.existsSync(f)) continue;
  const content = fs.readFileSync(f, "utf8");
  const lines = content.split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (forbiddenModelRegex.test(line)) {
      modelIdErrors.push(`Hardcoded model ID in ${path.relative(repoRoot, f)} line ${idx + 1}: ${line.trim()}`);
    }
  });
}

report("5: Zero hard-coded provider model IDs in rules/docs/orchestration", modelIdErrors.length === 0, modelIdErrors);

// -------------------------------------------------------------
// Check 6: Trigger phrase preservation
// -------------------------------------------------------------
const requiredTriggers = [
  "شغل 4 ايجنت",
  "شغل 9 ايجنت",
  "شغل الفريق",
  "شغل الشركة البرمجية",
  "swarm team",
  "/swarm"
];

let triggerErrors = [];
const fourAgentSkillPath = path.join(skillsDir, "four-agent-swarm", "SKILL.md");
if (!fs.existsSync(fourAgentSkillPath)) {
  triggerErrors.push("Missing skills/four-agent-swarm/SKILL.md");
} else {
  const content = fs.readFileSync(fourAgentSkillPath, "utf8");
  for (const phrase of requiredTriggers) {
    if (!content.includes(phrase)) {
      triggerErrors.push(`Trigger phrase "${phrase}" missing from skills/four-agent-swarm/SKILL.md`);
    }
  }

  // Verify Trigger -> mode mapping rule is documented
  if (!content.includes("Trigger -> Mode") && !content.includes("Trigger -> mode")) {
    triggerErrors.push("Missing Trigger -> mode rule section in skills/four-agent-swarm/SKILL.md");
  }
  if (!content.includes("never silently downgrade") && !content.includes("Never silently downgrade")) {
    triggerErrors.push("Missing never silently downgrade rule in skills/four-agent-swarm/SKILL.md");
  }
}

report("6: Trigger phrase preservation and Trigger -> mode rules verified", triggerErrors.length === 0, triggerErrors);

// -------------------------------------------------------------
// Check 7: Configuration validation (config/swarm.config.yaml)
// -------------------------------------------------------------
let configErrors = [];
const cfgPath = path.join(repoRoot, "config", "swarm.config.yaml");
if (!fs.existsSync(cfgPath)) {
  configErrors.push("Missing config/swarm.config.yaml");
} else {
  const content = fs.readFileSync(cfgPath, "utf8");
  if (!content.match(/^version:\s*1/m) && !content.match(/^schema_version:\s*1/m)) {
    configErrors.push("Expected version: 1 or schema_version: 1 in config/swarm.config.yaml");
  }

  for (const ag of expectedAgents) {
    const agRegex = new RegExp(`^\\s*${ag}:`, "m");
    if (!agRegex.test(content)) {
      configErrors.push(`Agent "${ag}" missing from config/swarm.config.yaml`);
    }
  }

  const hasQuick = content.includes("quick:") || content.includes("fast-track:");
  const hasStandard = content.includes("standard:") || content.includes("balanced:");
  const hasEnterprise = content.includes("enterprise:") || content.includes("full-rigor:");
  if (!hasQuick || !hasStandard || !hasEnterprise) {
    configErrors.push("Missing expected execution modes in config");
  }

  // Validate mode agent lists: quick <= 3 default agents and all 3 lists differ
  function parseModeAgents(modeName) {
    const modeSectionRegex = new RegExp(`${modeName}:[\\s\\S]*?typical_active_agents:([\\s\\S]*?)(?:routing_rules:|\\n\\s*\\w+:)`, "m");
    const m = content.match(modeSectionRegex);
    if (!m) return [];
    return m[1].split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.startsWith("-"))
      .map(l => l.replace(/^-\s*/, "").trim());
  }

  const quickAgents = parseModeAgents("quick");
  const standardAgents = parseModeAgents("standard");
  const enterpriseAgents = parseModeAgents("enterprise");

  if (quickAgents.length === 0 || quickAgents.length > 3) {
    configErrors.push(`quick mode typical_active_agents must have 1 to 3 agents (found ${quickAgents.length})`);
  }
  const quickKey = [...quickAgents].sort().join(",");
  const standardKey = [...standardAgents].sort().join(",");
  const enterpriseKey = [...enterpriseAgents].sort().join(",");

  if (quickKey === standardKey || quickKey === enterpriseKey || standardKey === enterpriseKey) {
    configErrors.push(`The three execution modes typical_active_agents must differ: quick=[${quickAgents}], standard=[${standardAgents}], enterprise=[${enterpriseAgents}]`);
  }

  const hasTier0 = content.includes("tier_0:");
  const hasTier1 = content.includes("tier_1:");
  const hasTier2 = content.includes("tier_2:");
  if (!hasTier0 || !hasTier1 || !hasTier2) {
    configErrors.push("Missing expected risk tiers in config");
  }

  const timeoutMatches = content.matchAll(/timeout_minutes:\s*([0-9]+)/g);
  for (const tm of timeoutMatches) {
    if (parseInt(tm[1], 10) <= 0) {
      configErrors.push(`Invalid non-positive timeout: ${tm[0]}`);
    }
  }
  const reviewMatches = content.matchAll(/max_review_rounds:\s*([0-9]+)/g);
  for (const rm of reviewMatches) {
    if (parseInt(rm[1], 10) < 1) {
      configErrors.push(`Invalid review rounds: ${rm[0]}`);
    }
  }
}

report("7: Configuration validation (swarm.config.yaml integrity)", configErrors.length === 0, configErrors);

if (totalErrors > 0) {
  console.error(`\nValidation failed with ${totalErrors} error(s).`);
  process.exit(1);
} else {
  console.log(`\nAll ${passedChecks} checks passed cleanly.`);
}
' "${REPO_ROOT}"

# Trigger -> mode grep verification
echo "[CHECK] Verifying Trigger -> mode mapping rule via grep..."
if grep -qi "Trigger -> mode" "${REPO_ROOT}/skills/four-agent-swarm/SKILL.md" && \
   grep -qi "never silently downgrade" "${REPO_ROOT}/skills/four-agent-swarm/SKILL.md"; then
  echo "  [PASS] Trigger -> mode rule grep verified in skills/four-agent-swarm/SKILL.md."
else
  echo "  [FAIL] skills/four-agent-swarm/SKILL.md missing Trigger -> mode rule" >&2
  exit 1
fi

# -------------------------------------------------------------
# Check 8: Installer dry-run verification
# -------------------------------------------------------------
echo "[CHECK] Check 8: Installer dry-run verification..."

echo "  Testing ./install.sh --dry-run..."
DRY_RUN_OUTPUT="$("${REPO_ROOT}/install.sh" --dry-run)"
if echo "${DRY_RUN_OUTPUT}" | grep -q "Status: Dry-run completed successfully"; then
  echo "  [PASS] ./install.sh --dry-run succeeded."
else
  echo "  [FAIL] ./install.sh --dry-run unexpected output: ${DRY_RUN_OUTPUT}"
  exit 1
fi

if command -v powershell >/dev/null 2>&1; then
  echo "  Testing ./install.ps1 -DryRun via powershell..."
  PS_OUTPUT="$(powershell -NoProfile -ExecutionPolicy Bypass -File "${REPO_ROOT}/install.ps1" -DryRun 2>&1 || true)"
  if echo "${PS_OUTPUT}" | grep -q "Status: Dry-run completed successfully"; then
    echo "  [PASS] ./install.ps1 -DryRun succeeded via powershell."
  else
    echo "  [FAIL] ./install.ps1 -DryRun unexpected output: ${PS_OUTPUT}"
    exit 1
  fi
elif command -v pwsh >/dev/null 2>&1; then
  echo "  Testing ./install.ps1 -DryRun via pwsh..."
  PS_OUTPUT="$(pwsh -NoProfile -ExecutionPolicy Bypass -File "${REPO_ROOT}/install.ps1" -DryRun 2>&1 || true)"
  if echo "${PS_OUTPUT}" | grep -q "Status: Dry-run completed successfully"; then
    echo "  [PASS] ./install.ps1 -DryRun succeeded via pwsh."
  else
    echo "  [FAIL] ./install.ps1 -DryRun unexpected output: ${PS_OUTPUT}"
    exit 1
  fi
else
  echo "  [INFO] Neither powershell nor pwsh available in path; bash installer verified."
fi

echo "[PASS] Check 8: Installer dry-run verification complete."

echo "============================================================"
echo "      ALL SMOKE TEST SUITE CHECKS PASSED (EXIT CODE 0)"
echo "============================================================"
