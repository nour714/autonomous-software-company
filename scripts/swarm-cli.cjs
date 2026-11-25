#!/usr/bin/env node

/**
 * scripts/swarm-cli.cjs
 * Zero-dependency deterministic runtime CLI for .swarm/ state, file leases,
 * metrics telemetry, and stall detection.
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const MAX_FILES_PER_TASK = 5;
const SAFE_TASK_ID_REGEX = /^[a-zA-Z0-9._-]+$/;
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
  node scripts/swarm-cli.cjs lock verify-staged [--task <TASK_ID>] [--allow-untracked-outside-swarm] [--dir <root>]
  node scripts/swarm-cli.cjs hooks install [--force] [--dir <repo-root>]
  node scripts/swarm-cli.cjs hooks uninstall [--dir <repo-root>]
  node scripts/swarm-cli.cjs log-metric --type <task_summary|agent_run|stall> --task <TASK_ID> --tier <tier_0|tier_1|tier_2> --status <pass|fail|stalled> --duration-ms <number> [--agent <name>] [--tests-passed <n>] [--tests-failed <n>] [--dir <root>]
  node scripts/swarm-cli.cjs check-stalls [--warn-min 3] [--escalate-min 5] [--dir <root>]
  node scripts/swarm-cli.cjs status [--dir <root>]
  node scripts/swarm-cli.cjs worktree create --task <TASK_ID> --owner <AGENT> [--base <branch>] [--dir <root>]
  node scripts/swarm-cli.cjs worktree list [--json] [--dir <root>]
  node scripts/swarm-cli.cjs worktree merge --task <TASK_ID> [--into <branch>] [--no-ff] [--dir <root>]
  node scripts/swarm-cli.cjs worktree cleanup --task <TASK_ID> [--delete-branch] [--dir <root>]`);
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

function validateTaskId(taskId) {
  if (
    typeof taskId !== "string" ||
    !SAFE_TASK_ID_REGEX.test(taskId) ||
    taskId === "." ||
    taskId === ".." ||
    taskId.includes("..")
  ) {
    throw new Error(`Invalid task ID "${taskId}". Must match ^[a-zA-Z0-9._-]+$ without '..'.`);
  }
  return taskId;
}

function runGit(args, cwd) {
  return spawnSync("git", args, { cwd, encoding: "utf8" });
}

function ensureGitRepo(dir) {
  const res = runGit(["rev-parse", "--show-toplevel"], dir);
  if (res.status !== 0) {
    throw new Error(`Not inside a git repository: ${dir}`);
  }
  return res.stdout.trim();
}

function cmdWorktreeCreate(flags) {
  const rawTaskId = typeof flags.task === "string" ? flags.task.trim() : "";
  const owner = typeof flags.owner === "string" ? flags.owner.trim() : "";
  const baseRef = typeof flags.base === "string" ? flags.base.trim() : "HEAD";
  const mode = typeof flags.mode === "string" ? flags.mode.trim() : "standard";
  const tier = typeof flags.tier === "string" ? flags.tier.trim() : "tier_1";

  if (!rawTaskId) throw new Error("--task is required");
  if (!owner) throw new Error("--owner is required");
  const taskId = validateTaskId(rawTaskId);

  const paths = getSwarmPaths(typeof flags.dir === "string" ? flags.dir : process.cwd());
  ensureGitRepo(paths.root);
  const state = readState(paths.stateFile);

  const branchName = `swarm/${taskId}`;
  const worktreeRel = `.swarm/worktrees/${taskId}`;
  const worktreeAbs = path.join(paths.swarmDir, "worktrees", taskId);

  if (fs.existsSync(worktreeAbs)) {
    throw new Error(`Worktree already exists: ${worktreeRel}`);
  }
  if (runGit(["show-ref", "--verify", "--quiet", `refs/heads/${branchName}`], paths.root).status === 0) {
    throw new Error(`Branch already exists: ${branchName}`);
  }

  fs.mkdirSync(path.dirname(worktreeAbs), { recursive: true });
  const addRes = runGit(["worktree", "add", "-b", branchName, worktreeRel, baseRef], paths.root);
  if (addRes.status !== 0) {
    throw new Error(`git worktree add failed: ${(addRes.stderr || addRes.stdout || "").trim()}`);
  }

  const nowIso = new Date().toISOString();
  let taskEntry = state.tasks.find((t) => t.task_id === taskId);
  if (taskEntry) {
    taskEntry.worktree_path = worktreeRel;
    taskEntry.branch = branchName;
    taskEntry.updated_at = nowIso;
  } else {
    taskEntry = {
      task_id: taskId,
      mode,
      tier,
      owner,
      owned_files: [],
      lease_status: "active",
      status: "in_progress",
      time_budget_minutes: TIER_BUDGETS[tier] || 15,
      review_rounds: 0,
      dependencies: [],
      worktree_path: worktreeRel,
      branch: branchName,
      started_at: nowIso,
      updated_at: nowIso,
      last_heartbeat_at: nowIso,
    };
    state.tasks.push(taskEntry);
  }

  writeStateAtomic(paths, state);

  console.log(
    JSON.stringify({
      ok: true,
      task_id: taskId,
      owner,
      branch: branchName,
      worktree_path: worktreeRel,
    })
  );
  return 0;
}

function cmdWorktreeList(flags) {
  const paths = getSwarmPaths(typeof flags.dir === "string" ? flags.dir : process.cwd());
  ensureGitRepo(paths.root);

  const state = fs.existsSync(paths.stateFile) ? readState(paths.stateFile) : { tasks: [] };
  const porcelainRes = runGit(["worktree", "list", "--porcelain"], paths.root);
  const liveWorktrees = new Map();

  if (porcelainRes.status === 0) {
    let currentPath = null;
    let currentBranch = null;
    for (const line of porcelainRes.stdout.split(/\r?\n/)) {
      if (line.startsWith("worktree ")) {
        currentPath = line.slice("worktree ".length).trim();
        currentBranch = null;
      } else if (line.startsWith("branch ")) {
        currentBranch = line.slice("branch ".length).trim().replace(/^refs\/heads\//, "");
      } else if (line.trim() === "" && currentPath) {
        if (currentBranch && currentBranch.startsWith("swarm/")) {
          liveWorktrees.set(currentBranch, currentPath);
        }
        currentPath = null;
        currentBranch = null;
      }
    }
    if (currentPath && currentBranch && currentBranch.startsWith("swarm/")) {
      liveWorktrees.set(currentBranch, currentPath);
    }
  }

  const results = [];
  const seenBranches = new Set();

  for (const t of state.tasks) {
    if (!t.worktree_path && !t.branch) continue;
    const branchName = t.branch || `swarm/${t.task_id}`;
    const wtRel = t.worktree_path || `.swarm/worktrees/${t.task_id}`;
    const wtAbs = path.resolve(paths.root, wtRel);
    const existsOnDisk = fs.existsSync(wtAbs);
    if (!existsOnDisk && !liveWorktrees.has(branchName)) continue;

    seenBranches.add(branchName);
    let dirty = false;
    if (existsOnDisk) {
      const stRes = runGit(["-C", wtAbs, "status", "--porcelain"], paths.root);
      dirty = stRes.status === 0 && stRes.stdout.trim().length > 0;
    }

    results.push({
      task_id: t.task_id,
      owner: t.owner || "unknown",
      branch: branchName,
      worktree_path: wtRel,
      status: dirty ? "dirty" : "clean",
      task_status: t.status || "in_progress",
    });
  }

  for (const [branchName, wtAbs] of liveWorktrees.entries()) {
    if (seenBranches.has(branchName)) continue;
    const taskId = branchName.replace(/^swarm\//, "");
    const stRes = runGit(["-C", wtAbs, "status", "--porcelain"], paths.root);
    const dirty = stRes.status === 0 && stRes.stdout.trim().length > 0;
    results.push({
      task_id: taskId,
      owner: "unknown",
      branch: branchName,
      worktree_path: `.swarm/worktrees/${taskId}`,
      status: dirty ? "dirty" : "clean",
      task_status: "untracked",
    });
  }

  if (flags.json) {
    console.log(JSON.stringify({ worktrees: results }));
    return 0;
  }

  if (results.length === 0) {
    console.log("No active swarm worktrees.");
    return 0;
  }

  console.log("TASK_ID      | OWNER            | BRANCH               | STATE | PATH");
  console.log("-------------+------------------+----------------------+-------+-----------------------------");
  for (const w of results) {
    console.log(
      `${String(w.task_id).padEnd(12)} | ${String(w.owner).padEnd(16)} | ${String(w.branch).padEnd(20)} | ${String(w.status).padEnd(5)} | ${w.worktree_path}`
    );
  }
  return 0;
}

function cmdWorktreeMerge(flags) {
  const rawTaskId = typeof flags.task === "string" ? flags.task.trim() : "";
  if (!rawTaskId) throw new Error("--task is required");
  const taskId = validateTaskId(rawTaskId);

  const paths = getSwarmPaths(typeof flags.dir === "string" ? flags.dir : process.cwd());
  ensureGitRepo(paths.root);
  const state = readState(paths.stateFile);

  const taskEntry = state.tasks.find((t) => t.task_id === taskId);
  const branchName = (taskEntry && taskEntry.branch) || `swarm/${taskId}`;
  const wtRel = (taskEntry && taskEntry.worktree_path) || `.swarm/worktrees/${taskId}`;
  const wtAbs = path.resolve(paths.root, wtRel);

  if (runGit(["show-ref", "--verify", "--quiet", `refs/heads/${branchName}`], paths.root).status !== 0) {
    throw new Error(`Worktree branch does not exist: ${branchName}`);
  }

  if (fs.existsSync(wtAbs)) {
    const wtStatus = runGit(["-C", wtAbs, "status", "--porcelain"], paths.root);
    if (wtStatus.status !== 0) {
      throw new Error(`Failed to inspect worktree status at ${wtRel}`);
    }
    if (wtStatus.stdout.trim().length > 0) {
      throw new Error(`Worktree for "${taskId}" has uncommitted changes. Commit or clean before merging.`);
    }
  }

  const headRes = runGit(["rev-parse", "--abbrev-ref", "HEAD"], paths.root);
  const currentBranch = headRes.status === 0 ? headRes.stdout.trim() : "HEAD";
  const targetBranch = typeof flags.into === "string" ? flags.into.trim() : currentBranch;

  // Dry-run conflict check via git merge-tree --write-tree (Git 2.38+)
  const dryRes = runGit(["merge-tree", "--write-tree", targetBranch, branchName], paths.root);
  if (dryRes.status !== 0) {
    const combined = `${dryRes.stdout || ""}\n${dryRes.stderr || ""}`;
    if (!/unknown option|unrecognized/i.test(combined)) {
      const conflictFiles = [];
      for (const line of combined.split(/\r?\n/)) {
        const m = line.match(/CONFLICT\s*\([^)]+\):\s*Merge conflict in\s+(.+)$/i);
        if (m) conflictFiles.push(m[1].trim());
      }
      const detail = conflictFiles.length > 0 ? ` Conflicting files: ${conflictFiles.join(", ")}` : "";
      throw new Error(`Merge conflict detected merging "${branchName}" into "${targetBranch}".${detail}`);
    }
  }

  if (typeof flags.into === "string" && targetBranch !== currentBranch) {
    const coRes = runGit(["checkout", targetBranch], paths.root);
    if (coRes.status !== 0) {
      throw new Error(`Failed to checkout target branch "${targetBranch}": ${(coRes.stderr || "").trim()}`);
    }
  }

  const mergeArgs = ["merge"];
  if (flags["no-ff"]) {
    mergeArgs.push("--no-ff");
  }
  mergeArgs.push("--no-edit", branchName);

  const mergeRes = runGit(mergeArgs, paths.root);
  if (mergeRes.status !== 0) {
    runGit(["merge", "--abort"], paths.root);
    throw new Error(
      `git merge failed for "${branchName}" into "${targetBranch}": ${(mergeRes.stderr || mergeRes.stdout || "").trim()}`
    );
  }

  if (taskEntry) {
    taskEntry.status = "merged";
    taskEntry.lease_status = "released";
    taskEntry.updated_at = new Date().toISOString();
    writeStateAtomic(paths, state);
  }

  console.log(
    JSON.stringify({
      ok: true,
      task_id: taskId,
      branch: branchName,
      merged_into: targetBranch,
      status: "merged",
    })
  );
  return 0;
}

function cmdWorktreeCleanup(flags) {
  const rawTaskId = typeof flags.task === "string" ? flags.task.trim() : "";
  if (!rawTaskId) throw new Error("--task is required");
  const taskId = validateTaskId(rawTaskId);

  const paths = getSwarmPaths(typeof flags.dir === "string" ? flags.dir : process.cwd());
  ensureGitRepo(paths.root);

  const state = fs.existsSync(paths.stateFile) ? readState(paths.stateFile) : null;
  const taskEntry = state ? state.tasks.find((t) => t.task_id === taskId) : null;
  const branchName = (taskEntry && taskEntry.branch) || `swarm/${taskId}`;
  const wtRel = (taskEntry && taskEntry.worktree_path) || `.swarm/worktrees/${taskId}`;
  const wtAbs = path.resolve(paths.root, wtRel);

  let worktreeRemoved = false;
  if (fs.existsSync(wtAbs)) {
    const rmRes = runGit(["worktree", "remove", "--force", wtRel], paths.root);
    if (rmRes.status !== 0) {
      throw new Error(`git worktree remove failed: ${(rmRes.stderr || rmRes.stdout || "").trim()}`);
    }
    worktreeRemoved = true;
  }
  runGit(["worktree", "prune"], paths.root);

  let branchDeleted = false;
  if (flags["delete-branch"]) {
    if (runGit(["show-ref", "--verify", "--quiet", `refs/heads/${branchName}`], paths.root).status === 0) {
      const delRes = runGit(["branch", "-D", branchName], paths.root);
      if (delRes.status !== 0) {
        throw new Error(`git branch -D failed: ${(delRes.stderr || delRes.stdout || "").trim()}`);
      }
      branchDeleted = true;
    }
  }

  if (state && taskEntry) {
    if (taskEntry.lease_status === "active") {
      taskEntry.lease_status = "released";
    }
    taskEntry.worktree_cleaned = true;
    if (branchDeleted) {
      taskEntry.branch_deleted = true;
    }
    taskEntry.updated_at = new Date().toISOString();
    writeStateAtomic(paths, state);
  }

  console.log(
    JSON.stringify({
      ok: true,
      task_id: taskId,
      worktree_removed: worktreeRemoved,
      branch_deleted: branchDeleted,
    })
  );
  return 0;
}

const HOOK_MARKER = "# managed-by: autonomous-software-company";

function buildSecretPatterns() {
  return [
    { label: "OpenAI-style secret prefix", regex: new RegExp("\\b" + ["sk", "-"].join("") + "[A-Za-z0-9_-]{3,}") },
    { label: "GitHub token prefix", regex: new RegExp("\\b" + ["ghp", "_"].join("") + "[A-Za-z0-9_-]{3,}") },
    { label: "Google API key prefix", regex: new RegExp("\\b" + ["AI", "za"].join("") + "[A-Za-z0-9_-]{3,}") },
    {
      label: "Private key block",
      regex: new RegExp(["-----BEGIN ", "(?:[A-Z0-9 ]+ )?", "PRIVATE KEY-----"].join("")),
    },
  ];
}

function isForbiddenSecretFilename(relPath) {
  const base = path.posix.basename(relPath);
  const lower = base.toLowerCase();
  if (lower === ".env" || (lower.startsWith(".env.") && lower !== ".env.example")) {
    return true;
  }
  if (/\.(pem|key)$/i.test(lower)) {
    return true;
  }
  if (["credentials.json", "serviceaccountkey.json", "tokens.json", "auth.json"].includes(lower)) {
    return true;
  }
  return false;
}

function resolveStateFileForRepo(paths, repoRoot) {
  if (fs.existsSync(paths.stateFile)) {
    return paths.stateFile;
  }
  const commonDirRes = runGit(["rev-parse", "--git-common-dir"], repoRoot);
  if (commonDirRes.status === 0) {
    const rawCommon = commonDirRes.stdout.trim();
    const absCommon = path.isAbsolute(rawCommon) ? rawCommon : path.resolve(repoRoot, rawCommon);
    const sharedState = path.join(path.dirname(absCommon), ".swarm", "state.json");
    if (fs.existsSync(sharedState)) {
      return sharedState;
    }
  }
  return null;
}

function cmdLockVerifyStaged(flags) {
  const paths = getSwarmPaths(typeof flags.dir === "string" ? flags.dir : process.cwd());
  const repoRoot = ensureGitRepo(paths.root);

  const stagedRes = runGit(["diff", "--cached", "--name-status", "-z"], repoRoot);
  if (stagedRes.status !== 0) {
    throw new Error(`git diff --cached failed: ${(stagedRes.stderr || stagedRes.stdout || "").trim()}`);
  }

  const tokens = (stagedRes.stdout || "").split("\0");
  const stagedEntries = [];
  for (let i = 0; i < tokens.length; ) {
    const statusToken = tokens[i++];
    if (!statusToken) break;
    const code = statusToken[0];
    if (code === "R" || code === "C") {
      const oldPath = tokens[i++];
      const newPath = tokens[i++];
      if (newPath) {
        stagedEntries.push({
          status: code,
          path: normalizeRelativePath(newPath),
          oldPath: oldPath ? normalizeRelativePath(oldPath) : null,
        });
      }
    } else {
      const filePath = tokens[i++];
      if (filePath) {
        stagedEntries.push({
          status: code,
          path: normalizeRelativePath(filePath),
          oldPath: null,
        });
      }
    }
  }

  const effectiveTaskId =
    (typeof flags.task === "string" && flags.task.trim()) ||
    (process.env.SWARM_TASK_ID ? process.env.SWARM_TASK_ID.trim() : "");

  if (stagedEntries.length === 0) {
    console.log(JSON.stringify({ ok: true, checked_files: 0, task_id: effectiveTaskId || null }));
    return 0;
  }

  const failures = [];
  const secretPatterns = buildSecretPatterns();

  // 1. Secret-Leak Guard (filename + added diff lines)
  for (const entry of stagedEntries) {
    if (entry.status === "D") continue;

    if (isForbiddenSecretFilename(entry.path)) {
      failures.push(`Secret-Leak Guard: forbidden secret filename staged: "${entry.path}"`);
      continue;
    }

    const diffRes = runGit(["diff", "--cached", "--unified=0", "--", entry.path], repoRoot);
    if (diffRes.status === 0 && diffRes.stdout) {
      const lines = diffRes.stdout.split(/\r?\n/);
      for (const line of lines) {
        if (!line.startsWith("+") || line.startsWith("+++ ")) continue;
        const addedText = line.slice(1);
        for (const pat of secretPatterns) {
          if (pat.regex.test(addedText)) {
            failures.push(`Secret-Leak Guard (${pat.label}): detected secret token in staged diff of "${entry.path}"`);
            break;
          }
        }
      }
    }
  }

  // 2. Lease Ownership Guard
  const stateFile = resolveStateFileForRepo(paths, repoRoot);
  const allowOutside = Boolean(flags["allow-untracked-outside-swarm"]);

  if (stateFile) {
    const state = readState(stateFile);
    const activeTasks = state.tasks.filter((t) => t.lease_status === "active");

    if (effectiveTaskId) {
      const ownTask = activeTasks.find((t) => t.task_id === effectiveTaskId);
      if (!ownTask) {
        failures.push(
          `Lease Ownership Guard: task "${effectiveTaskId}" does not hold an active lease in ${stateFile}`
        );
      } else {
        const ownFiles = new Set((ownTask.owned_files || []).map(normalizeRelativePath));
        for (const entry of stagedEntries) {
          for (const other of activeTasks) {
            if (other.task_id === effectiveTaskId) continue;
            const otherFiles = (other.owned_files || []).map(normalizeRelativePath);
            if (otherFiles.includes(entry.path)) {
              failures.push(
                `Lease Ownership Guard: "${entry.path}" is locked by active task "${other.task_id}" (owner: ${other.owner})`
              );
            }
          }
          if (!allowOutside && !entry.path.startsWith(".swarm/") && !ownFiles.has(entry.path)) {
            failures.push(
              `Lease Ownership Guard: "${entry.path}" is outside task "${effectiveTaskId}" owned_files ([${[...ownFiles].join(", ")}]). Pass --allow-untracked-outside-swarm to override.`
            );
          }
        }
      }
    } else if (activeTasks.length > 0) {
      for (const entry of stagedEntries) {
        if (entry.path.startsWith(".swarm/")) continue;
        for (const task of activeTasks) {
          const taskFiles = (task.owned_files || []).map(normalizeRelativePath);
          if (taskFiles.includes(entry.path)) {
            failures.push(
              `Lease Ownership Guard: "${entry.path}" is locked by active task "${task.task_id}" (owner: ${task.owner}). Pass --task ${task.task_id} (or set SWARM_TASK_ID=${task.task_id}) or release the lease first.`
            );
          }
        }
      }
    }
  } else if (effectiveTaskId) {
    failures.push(`Lease Ownership Guard: --task "${effectiveTaskId}" specified but .swarm/state.json does not exist.`);
  }

  // 3. Audit Report Guard
  const repoVerifier = path.join(repoRoot, "scripts", "verify-report.cjs");
  const fallbackVerifier = path.join(__dirname, "verify-report.cjs");
  const verifierScript = fs.existsSync(repoVerifier) ? repoVerifier : fallbackVerifier;

  for (const entry of stagedEntries) {
    if (entry.status === "D") continue;
    const base = path.posix.basename(entry.path).toLowerCase();
    if (/audit-report.*\.md$/i.test(base)) {
      const absReport = path.join(repoRoot, entry.path);
      if (!fs.existsSync(verifierScript)) {
        failures.push(`Audit Report Guard: verifier script missing (${verifierScript}) for "${entry.path}"`);
        continue;
      }
      const verifyRes = spawnSync(process.execPath, [verifierScript, absReport, repoRoot], {
        cwd: repoRoot,
        encoding: "utf8",
      });
      if (verifyRes.status !== 0) {
        const msg = (verifyRes.stderr || verifyRes.stdout || "verification failed").trim();
        failures.push(`Audit Report Guard failed for "${entry.path}": ${msg}`);
      }
    }
  }

  if (failures.length > 0) {
    for (const msg of failures) {
      console.error(`ERROR: ${msg}`);
    }
    return 1;
  }

  console.log(
    JSON.stringify({
      ok: true,
      checked_files: stagedEntries.length,
      task_id: effectiveTaskId || null,
    })
  );
  return 0;
}

function resolveGitHooksTarget(rawDir) {
  const startDir = path.resolve(rawDir || process.cwd());
  const repoRoot = ensureGitRepo(startDir);
  const res = runGit(["rev-parse", "--git-path", "hooks"], repoRoot);
  if (res.status !== 0) {
    throw new Error(`Failed to resolve git hooks directory: ${(res.stderr || "").trim()}`);
  }
  const rawHooksPath = res.stdout.trim();
  const hooksDir = path.isAbsolute(rawHooksPath) ? rawHooksPath : path.resolve(repoRoot, rawHooksPath);
  return { repoRoot, hooksDir, hookPath: path.join(hooksDir, "pre-commit") };
}

function cmdHooksInstall(flags) {
  const { repoRoot, hooksDir, hookPath } = resolveGitHooksTarget(typeof flags.dir === "string" ? flags.dir : process.cwd());
  const force = Boolean(flags.force);

  if (fs.existsSync(hookPath)) {
    const existing = fs.readFileSync(hookPath, "utf8");
    if (!existing.includes(HOOK_MARKER) && !force) {
      throw new Error(
        `Existing non-swarm pre-commit hook found at "${hookPath}". Refusing to overwrite without --force.`
      );
    }
  }

  fs.mkdirSync(hooksDir, { recursive: true });
  const hookScript = [
    "#!/usr/bin/env bash",
    HOOK_MARKER,
    "set -euo pipefail",
    "",
    'if [ "${SWARM_SKIP_HOOKS:-0}" = "1" ]; then',
    "  exit 0",
    "fi",
    "",
    "if ! command -v node >/dev/null 2>&1; then",
    "  exit 0",
    "fi",
    "",
    'if [ -f "scripts/swarm-cli.cjs" ]; then',
    "  node scripts/swarm-cli.cjs lock verify-staged",
    'elif [ -f ".swarm-config/scripts/swarm-cli.cjs" ]; then',
    "  node .swarm-config/scripts/swarm-cli.cjs lock verify-staged",
    "fi",
    "",
  ].join("\n");

  fs.writeFileSync(hookPath, hookScript, "utf8");
  fs.chmodSync(hookPath, 0o755);

  console.log(
    JSON.stringify({
      ok: true,
      installed: true,
      repo_root: repoRoot,
      hook_path: hookPath,
      forced: force,
    })
  );
  return 0;
}

function cmdHooksUninstall(flags) {
  const { repoRoot, hookPath } = resolveGitHooksTarget(typeof flags.dir === "string" ? flags.dir : process.cwd());

  if (!fs.existsSync(hookPath)) {
    console.log(
      JSON.stringify({
        ok: true,
        uninstalled: false,
        reason: "not_installed",
        repo_root: repoRoot,
        hook_path: hookPath,
      })
    );
    return 0;
  }

  const existing = fs.readFileSync(hookPath, "utf8");
  if (!existing.includes(HOOK_MARKER)) {
    throw new Error(
      `Refusing to remove pre-commit hook at "${hookPath}": missing "${HOOK_MARKER}" marker.`
    );
  }

  fs.unlinkSync(hookPath);
  console.log(
    JSON.stringify({
      ok: true,
      uninstalled: true,
      repo_root: repoRoot,
      hook_path: hookPath,
    })
  );
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
      if (sub === "verify-staged") return cmdLockVerifyStaged(flags);
      throw new Error(`Unknown lock subcommand "${sub}". Use acquire, check, release, or verify-staged.`);
    }
    if (cmd === "hooks") {
      const sub = args[1];
      const flags = parseFlags(args.slice(2));
      if (sub === "install") return cmdHooksInstall(flags);
      if (sub === "uninstall") return cmdHooksUninstall(flags);
      throw new Error(`Unknown hooks subcommand "${sub}". Use install or uninstall.`);
    }
    if (cmd === "worktree") {
      const sub = args[1];
      const flags = parseFlags(args.slice(2));
      if (sub === "create") return cmdWorktreeCreate(flags);
      if (sub === "list") return cmdWorktreeList(flags);
      if (sub === "merge") return cmdWorktreeMerge(flags);
      if (sub === "cleanup") return cmdWorktreeCleanup(flags);
      throw new Error(`Unknown worktree subcommand "${sub}". Use create, list, merge, or cleanup.`);
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
  validateTaskId,
  main,
};

if (require.main === module) {
  process.exit(main(process.argv));
}
