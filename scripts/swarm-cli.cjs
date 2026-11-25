#!/usr/bin/env node

/**
 * scripts/swarm-cli.cjs
 * Zero-dependency deterministic runtime CLI for .swarm/ state, file leases,
 * metrics telemetry, and stall detection.
 */

const fs = require("fs");
const path = require("path");

const MAX_FILES_PER_TASK = 5;
const VALID_MODES = new Set(["quick", "standard", "enterprise"]);
const VALID_TIERS = new Set(["tier_0", "tier_1", "tier_2"]);
const TIER_BUDGETS = Object.freeze({
  tier_0: 5,
  tier_1: 15,
  tier_2: 25,
});
const VALID_RELEASE_STATUSES = new Set(["completed", "failed", "cancelled"]);
const VALID_METRIC_TYPES = new Set(["task_summary", "agent_run", "stall"]);
const VALID_METRIC_STATUSES = new Set(["pass", "fail", "stalled"]);

function printUsage() {
  console.error(`Usage:
  node scripts/swarm-cli.cjs init [--dir <project-root>]
  node scripts/swarm-cli.cjs lock acquire --task <TASK_ID> --owner <AGENT> --files <f1,f2,...> [--mode <quick|standard|enterprise>] [--tier <tier_0|tier_1|tier_2>] [--dir <root>]
  node scripts/swarm-cli.cjs lock check --file <path> [--dir <root>]
  node scripts/swarm-cli.cjs lock release --task <TASK_ID> [--status <completed|failed|cancelled>] [--dir <root>]
  node scripts/swarm-cli.cjs log-metric --type <task_summary|agent_run|stall> --task <TASK_ID> --tier <tier_0|tier_1|tier_2> --status <pass|fail|stalled> --duration-ms <number> [--agent <name>] [--tests-passed <n>] [--tests-failed <n>] [--dir <root>]
  node scripts/swarm-cli.cjs check-stalls [--warn-min 3] [--escalate-min 5] [--dir <root>]
  node scripts/swarm-cli.cjs status [--dir <root>]`);
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
      const key = token.slice(2, eqIdx);
      flags[key] = token.slice(eqIdx + 1);
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

function normalizeRelativePath(rawPath) {
  if (typeof rawPath !== "string" || rawPath.trim() === "") {
    throw new Error("File path must be a non-empty string");
  }
  const trimmed = rawPath.trim();
  if (trimmed.includes("\0")) {
    throw new Error(`Unsafe path contains NUL byte: ${trimmed}`);
  }
  if (/^[a-zA-Z]:/.test(trimmed) || trimmed.startsWith("/") || trimmed.startsWith("\\") || path.isAbsolute(trimmed)) {
    throw new Error(`Absolute paths are forbidden: ${trimmed}`);
  }
  const posixPath = trimmed.replace(/\\/g, "/");
  const segments = posixPath.split("/");
  if (segments.includes("..")) {
    throw new Error(`Path traversal ('..') is forbidden: ${trimmed}`);
  }
  const cleanedSegments = segments.filter((seg) => seg !== "" && seg !== ".");
  if (cleanedSegments.length === 0) {
    throw new Error(`Invalid relative file path: ${trimmed}`);
  }
  return cleanedSegments.join("/");
}

function getSwarmPaths(projectRoot) {
  const root = path.resolve(projectRoot || process.cwd());
  const swarmDir = path.join(root, ".swarm");
  return {
    root,
    swarmDir,
    stateFile: path.join(swarmDir, "state.json"),
    stateTmpFile: path.join(swarmDir, "state.json.tmp"),
    contextFile: path.join(swarmDir, "project-context.md"),
    metricsFile: path.join(swarmDir, "metrics.jsonl"),
    followupsFile: path.join(swarmDir, "followups.md"),
  };
}

function readState(stateFile) {
  if (!fs.existsSync(stateFile)) {
    throw new Error(`State file not found: ${stateFile}. Run 'init' first.`);
  }
  const raw = fs.readFileSync(stateFile, "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.tasks)) {
    throw new Error(`Invalid state schema in ${stateFile}`);
  }
  return parsed;
}

function writeStateAtomic(paths, state) {
  state.updated_at = new Date().toISOString();
  const content = JSON.stringify(state, null, 2) + "\n";
  fs.writeFileSync(paths.stateTmpFile, content, "utf8");
  fs.renameSync(paths.stateTmpFile, paths.stateFile);
}

function cmdInit(flags) {
  const paths = getSwarmPaths(typeof flags.dir === "string" ? flags.dir : process.cwd());
  fs.mkdirSync(paths.swarmDir, { recursive: true });

  const created = [];

  if (!fs.existsSync(paths.stateFile)) {
    const initialState = {
      schema_version: 1,
      tasks: [],
      updated_at: new Date().toISOString(),
    };
    fs.writeFileSync(paths.stateFile, JSON.stringify(initialState, null, 2) + "\n", "utf8");
    created.push(".swarm/state.json");
  }

  if (!fs.existsSync(paths.contextFile)) {
    const localTemplate = path.join(paths.root, "config", "project-context.template.md");
    const repoTemplate = path.resolve(__dirname, "../config/project-context.template.md");
    const templatePath = fs.existsSync(localTemplate) ? localTemplate : repoTemplate;
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Missing project-context.template.md at ${templatePath}`);
    }
    fs.copyFileSync(templatePath, paths.contextFile);
    created.push(".swarm/project-context.md");
  }

  if (!fs.existsSync(paths.metricsFile)) {
    fs.writeFileSync(paths.metricsFile, "", "utf8");
    created.push(".swarm/metrics.jsonl");
  }

  if (!fs.existsSync(paths.followupsFile)) {
    fs.writeFileSync(paths.followupsFile, "# Deferred Non-Blocking Follow-ups\n\n", "utf8");
    created.push(".swarm/followups.md");
  }

  console.log(JSON.stringify({ ok: true, dir: paths.swarmDir, created }));
  return 0;
}

function cmdLockAcquire(flags) {
  const taskId = typeof flags.task === "string" ? flags.task.trim() : "";
  const owner = typeof flags.owner === "string" ? flags.owner.trim() : "";
  const rawFiles = typeof flags.files === "string" ? flags.files : "";
  const mode = typeof flags.mode === "string" ? flags.mode.trim() : "standard";
  const tier = typeof flags.tier === "string" ? flags.tier.trim() : "tier_1";

  if (!taskId) throw new Error("--task is required");
  if (!owner) throw new Error("--owner is required");
  if (!rawFiles) throw new Error("--files is required");
  if (!VALID_MODES.has(mode)) throw new Error(`Invalid --mode "${mode}". Must be quick, standard, or enterprise.`);
  if (!VALID_TIERS.has(tier)) throw new Error(`Invalid --tier "${tier}". Must be tier_0, tier_1, or tier_2.`);

  const rawList = rawFiles.split(",").map((f) => f.trim()).filter(Boolean);
  if (rawList.length === 0) {
    throw new Error("--files must contain at least one relative file path");
  }

  const uniqueFiles = [];
  const seenFiles = new Set();
  for (const item of rawList) {
    const normalized = normalizeRelativePath(item);
    if (!seenFiles.has(normalized)) {
      seenFiles.add(normalized);
      uniqueFiles.push(normalized);
    }
  }

  if (uniqueFiles.length > MAX_FILES_PER_TASK) {
    throw new Error(`File limit exceeded: ${uniqueFiles.length} files requested, maximum allowed is ${MAX_FILES_PER_TASK}`);
  }

  const paths = getSwarmPaths(typeof flags.dir === "string" ? flags.dir : process.cwd());
  const state = readState(paths.stateFile);

  for (const existing of state.tasks) {
    if (existing.lease_status !== "active") continue;
    if (existing.task_id === taskId) {
      throw new Error(`Task "${taskId}" already holds an active lease (owner: ${existing.owner})`);
    }
    const existingFiles = Array.isArray(existing.owned_files) ? existing.owned_files : [];
    for (const f of uniqueFiles) {
      if (existingFiles.includes(f)) {
        throw new Error(
          `Lock conflict on "${f}": currently leased by task_id="${existing.task_id}", owner="${existing.owner}"`
        );
      }
    }
  }

  const nowIso = new Date().toISOString();
  const newTask = {
    task_id: taskId,
    mode,
    tier,
    owner,
    owned_files: uniqueFiles,
    lease_status: "active",
    status: "in_progress",
    time_budget_minutes: TIER_BUDGETS[tier],
    review_rounds: 0,
    dependencies: [],
    started_at: nowIso,
    updated_at: nowIso,
    last_heartbeat_at: nowIso,
  };

  state.tasks.push(newTask);
  writeStateAtomic(paths, state);

  console.log(JSON.stringify({ ok: true, task: newTask }));
  return 0;
}

function cmdLockCheck(flags) {
  const rawFile = typeof flags.file === "string" ? flags.file : "";
  if (!rawFile) throw new Error("--file is required");

  const normalized = normalizeRelativePath(rawFile);
  const paths = getSwarmPaths(typeof flags.dir === "string" ? flags.dir : process.cwd());
  const state = readState(paths.stateFile);

  for (const task of state.tasks) {
    if (task.lease_status === "active" && Array.isArray(task.owned_files) && task.owned_files.includes(normalized)) {
      console.log(
        JSON.stringify({
          locked: true,
          file: normalized,
          task_id: task.task_id,
          owner: task.owner,
          lease_status: task.lease_status,
        })
      );
      return 0;
    }
  }

  console.log(JSON.stringify({ locked: false }));
  return 0;
}

function cmdLockRelease(flags) {
  const taskId = typeof flags.task === "string" ? flags.task.trim() : "";
  const releaseStatus = typeof flags.status === "string" ? flags.status.trim() : "completed";

  if (!taskId) throw new Error("--task is required");
  if (!VALID_RELEASE_STATUSES.has(releaseStatus)) {
    throw new Error(`Invalid --status "${releaseStatus}". Must be completed, failed, or cancelled.`);
  }

  const paths = getSwarmPaths(typeof flags.dir === "string" ? flags.dir : process.cwd());
  const state = readState(paths.stateFile);

  let target = null;
  for (let i = state.tasks.length - 1; i >= 0; i--) {
    if (state.tasks[i].task_id === taskId && state.tasks[i].lease_status === "active") {
      target = state.tasks[i];
      break;
    }
  }
  if (!target) {
    for (let i = state.tasks.length - 1; i >= 0; i--) {
      if (state.tasks[i].task_id === taskId) {
        target = state.tasks[i];
        break;
      }
    }
  }
  if (!target) {
    throw new Error(`Task "${taskId}" not found in ${paths.stateFile}`);
  }

  target.lease_status = "released";
  target.status = releaseStatus;
  target.updated_at = new Date().toISOString();
  writeStateAtomic(paths, state);

  console.log(
    JSON.stringify({
      ok: true,
      task_id: target.task_id,
      lease_status: target.lease_status,
      status: target.status,
      task: target,
    })
  );
  return 0;
}

function parseNonNegativeInt(raw, flagName) {
  if (raw === undefined) return undefined;
  if (raw === true || !/^\d+$/.test(String(raw))) {
    throw new Error(`Invalid integer for ${flagName}: ${raw}`);
  }
  return Number.parseInt(String(raw), 10);
}

function cmdLogMetric(flags) {
  const type = typeof flags.type === "string" ? flags.type.trim() : "";
  const taskId = typeof flags.task === "string" ? flags.task.trim() : "";
  const tier = typeof flags.tier === "string" ? flags.tier.trim() : "";
  const status = typeof flags.status === "string" ? flags.status.trim() : "";
  const rawDuration = flags["duration-ms"];
  const agent = typeof flags.agent === "string" ? flags.agent.trim() : undefined;

  if (!VALID_METRIC_TYPES.has(type)) {
    throw new Error(`Invalid --type "${type}". Must be task_summary, agent_run, or stall.`);
  }
  if (!taskId) throw new Error("--task is required");
  if (type === "agent_run" && !agent) {
    throw new Error("--agent is required when --type is agent_run");
  }
  if (!VALID_TIERS.has(tier)) {
    throw new Error(`Invalid --tier "${tier}". Must be tier_0, tier_1, or tier_2.`);
  }
  if (!VALID_METRIC_STATUSES.has(status)) {
    throw new Error(`Invalid --status "${status}". Must be pass, fail, or stalled.`);
  }
  if (rawDuration === undefined || rawDuration === true || !Number.isFinite(Number(rawDuration)) || Number(rawDuration) < 0) {
    throw new Error(`Invalid --duration-ms: ${rawDuration}. Must be a non-negative number.`);
  }

  const durationMs = Number(rawDuration);
  const testsPassed = parseNonNegativeInt(flags["tests-passed"], "--tests-passed");
  const testsFailed = parseNonNegativeInt(flags["tests-failed"], "--tests-failed");

  const record = {
    record_type: type,
    task_id: taskId,
    tier,
    risk_tier: tier,
    duration_ms: durationMs,
    duration_seconds: Number((durationMs / 1000).toFixed(3)),
    outcome: status,
    timestamp: new Date().toISOString(),
  };

  if (type === "task_summary") {
    record.status = status === "pass" ? "completed" : status === "fail" ? "failed" : "stalled";
    record.verdict = status === "pass" ? "approved" : status;
  } else {
    record.status = status;
  }

  if (agent) {
    record.agent = agent;
  }

  if (testsPassed !== undefined || testsFailed !== undefined) {
    record.tests_passed = testsPassed !== undefined ? testsPassed : 0;
    record.tests_failed = testsFailed !== undefined ? testsFailed : 0;
    record.tests_status = record.tests_failed > 0 || status === "fail" ? "failed" : "passed";
  } else if (status === "pass" || status === "fail") {
    record.tests_status = status === "pass" ? "passed" : "failed";
  }

  if (type === "stall" || status === "stalled") {
    record.stalled = true;
    record.stall_count = 1;
  }

  const paths = getSwarmPaths(typeof flags.dir === "string" ? flags.dir : process.cwd());
  fs.mkdirSync(paths.swarmDir, { recursive: true });
  fs.appendFileSync(paths.metricsFile, JSON.stringify(record) + "\n", "utf8");

  console.log(JSON.stringify({ ok: true, record }));
  return 0;
}

function cmdCheckStalls(flags) {
  const rawWarn = flags["warn-min"] !== undefined ? flags["warn-min"] : "3";
  const rawEscalate = flags["escalate-min"] !== undefined ? flags["escalate-min"] : "5";

  const warnMin = Number(rawWarn);
  const escalateMin = Number(rawEscalate);

  if (!Number.isFinite(warnMin) || warnMin <= 0) {
    throw new Error(`Invalid --warn-min: ${rawWarn}`);
  }
  if (!Number.isFinite(escalateMin) || escalateMin < warnMin) {
    throw new Error(`Invalid --escalate-min: ${rawEscalate}`);
  }

  const paths = getSwarmPaths(typeof flags.dir === "string" ? flags.dir : process.cwd());
  const state = readState(paths.stateFile);

  const nowMs = Date.now();
  const warn = [];
  const escalate = [];

  for (const task of state.tasks) {
    if (task.lease_status !== "active") continue;
    if (task.status === "completed" || task.status === "failed" || task.status === "cancelled") continue;

    const tsString = task.updated_at || task.last_heartbeat_at || task.started_at;
    const tsMs = Date.parse(tsString);
    if (!Number.isFinite(tsMs)) continue;

    const elapsedMin = (nowMs - tsMs) / 60000;
    if (elapsedMin >= escalateMin) {
      escalate.push({
        task_id: task.task_id,
        owner: task.owner,
        elapsed_minutes: Number(elapsedMin.toFixed(2)),
        updated_at: tsString,
      });
    } else if (elapsedMin >= warnMin) {
      warn.push({
        task_id: task.task_id,
        owner: task.owner,
        elapsed_minutes: Number(elapsedMin.toFixed(2)),
        updated_at: tsString,
      });
    }
  }

  console.log(JSON.stringify({ warn, escalate }));
  return warn.length > 0 || escalate.length > 0 ? 2 : 0;
}

function cmdStatus(flags) {
  const paths = getSwarmPaths(typeof flags.dir === "string" ? flags.dir : process.cwd());
  const state = readState(paths.stateFile);

  if (state.tasks.length === 0) {
    console.log("No tasks recorded in .swarm/state.json");
    return 0;
  }

  console.log("TASK_ID      | OWNER            | TIER   | LEASE    | STATUS      | FILES");
  console.log("-------------+------------------+--------+----------+-------------+-----------------------------");
  for (const t of state.tasks) {
    const id = String(t.task_id || "").padEnd(12);
    const owner = String(t.owner || "").padEnd(16);
    const tier = String(t.tier || "").padEnd(6);
    const lease = String(t.lease_status || "").padEnd(8);
    const st = String(t.status || "").padEnd(11);
    const files = Array.isArray(t.owned_files) ? t.owned_files.join(", ") : "";
    console.log(`${id} | ${owner} | ${tier} | ${lease} | ${st} | ${files}`);
  }
  return 0;
}

function main(argv) {
  const args = argv.slice(2);
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printUsage();
    return args.length === 0 ? 1 : 0;
  }

  const cmd = args[0];

  try {
    if (cmd === "init") {
      return cmdInit(parseFlags(args.slice(1)));
    }
    if (cmd === "lock") {
      const sub = args[1];
      const flags = parseFlags(args.slice(2));
      if (sub === "acquire") return cmdLockAcquire(flags);
      if (sub === "check") return cmdLockCheck(flags);
      if (sub === "release") return cmdLockRelease(flags);
      throw new Error(`Unknown lock subcommand "${sub}". Use acquire, check, or release.`);
    }
    if (cmd === "log-metric") {
      return cmdLogMetric(parseFlags(args.slice(1)));
    }
    if (cmd === "check-stalls") {
      return cmdCheckStalls(parseFlags(args.slice(1)));
    }
    if (cmd === "status") {
      return cmdStatus(parseFlags(args.slice(1)));
    }
    throw new Error(`Unknown command "${cmd}"`);
  } catch (err) {
    console.error(`ERROR: ${err.message}`);
    return 1;
  }
}

module.exports = {
  MAX_FILES_PER_TASK,
  normalizeRelativePath,
  main,
};

if (require.main === module) {
  process.exit(main(process.argv));
}
