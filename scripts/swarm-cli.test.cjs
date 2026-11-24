#!/usr/bin/env node
/**
 * scripts/swarm-cli.test.cjs
 * Zero-dependency unit tests for scripts/swarm-cli.cjs using node:test and node:assert/strict.
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const REPO_ROOT = path.resolve(__dirname, "..");
const CLI_PATH = path.join(__dirname, "swarm-cli.cjs");
const REPORT_SCRIPT_PATH = path.join(__dirname, "swarm-report.sh");

function makeTempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "swarm-cli-test-"));
}

function runCli(args, cwd) {
  return spawnSync(process.execPath, [CLI_PATH, ...args], {
    cwd: cwd || REPO_ROOT,
    encoding: "utf8",
  });
}

function resolveBashExecutable() {
  if (process.platform === "win32") {
    const gitBash = "C:\\Program Files\\Git\\bin\\bash.exe";
    if (fs.existsSync(gitBash)) {
      return gitBash;
    }
  }
  return "bash";
}

test("init creates .swarm artifacts and is idempotent", (t) => {
  const tmpDir = makeTempProject();
  t.after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

  const first = runCli(["init", "--dir", tmpDir]);
  assert.equal(first.status, 0, first.stderr);
  const firstJson = JSON.parse(first.stdout.trim());
  assert.equal(firstJson.ok, true);
  assert.equal(firstJson.created.length, 4);

  const statePath = path.join(tmpDir, ".swarm", "state.json");
  const contextPath = path.join(tmpDir, ".swarm", "project-context.md");
  const metricsPath = path.join(tmpDir, ".swarm", "metrics.jsonl");
  const followupsPath = path.join(tmpDir, ".swarm", "followups.md");

  assert.equal(fs.existsSync(statePath), true);
  assert.equal(fs.existsSync(contextPath), true);
  assert.equal(fs.existsSync(metricsPath), true);
  assert.equal(fs.existsSync(followupsPath), true);

  const initialState = JSON.parse(fs.readFileSync(statePath, "utf8"));
  assert.equal(initialState.schema_version, 1);
  assert.deepEqual(initialState.tasks, []);

  // Modify followups.md to prove second init does not overwrite existing files
  fs.appendFileSync(followupsPath, "- custom line\n", "utf8");
  const second = runCli(["init", "--dir", tmpDir]);
  assert.equal(second.status, 0, second.stderr);
  const secondJson = JSON.parse(second.stdout.trim());
  assert.deepEqual(secondJson.created, []);
  assert.match(fs.readFileSync(followupsPath, "utf8"), /custom line/);
});

test("lock acquire, conflict rejection, max-5-files rejection, check, release, and status", (t) => {
  const tmpDir = makeTempProject();
  t.after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

  assert.equal(runCli(["init", "--dir", tmpDir]).status, 0);

  // Reject > 5 files
  const tooMany = runCli([
    "lock",
    "acquire",
    "--dir",
    tmpDir,
    "--task",
    "TASK-001",
    "--owner",
    "backend-dev",
    "--files",
    "a.js,b.js,c.js,d.js,e.js,f.js",
  ]);
  assert.equal(tooMany.status, 1);
  assert.match(tooMany.stderr, /maximum allowed is 5/);

  // Reject traversal / absolute path
  const badPath = runCli([
    "lock",
    "acquire",
    "--dir",
    tmpDir,
    "--task",
    "TASK-001",
    "--owner",
    "backend-dev",
    "--files",
    "../secret.js",
  ]);
  assert.equal(badPath.status, 1);

  // Acquire valid lease
  const acq = runCli([
    "lock",
    "acquire",
    "--dir",
    tmpDir,
    "--task",
    "TASK-001",
    "--owner",
    "backend-dev",
    "--files",
    "src/api.js,src/db.js",
    "--mode",
    "standard",
    "--tier",
    "tier_1",
  ]);
  assert.equal(acq.status, 0, acq.stderr);

  // Conflict check for overlapping file from another task
  const conflict = runCli([
    "lock",
    "acquire",
    "--dir",
    tmpDir,
    "--task",
    "TASK-002",
    "--owner",
    "frontend-dev",
    "--files",
    "src/db.js,src/ui.js",
  ]);
  assert.equal(conflict.status, 1);
  assert.match(conflict.stderr, /task_id="?TASK-001"?/);
  assert.match(conflict.stderr, /owner="?backend-dev"?/);

  // lock check locked file
  const checkLocked = runCli(["lock", "check", "--dir", tmpDir, "--file", "./src/api.js"]);
  assert.equal(checkLocked.status, 0, checkLocked.stderr);
  const checkLockedJson = JSON.parse(checkLocked.stdout.trim());
  assert.equal(checkLockedJson.locked, true);
  assert.equal(checkLockedJson.task_id, "TASK-001");
  assert.equal(checkLockedJson.owner, "backend-dev");
  assert.equal(checkLockedJson.lease_status, "active");

  // lock check unlocked file
  const checkFree = runCli(["lock", "check", "--dir", tmpDir, "--file", "src/other.js"]);
  assert.equal(checkFree.status, 0);
  const checkFreeJson = JSON.parse(checkFree.stdout.trim());
  assert.equal(checkFreeJson.locked, false);

  // status table
  const statusOut = runCli(["status", "--dir", tmpDir]);
  assert.equal(statusOut.status, 0);
  assert.match(statusOut.stdout, /TASK-001/);
  assert.match(statusOut.stdout, /backend-dev/);

  // lock release
  const rel = runCli([
    "lock",
    "release",
    "--dir",
    tmpDir,
    "--task",
    "TASK-001",
    "--status",
    "completed",
  ]);
  assert.equal(rel.status, 0, rel.stderr);
  const relJson = JSON.parse(rel.stdout.trim());
  const relTask = relJson.task || relJson;
  assert.equal(relTask.lease_status, "released");
  assert.equal(relTask.status, "completed");

  // Previously locked file can now be acquired by TASK-002
  const acqAfterRelease = runCli([
    "lock",
    "acquire",
    "--dir",
    tmpDir,
    "--task",
    "TASK-002",
    "--owner",
    "frontend-dev",
    "--files",
    "src/db.js",
  ]);
  assert.equal(acqAfterRelease.status, 0, acqAfterRelease.stderr);
});

test("log-metric validates fields and produces swarm-report.sh-compatible JSONL", (t) => {
  const tmpDir = makeTempProject();
  t.after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

  assert.equal(runCli(["init", "--dir", tmpDir]).status, 0);

  // Reject invalid metric type
  const badType = runCli([
    "log-metric",
    "--dir",
    tmpDir,
    "--type",
    "invalid_type",
    "--task",
    "TASK-010",
    "--tier",
    "tier_1",
    "--status",
    "pass",
    "--duration-ms",
    "1000",
  ]);
  assert.equal(badType.status, 1);

  // Reject missing --agent for agent_run
  const missingAgent = runCli([
    "log-metric",
    "--dir",
    tmpDir,
    "--type",
    "agent_run",
    "--task",
    "TASK-010",
    "--tier",
    "tier_1",
    "--status",
    "pass",
    "--duration-ms",
    "1200",
  ]);
  assert.equal(missingAgent.status, 1);

  // Log valid agent_run, task_summary, and stall
  const r1 = runCli([
    "log-metric",
    "--dir",
    tmpDir,
    "--type",
    "agent_run",
    "--task",
    "TASK-010",
    "--agent",
    "backend-dev",
    "--tier",
    "tier_1",
    "--status",
    "pass",
    "--duration-ms",
    "2500",
    "--tests-passed",
    "4",
    "--tests-failed",
    "0",
  ]);
  assert.equal(r1.status, 0, r1.stderr);

  const r2 = runCli([
    "log-metric",
    "--dir",
    tmpDir,
    "--type",
    "task_summary",
    "--task",
    "TASK-010",
    "--tier",
    "tier_1",
    "--status",
    "pass",
    "--duration-ms",
    "12000",
    "--tests-passed",
    "4",
    "--tests-failed",
    "0",
  ]);
  assert.equal(r2.status, 0, r2.stderr);

  const r3 = runCli([
    "log-metric",
    "--dir",
    tmpDir,
    "--type",
    "stall",
    "--task",
    "TASK-011",
    "--agent",
    "frontend-dev",
    "--tier",
    "tier_1",
    "--status",
    "stalled",
    "--duration-ms",
    "190000",
  ]);
  assert.equal(r3.status, 0, r3.stderr);

  const metricsFile = path.join(tmpDir, ".swarm", "metrics.jsonl");
  const lines = fs.readFileSync(metricsFile, "utf8").trim().split(/\r?\n/);
  assert.equal(lines.length, 3);

  // Verify bash scripts/swarm-report.sh parses generated metrics cleanly
  const bashExe = resolveBashExecutable();
  const reportRes = spawnSync(
    bashExe,
    [REPORT_SCRIPT_PATH.replace(/\\/g, "/"), metricsFile.replace(/\\/g, "/")],
    { cwd: REPO_ROOT, encoding: "utf8" }
  );
  assert.equal(reportRes.status, 0, reportRes.stderr);
  assert.match(reportRes.stdout, /Total Records Processed: 3/);
  assert.match(reportRes.stdout, /Completed Tasks: 1 \/ 1/);
  assert.match(reportRes.stdout, /Stall Detections \/ Pings: 1/);
  assert.doesNotMatch(reportRes.stdout, /Skipped Invalid/);
});

test("check-stalls detects warn at 3m and escalate at 5m and exits with code 2", (t) => {
  const tmpDir = makeTempProject();
  t.after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

  assert.equal(runCli(["init", "--dir", tmpDir]).status, 0);
  assert.equal(
    runCli([
      "lock",
      "acquire",
      "--dir",
      tmpDir,
      "--task",
      "TASK-FRESH",
      "--owner",
      "qa-tester",
      "--files",
      "tests/a.test.js",
    ]).status,
    0
  );

  // Fresh task -> no stalls (exit 0)
  const freshCheck = runCli(["check-stalls", "--dir", tmpDir]);
  assert.equal(freshCheck.status, 0, freshCheck.stderr);
  assert.deepEqual(JSON.parse(freshCheck.stdout.trim()), { warn: [], escalate: [] });

  // Backdate updated_at in state.json for warn (3.5m) and escalate (6m)
  const statePath = path.join(tmpDir, ".swarm", "state.json");
  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  const now = Date.now();
  state.tasks.push(
    {
      task_id: "TASK-WARN",
      mode: "standard",
      tier: "tier_1",
      owner: "backend-dev",
      owned_files: ["server/a.js"],
      lease_status: "active",
      status: "in_progress",
      updated_at: new Date(now - 3.5 * 60000).toISOString(),
    },
    {
      task_id: "TASK-ESC",
      mode: "standard",
      tier: "tier_2",
      owner: "frontend-dev",
      owned_files: ["ui/b.js"],
      lease_status: "active",
      status: "in_progress",
      updated_at: new Date(now - 6 * 60000).toISOString(),
    }
  );
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), "utf8");

  const stallCheck = runCli(["check-stalls", "--dir", tmpDir, "--warn-min", "3", "--escalate-min", "5"]);
  assert.equal(stallCheck.status, 2);
  const stallJson = JSON.parse(stallCheck.stdout.trim());
  assert.equal(stallJson.warn.length, 1);
  assert.equal(stallJson.warn[0].task_id, "TASK-WARN");
  assert.equal(stallJson.escalate.length, 1);
  assert.equal(stallJson.escalate[0].task_id, "TASK-ESC");
});
