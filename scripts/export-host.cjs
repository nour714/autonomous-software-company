#!/usr/bin/env node

/**
 * scripts/export-host.cjs
 * Zero-dependency multi-IDE native host adapter compiler/exporter.
 * Reads config/swarm.config.yaml, rules/, agents/, skills/, scripts/ and
 * exports native layouts for antigravity, gemini-cli, claude-code, and cursor.
 */

const fs = require("fs");
const path = require("path");

const SUPPORTED_HOSTS = ["antigravity", "gemini-cli", "claude-code", "cursor"];

function printUsage() {
  console.error(
    "Usage: node scripts/export-host.cjs --host <antigravity|gemini-cli|claude-code|cursor|all> --target <dir> [--source <dir>] [--dry-run] [--verify]"
  );
}

function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    const token = args[i];
    if (!token.startsWith("--")) {
      throw new Error(`Unexpected positional argument: ${token}`);
    }
    const eqIdx = token.indexOf("=");
    if (eqIdx !== -1) {
      flags[token.slice(2, eqIdx)] = token.slice(eqIdx + 1);
      continue;
    }
    const key = token.slice(2);
    const next = args[i + 1];
    if (next === undefined || next.startsWith("--")) {
      flags[key] = true;
    } else {
      flags[key] = next;
      i++;
    }
  }
  return flags;
}

function parseProviderAdapters(configText) {
  const adapters = {};
  const lines = configText.split(/\r?\n/);
  let inAdapters = false;
  let currentHost = null;
  let currentTier = null;

  for (const line of lines) {
    if (/^\s*provider_adapters:\s*$/.test(line)) {
      inAdapters = true;
      continue;
    }
    if (!inAdapters) continue;

    // Exit provider_adapters when indentation returns to <= 2 spaces (like excluded_models:)
    if (/^\S/.test(line) || /^  [a-zA-Z0-9_-]+:/.test(line)) {
      break;
    }

    const hostMatch = line.match(/^    ([a-zA-Z0-9_-]+):\s*$/);
    if (hostMatch) {
      currentHost = hostMatch[1];
      adapters[currentHost] = {};
      currentTier = null;
      continue;
    }

    const tierMatch = line.match(/^      ([a-zA-Z0-9_-]+):\s*$/);
    if (tierMatch && currentHost) {
      currentTier = tierMatch[1];
      adapters[currentHost][currentTier] = {};
      continue;
    }

    const kvMatch = line.match(/^        (primary|fallback):\s*["']?([^"'\s#]+)["']?\s*$/);
    if (kvMatch && currentHost && currentTier) {
      adapters[currentHost][currentTier][kvMatch[1]] = kvMatch[2];
    }
  }

  return adapters;
}

function parseAgentFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new Error(`Invalid frontmatter in agent file: ${filePath}`);
  }

  const fmBody = match[1];
  const brief = match[2].trim();
  const fields = {};
  let currentListKey = null;

  for (const line of fmBody.split(/\r?\n/)) {
    const listMatch = line.match(/^(\s*)-\s*(.*)$/);
    if (listMatch && currentListKey) {
      fields[currentListKey].push(listMatch[2].trim().replace(/^["']|["']$/g, ""));
      continue;
    }
    const kvMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      const val = kvMatch[2].trim().replace(/^["']|["']$/g, "");
      if (val === "" || val === "[]") {
        fields[key] = [];
        currentListKey = key;
      } else {
        fields[key] = val;
        currentListKey = null;
      }
    }
  }

  return { fields, brief, raw: content };
}

function loadAgents(sourceRoot) {
  const agentsDir = path.join(sourceRoot, "agents");
  const files = fs
    .readdirSync(agentsDir)
    .filter((f) => f.endsWith(".md"))
    .sort();
  return files.map((f) => parseAgentFile(path.join(agentsDir, f)));
}

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function countFilesRecursive(dir) {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) count += countFilesRecursive(full);
    else if (entry.isFile()) count++;
  }
  return count;
}

function mapClaudeTools(rawTools) {
  const toolMap = {
    read_file: "Read",
    write_file: "Write",
    edit_file: "Edit",
    run_command: "Bash",
    swarm: "Agent",
  };
  const mapped = [];
  for (const t of rawTools || []) {
    const candidate = toolMap[t] || null;
    if (candidate && !mapped.includes(candidate)) {
      mapped.push(candidate);
    }
  }
  if (!mapped.includes("Read")) mapped.unshift("Read");
  if (!mapped.includes("Grep")) mapped.push("Grep");
  if (!mapped.includes("Glob")) mapped.push("Glob");
  return mapped.join(", ");
}

function extractMissionSummary(brief) {
  const lines = brief.split(/\r?\n/);
  let capture = false;
  for (const line of lines) {
    if (/^##\s+Mission/i.test(line)) {
      capture = true;
      continue;
    }
    if (capture && line.trim().length > 0 && !line.startsWith("#")) {
      return line.trim().replace(/"/g, "'");
    }
  }
  return "Swarm specialist agent";
}

function buildGeminiEntrypoint(host, agents, hostAdapter) {
  const agentRows = agents
    .map((a) => {
      const tier = a.fields.model_tier || "builder_tier";
      const resolved = (hostAdapter && hostAdapter[tier]) || { primary: tier, fallback: tier };
      return `- \`${a.fields.name}\` (${a.fields.role}): \`${tier}\` -> primary \`${resolved.primary}\`, fallback \`${resolved.fallback}\``;
    })
    .join("\n");

  return `# Autonomous Software Company — ${host} Entrypoint

This directory was exported from \`nour714/autonomous-software-company\`.

## Canonical Governance & Config
- Orchestration rules: \`rules/swarm-orchestration.md\` (and \`rules/references/\`)
- Central config: \`config/swarm.config.yaml\`
- Deterministic runtime CLI: \`node scripts/swarm-cli.cjs\` (\`init\`, \`lock\`, \`worktree\`, \`log-metric\`, \`check-stalls\`, \`status\`)
- Audit report verifier: \`node scripts/verify-report.cjs <report.md>\`

## Squad Roster (${host} adapter)
${agentRows}

## Supported Trigger Phrases
- \`شغل 4 ايجنت\` | \`شغل 9 ايجنت\` | \`شغل الفريق\` | \`شغل الشركة البرمجية\` | \`swarm team\` | \`/swarm\`
`;
}

function buildClaudeEntrypoint(agents, hostAdapter) {
  const agentRows = agents
    .map((a) => {
      const tier = a.fields.model_tier || "builder_tier";
      const resolved = (hostAdapter && hostAdapter[tier]) || { primary: tier, fallback: tier };
      return `- \`@${a.fields.name}\` (${a.fields.role}): \`.claude/agents/${a.fields.name}.md\` (\`${resolved.primary}\`, fallback \`${resolved.fallback}\`)`;
    })
    .join("\n");

  return `# Autonomous Software Company — Claude Code Entrypoint

This workspace uses the Hybrid Autonomous Engineering Harness exported for **Claude Code**.

## Architecture & Runtime
- Subagent definitions: \`.claude/agents/*.md\`
- Lazy-loaded skills: \`.claude/skills/*/SKILL.md\`
- Governance rules & config: \`.swarm-config/rules/swarm-orchestration.md\` & \`.swarm-config/config/swarm.config.yaml\`
- Deterministic CLI runtime: \`node .swarm-config/scripts/swarm-cli.cjs\`
- Audit report verifier: \`node .swarm-config/scripts/verify-report.cjs <report.md>\`

## Squad Subagents
${agentRows}

## Trigger Phrases
\`شغل 4 ايجنت\`, \`شغل 9 ايجنت\`, \`شغل الفريق\`, \`شغل الشركة البرمجية\`, \`swarm team\`, \`/swarm\`
`;
}

function exportGeminiCompatible(host, sourceRoot, targetDir, agents, adapters, dryRun) {
  const required = [
    path.join(targetDir, "GEMINI.md"),
    path.join(targetDir, "config", "swarm.config.yaml"),
    path.join(targetDir, "rules", "swarm-orchestration.md"),
    path.join(targetDir, "rules", "references", "runtime-state.md"),
    path.join(targetDir, "rules", "references", "protocol-cards.md"),
    path.join(targetDir, "scripts", "swarm-cli.cjs"),
    path.join(targetDir, "scripts", "verify-report.cjs"),
    ...agents.map((a) => path.join(targetDir, "agents", `${a.fields.name}.md`)),
  ];

  if (dryRun) {
    return {
      host,
      targetDir,
      planned: [
        `Copy skills/ -> ${path.join(targetDir, "skills")}`,
        `Copy rules/ (recursive) -> ${path.join(targetDir, "rules")}`,
        `Copy agents/ (${agents.length} files) -> ${path.join(targetDir, "agents")}`,
        `Copy config/ -> ${path.join(targetDir, "config")}`,
        `Copy scripts/ -> ${path.join(targetDir, "scripts")}`,
        `Generate ${path.join(targetDir, "GEMINI.md")}`,
      ],
      required,
    };
  }

  copyDirRecursive(path.join(sourceRoot, "skills"), path.join(targetDir, "skills"));
  copyDirRecursive(path.join(sourceRoot, "rules"), path.join(targetDir, "rules"));
  copyDirRecursive(path.join(sourceRoot, "agents"), path.join(targetDir, "agents"));
  copyDirRecursive(path.join(sourceRoot, "config"), path.join(targetDir, "config"));
  copyDirRecursive(path.join(sourceRoot, "scripts"), path.join(targetDir, "scripts"));

  const geminiMd = buildGeminiEntrypoint(host, agents, adapters[host]);
  fs.writeFileSync(path.join(targetDir, "GEMINI.md"), geminiMd, "utf8");

  return { host, targetDir, required };
}

function exportClaudeCode(sourceRoot, targetDir, agents, adapters, dryRun) {
  const claudeDir = path.join(targetDir, ".claude");
  const claudeAgentsDir = path.join(claudeDir, "agents");
  const claudeSkillsDir = path.join(claudeDir, "skills");
  const swarmCfgDir = path.join(targetDir, ".swarm-config");

  const required = [
    path.join(targetDir, "CLAUDE.md"),
    path.join(swarmCfgDir, "config", "swarm.config.yaml"),
    path.join(swarmCfgDir, "rules", "swarm-orchestration.md"),
    path.join(swarmCfgDir, "rules", "references", "runtime-state.md"),
    path.join(swarmCfgDir, "scripts", "swarm-cli.cjs"),
    path.join(swarmCfgDir, "scripts", "verify-report.cjs"),
    ...agents.map((a) => path.join(claudeAgentsDir, `${a.fields.name}.md`)),
  ];

  if (dryRun) {
    return {
      host: "claude-code",
      targetDir,
      planned: [
        `Generate ${agents.length} Claude subagents -> ${claudeAgentsDir}`,
        `Copy skills/ -> ${claudeSkillsDir}`,
        `Copy config/, rules/, scripts/ -> ${swarmCfgDir}`,
        `Generate ${path.join(targetDir, "CLAUDE.md")}`,
      ],
      required,
    };
  }

  fs.mkdirSync(claudeAgentsDir, { recursive: true });
  copyDirRecursive(path.join(sourceRoot, "skills"), claudeSkillsDir);
  copyDirRecursive(path.join(sourceRoot, "config"), path.join(swarmCfgDir, "config"));
  copyDirRecursive(path.join(sourceRoot, "rules"), path.join(swarmCfgDir, "rules"));
  copyDirRecursive(path.join(sourceRoot, "scripts"), path.join(swarmCfgDir, "scripts"));

  const claudeAdapter = adapters["claude-code"] || {};
  for (const agent of agents) {
    const tier = agent.fields.model_tier || "builder_tier";
    const resolved = claudeAdapter[tier] || { primary: "claude-sonnet-4-6", fallback: "claude-haiku-4-6" };
    const summary = extractMissionSummary(agent.brief);
    const toolsList = mapClaudeTools(agent.fields.tools);
    const skillsList = Array.isArray(agent.fields.skills) ? agent.fields.skills.join(", ") : "";

    const out = `---
name: ${agent.fields.name}
description: "${agent.fields.role}: ${summary} (fallback: ${resolved.fallback})"
tools: ${toolsList}
model: ${resolved.primary}
---

${agent.brief}

## Host References
- Preloaded skills in \`.claude/skills/\`: ${skillsList}
- Orchestration rules: \`.swarm-config/rules/swarm-orchestration.md\`
- Deterministic CLI: \`node .swarm-config/scripts/swarm-cli.cjs\`
`;
    fs.writeFileSync(path.join(claudeAgentsDir, `${agent.fields.name}.md`), out, "utf8");
  }

  fs.writeFileSync(path.join(targetDir, "CLAUDE.md"), buildClaudeEntrypoint(agents, claudeAdapter), "utf8");

  return { host: "claude-code", targetDir, required };
}

function exportCursor(sourceRoot, targetDir, agents, adapters, dryRun) {
  const cursorRulesDir = path.join(targetDir, ".cursor", "rules");
  const cursorSwarmDir = path.join(targetDir, ".cursor", "swarm");

  const required = [
    path.join(cursorRulesDir, "swarm-orchestration.mdc"),
    path.join(cursorSwarmDir, "config", "swarm.config.yaml"),
    path.join(cursorSwarmDir, "rules", "swarm-orchestration.md"),
    path.join(cursorSwarmDir, "scripts", "swarm-cli.cjs"),
    path.join(cursorSwarmDir, "scripts", "verify-report.cjs"),
    ...agents.map((a) => path.join(cursorRulesDir, `agent-${a.fields.name}.mdc`)),
  ];

  if (dryRun) {
    return {
      host: "cursor",
      targetDir,
      planned: [
        `Generate ${path.join(cursorRulesDir, "swarm-orchestration.mdc")}`,
        `Generate ${agents.length} role MDC rules -> ${cursorRulesDir}`,
        `Copy config/, rules/, skills/, scripts/ -> ${cursorSwarmDir}`,
      ],
      required,
    };
  }

  fs.mkdirSync(cursorRulesDir, { recursive: true });
  copyDirRecursive(path.join(sourceRoot, "config"), path.join(cursorSwarmDir, "config"));
  copyDirRecursive(path.join(sourceRoot, "rules"), path.join(cursorSwarmDir, "rules"));
  copyDirRecursive(path.join(sourceRoot, "skills"), path.join(cursorSwarmDir, "skills"));
  copyDirRecursive(path.join(sourceRoot, "scripts"), path.join(cursorSwarmDir, "scripts"));

  const orchestrationRules = fs.readFileSync(path.join(sourceRoot, "rules", "swarm-orchestration.md"), "utf8");
  const mainMdc = `---
description: Autonomous Software Company multi-agent orchestration rules and deterministic CLI runtime
globs: "**/*"
alwaysApply: true
---

> Exported Cursor MDC entrypoint. Config, skills, and CLI live under \`.cursor/swarm/\`.

${orchestrationRules.trim()}
`;
  fs.writeFileSync(path.join(cursorRulesDir, "swarm-orchestration.mdc"), mainMdc, "utf8");

  const cursorAdapter = adapters.cursor || {};
  for (const agent of agents) {
    const tier = agent.fields.model_tier || "builder_tier";
    const resolved = cursorAdapter[tier] || { primary: "cursor-standard", fallback: "cursor-fast" };
    const summary = extractMissionSummary(agent.brief);
    const skillsList = Array.isArray(agent.fields.skills) ? agent.fields.skills.join(", ") : "";

    const roleMdc = `---
description: "${agent.fields.role} (@${agent.fields.name}): ${summary}"
globs: ""
alwaysApply: false
---

- **Model Tier:** \`${tier}\` (primary: \`${resolved.primary}\`, fallback: \`${resolved.fallback}\`)
- **Preloaded Skills (\`.cursor/swarm/skills/\`):** ${skillsList}
- **Workspace Mode:** \`${agent.fields.workspace || "inherit"}\` | **Timeout:** ${agent.fields.timeout_minutes || 15}m
- **Deterministic CLI:** \`node .cursor/swarm/scripts/swarm-cli.cjs\`

${agent.brief}
`;
    fs.writeFileSync(path.join(cursorRulesDir, `agent-${agent.fields.name}.mdc`), roleMdc, "utf8");
  }

  return { host: "cursor", targetDir, required };
}

function verifyExport(result) {
  const missingOrEmpty = [];
  for (const reqFile of result.required) {
    if (!fs.existsSync(reqFile)) {
      missingOrEmpty.push(`missing: ${reqFile}`);
    } else {
      const stat = fs.statSync(reqFile);
      if (!stat.isFile() || stat.size === 0) {
        missingOrEmpty.push(`empty or non-file: ${reqFile}`);
      }
    }
  }

  let skillsDir = null;
  if (result.host === "claude-code") {
    skillsDir = path.join(result.targetDir, ".claude", "skills");
  } else if (result.host === "cursor") {
    skillsDir = path.join(result.targetDir, ".cursor", "swarm", "skills");
  } else {
    skillsDir = path.join(result.targetDir, "skills");
  }

  if (!fs.existsSync(skillsDir) || countFilesRecursive(skillsDir) === 0) {
    missingOrEmpty.push(`empty skills directory: ${skillsDir}`);
  }

  if (missingOrEmpty.length > 0) {
    throw new Error(`Verification failed for host "${result.host}":\n  - ${missingOrEmpty.join("\n  - ")}`);
  }
}

function main(argv) {
  try {
    const args = argv.slice(2);
    if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
      printUsage();
      return args.length === 0 ? 1 : 0;
    }

    const flags = parseFlags(args);
    const rawHost = typeof flags.host === "string" ? flags.host.trim() : "";
    const rawTarget = typeof flags.target === "string" ? flags.target.trim() : "";
    const sourceRoot = path.resolve(typeof flags.source === "string" ? flags.source : path.resolve(__dirname, ".."));
    const dryRun = Boolean(flags["dry-run"]);
    const verify = Boolean(flags.verify);

    if (!rawHost) throw new Error("--host is required");
    if (!rawTarget) throw new Error("--target is required");
    if (rawHost !== "all" && !SUPPORTED_HOSTS.includes(rawHost)) {
      throw new Error(`Unsupported --host "${rawHost}". Supported: ${SUPPORTED_HOSTS.join(", ")}, all`);
    }

    const configPath = path.join(sourceRoot, "config", "swarm.config.yaml");
    if (!fs.existsSync(configPath)) {
      throw new Error(`Missing config/swarm.config.yaml at ${configPath}`);
    }

    const configText = fs.readFileSync(configPath, "utf8");
    const adapters = parseProviderAdapters(configText);
    const agents = loadAgents(sourceRoot);
    const targetRoot = path.resolve(rawTarget);

    const hostsToExport = rawHost === "all" ? SUPPORTED_HOSTS : [rawHost];
    const results = [];

    for (const host of hostsToExport) {
      const hostTarget = rawHost === "all" ? path.join(targetRoot, host) : targetRoot;
      let res;
      if (host === "antigravity" || host === "gemini-cli") {
        res = exportGeminiCompatible(host, sourceRoot, hostTarget, agents, adapters, dryRun);
      } else if (host === "claude-code") {
        res = exportClaudeCode(sourceRoot, hostTarget, agents, adapters, dryRun);
      } else if (host === "cursor") {
        res = exportCursor(sourceRoot, hostTarget, agents, adapters, dryRun);
      }
      if (!dryRun && verify) {
        verifyExport(res);
      }
      results.push(res);
    }

    if (dryRun) {
      console.log(
        JSON.stringify(
          {
            ok: true,
            dry_run: true,
            hosts: results.map((r) => ({ host: r.host, target: r.targetDir, planned: r.planned })),
          },
          null,
          2
        )
      );
      return 0;
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          verified: verify,
          exported: results.map((r) => ({
            host: r.host,
            target: r.targetDir,
            verified_files: r.required.length,
          })),
        },
        null,
        2
      )
    );
    return 0;
  } catch (err) {
    console.error(`ERROR: ${err.message}`);
    return 1;
  }
}

module.exports = {
  SUPPORTED_HOSTS,
  parseProviderAdapters,
  parseAgentFile,
  main,
};

if (require.main === module) {
  process.exit(main(process.argv));
}
