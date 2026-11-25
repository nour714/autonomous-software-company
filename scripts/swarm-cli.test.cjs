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

function initTempGitRepo(t) {
  const tmpDir = makeTempProject();
  t.after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

  assert.equal(spawnSync("git", ["init", "-b", "main"], { cwd: tmpDir, encoding: "utf8" }).status, 0);
  assert.equal(spawnSync("git", ["config", "user.email", "test@example.com"], { cwd: tmpDir }).status, 0);
  assert.equal(spawnSync("git", ["config", "user.name", "Swarm Test"], { cwd: tmpDir }).status, 0);

  fs.writeFileSync(path.join(tmpDir, "app.txt"), "base line\n", "utf8");
  fs.writeFileSync(path.join(tmpDir, ".gitignore"), ".swarm/\n", "utf8");
  assert.equal(spawnSync("git", ["add", "app.txt", ".gitignore"], { cwd: tmpDir }).status, 0);
  assert.equal(spawnSync("git", ["commit", "-m", "initial commit"], { cwd: tmpDir }).status, 0);

  assert.equal(runCli(["init", "--dir", tmpDir]).status, 0);
  return tmpDir;
}

test("worktree create, list, isolated commit, clean merge, and cleanup lifecycle", (t) => {
  const tmpDir = initTempGitRepo(t);

  // Reject unsafe task ID
  const badId = runCli(["worktree", "create", "--dir", tmpDir, "--task", "../evil", "--owner", "backend-dev"]);
  assert.equal(badId.status, 1);

  // Create isolated worktree
  const created = runCli([
    "worktree",
    "create",
    "--dir",
    tmpDir,
    "--task",
    "TASK-WT-1",
    "--owner",
    "backend-dev",
  ]);
  assert.equal(created.status, 0, created.stderr);
  const createdJson = JSON.parse(created.stdout.trim());
  assert.equal(createdJson.branch, "swarm/TASK-WT-1");
  assert.equal(createdJson.worktree_path, ".swarm/worktrees/TASK-WT-1");

  const wtAbs = path.join(tmpDir, ".swarm", "worktrees", "TASK-WT-1");
  assert.equal(fs.existsSync(wtAbs), true);

  // Duplicate create rejected
  const dup = runCli(["worktree", "create", "--dir", tmpDir, "--task", "TASK-WT-1", "--owner", "backend-dev"]);
  assert.equal(dup.status, 1);

  // Dirty file inside worktree shows dirty in list and blocks merge
  fs.writeFileSync(path.join(wtAbs, "feature.txt"), "wip\n", "utf8");
  const listDirty = runCli(["worktree", "list", "--dir", tmpDir, "--json"]);
  assert.equal(listDirty.status, 0, listDirty.stderr);
  const listDirtyJson = JSON.parse(listDirty.stdout.trim());
  assert.equal(listDirtyJson.worktrees.length, 1);
  assert.equal(listDirtyJson.worktrees[0].status, "dirty");

  const dirtyMerge = runCli(["worktree", "merge", "--dir", tmpDir, "--task", "TASK-WT-1"]);
  assert.equal(dirtyMerge.status, 1);
  assert.match(dirtyMerge.stderr, /uncommitted changes/);

  // Commit inside isolated worktree -> list shows clean -> merge succeeds
  assert.equal(spawnSync("git", ["add", "feature.txt"], { cwd: wtAbs }).status, 0);
  assert.equal(spawnSync("git", ["commit", "-m", "feat: add feature"], { cwd: wtAbs }).status, 0);

  const listClean = runCli(["worktree", "list", "--dir", tmpDir, "--json"]);
  assert.equal(JSON.parse(listClean.stdout.trim()).worktrees[0].status, "clean");

  const merged = runCli(["worktree", "merge", "--dir", tmpDir, "--task", "TASK-WT-1", "--no-ff"]);
  assert.equal(merged.status, 0, merged.stderr);
  const mergedJson = JSON.parse(merged.stdout.trim());
  assert.equal(mergedJson.status, "merged");
  assert.equal(fs.existsSync(path.join(tmpDir, "feature.txt")), true);

  const stateAfterMerge = JSON.parse(fs.readFileSync(path.join(tmpDir, ".swarm", "state.json"), "utf8"));
  assert.equal(stateAfterMerge.tasks.find((x) => x.task_id === "TASK-WT-1").status, "merged");

  // Cleanup removes worktree directory and branch
  const cleaned = runCli(["worktree", "cleanup", "--dir", tmpDir, "--task", "TASK-WT-1", "--delete-branch"]);
  assert.equal(cleaned.status, 0, cleaned.stderr);
  const cleanedJson = JSON.parse(cleaned.stdout.trim());
  assert.equal(cleanedJson.worktree_removed, true);
  assert.equal(cleanedJson.branch_deleted, true);
  assert.equal(fs.existsSync(wtAbs), false);

  const branchCheck = spawnSync("git", ["show-ref", "--verify", "--quiet", "refs/heads/swarm/TASK-WT-1"], {
    cwd: tmpDir,
  });
  assert.notEqual(branchCheck.status, 0);
});

test("worktree merge detects conflicts cleanly without leaving repo conflicted", (t) => {
  const tmpDir = initTempGitRepo(t);

  assert.equal(
    runCli(["worktree", "create", "--dir", tmpDir, "--task", "TASK-CONF", "--owner", "frontend-dev"]).status,
    0
  );
  const wtAbs = path.join(tmpDir, ".swarm", "worktrees", "TASK-CONF");

  // Competing edit on app.txt in main
  fs.writeFileSync(path.join(tmpDir, "app.txt"), "main branch edit\n", "utf8");
  assert.equal(spawnSync("git", ["add", "app.txt"], { cwd: tmpDir }).status, 0);
  assert.equal(spawnSync("git", ["commit", "-m", "main edit"], { cwd: tmpDir }).status, 0);

  // Competing edit on app.txt in worktree
  fs.writeFileSync(path.join(wtAbs, "app.txt"), "worktree branch edit\n", "utf8");
  assert.equal(spawnSync("git", ["add", "app.txt"], { cwd: wtAbs }).status, 0);
  assert.equal(spawnSync("git", ["commit", "-m", "worktree edit"], { cwd: wtAbs }).status, 0);

  const mergeConflict = runCli(["worktree", "merge", "--dir", tmpDir, "--task", "TASK-CONF"]);
  assert.equal(mergeConflict.status, 1);
  assert.match(mergeConflict.stderr, /Merge conflict detected/);
  assert.match(mergeConflict.stderr, /app\.txt/);

  // Main repo working tree remains completely clean (no MERGE_HEAD left behind)
  const mainStatus = spawnSync("git", ["status", "--porcelain"], { cwd: tmpDir, encoding: "utf8" });
  assert.equal(mainStatus.stdout.trim(), "");

  assert.equal(
    runCli(["worktree", "cleanup", "--dir", tmpDir, "--task", "TASK-CONF", "--delete-branch"]).status,
    0
  );
});

test("hooks install and uninstall manage pre-commit hook and protect foreign hooks", (t) => {
  const tmpDir = initTempGitRepo(t);
  const hookPath = path.join(tmpDir, ".git", "hooks", "pre-commit");

  // Existing foreign hook is protected unless --force is supplied
  fs.mkdirSync(path.dirname(hookPath), { recursive: true });
  fs.writeFileSync(hookPath, "#!/usr/bin/env bash\necho custom-hook\n", "utf8");

  const blockedInstall = runCli(["hooks", "install", "--dir", tmpDir]);
  assert.equal(blockedInstall.status, 1);
  assert.match(blockedInstall.stderr, /Refusing to overwrite without --force/);

  const blockedUninstall = runCli(["hooks", "uninstall", "--dir", tmpDir]);
  assert.equal(blockedUninstall.status, 1);
  assert.match(blockedUninstall.stderr, /missing "# managed-by: autonomous-software-company" marker/);

  // Install with --force installs managed hook with LF and marker
  const forcedInstall = runCli(["hooks", "install", "--dir", tmpDir, "--force"]);
  assert.equal(forcedInstall.status, 0, forcedInstall.stderr);
  const installedJson = JSON.parse(forcedInstall.stdout.trim());
  assert.equal(installedJson.installed, true);
  assert.equal(installedJson.forced, true);

  const hookBody = fs.readFileSync(hookPath, "utf8");
  assert.match(hookBody, /# managed-by: autonomous-software-company/);
  assert.match(hookBody, /lock verify-staged/);
  assert.match(hookBody, /SWARM_SKIP_HOOKS/);
  if (process.platform !== "win32") {
    assert.ok((fs.statSync(hookPath).mode & 0o111) !== 0);
  }

  // Uninstall removes managed hook and is idempotent afterward
  const uninstalled = runCli(["hooks", "uninstall", "--dir", tmpDir]);
  assert.equal(uninstalled.status, 0, uninstalled.stderr);
  assert.equal(JSON.parse(uninstalled.stdout.trim()).uninstalled, true);
  assert.equal(fs.existsSync(hookPath), false);

  const uninstallAgain = runCli(["hooks", "uninstall", "--dir", tmpDir]);
  assert.equal(uninstallAgain.status, 0, uninstallAgain.stderr);
  assert.equal(JSON.parse(uninstallAgain.stdout.trim()).uninstalled, false);
});

test("lock verify-staged blocks secret filenames and secret tokens in staged diffs", (t) => {
  const tmpDir = initTempGitRepo(t);

  // Forbidden secret filename (.env)
  fs.writeFileSync(path.join(tmpDir, ".env"), "PORT=3000\n", "utf8");
  assert.equal(spawnSync("git", ["add", "-f", ".env"], { cwd: tmpDir }).status, 0);
  const envBlocked = runCli(["lock", "verify-staged", "--dir", tmpDir]);
  assert.equal(envBlocked.status, 1);
  assert.match(envBlocked.stderr, /Secret-Leak Guard.*forbidden secret filename/);

  // .env.example is allowed
  assert.equal(spawnSync("git", ["reset", "HEAD", ".env"], { cwd: tmpDir }).status, 0);
  fs.writeFileSync(path.join(tmpDir, ".env.example"), "PORT=3000\n", "utf8");
  assert.equal(spawnSync("git", ["add", ".env.example"], { cwd: tmpDir }).status, 0);
  const exampleOk = runCli(["lock", "verify-staged", "--dir", tmpDir]);
  assert.equal(exampleOk.status, 0, exampleOk.stderr);

  // Staged diff containing secret prefix token is blocked
  const secretToken = ["sk", "-live12345678"].join("");
  fs.writeFileSync(path.join(tmpDir, "config.js"), `module.exports = { apiKey: "${secretToken}" };\n`, "utf8");
  assert.equal(spawnSync("git", ["add", "config.js"], { cwd: tmpDir }).status, 0);
  const tokenBlocked = runCli(["lock", "verify-staged", "--dir", tmpDir]);
  assert.equal(tokenBlocked.status, 1);
  assert.match(tokenBlocked.stderr, /Secret-Leak Guard/);
});

test("lock verify-staged enforces active task lease ownership", (t) => {
  const tmpDir = initTempGitRepo(t);

  assert.equal(
    runCli([
      "lock",
      "acquire",
      "--dir",
      tmpDir,
      "--task",
      "TASK-OWN-1",
      "--owner",
      "backend-dev",
      "--files",
      "src/a.js",
    ]).status,
    0
  );
  assert.equal(
    runCli([
      "lock",
      "acquire",
      "--dir",
      tmpDir,
      "--task",
      "TASK-OWN-2",
      "--owner",
      "frontend-dev",
      "--files",
      "src/b.js",
    ]).status,
    0
  );

  fs.mkdirSync(path.join(tmpDir, "src"), { recursive: true });
  fs.writeFileSync(path.join(tmpDir, "src", "a.js"), "exports.a = 1;\n", "utf8");
  fs.writeFileSync(path.join(tmpDir, "src", "b.js"), "exports.b = 2;\n", "utf8");
  fs.writeFileSync(path.join(tmpDir, "src", "extra.js"), "exports.extra = 3;\n", "utf8");

  // Blocking a file leased by a different active task
  assert.equal(spawnSync("git", ["add", "src/b.js"], { cwd: tmpDir }).status, 0);
  const otherTaskBlocked = runCli(["lock", "verify-staged", "--dir", tmpDir, "--task", "TASK-OWN-1"]);
  assert.equal(otherTaskBlocked.status, 1);
  assert.match(otherTaskBlocked.stderr, /locked by active task "TASK-OWN-2"/);

  // Blocking file outside owned_files unless --allow-untracked-outside-swarm is passed
  assert.equal(spawnSync("git", ["reset", "HEAD", "src/b.js"], { cwd: tmpDir }).status, 0);
  assert.equal(spawnSync("git", ["add", "src/extra.js"], { cwd: tmpDir }).status, 0);
  const outsideBlocked = runCli(["lock", "verify-staged", "--dir", tmpDir, "--task", "TASK-OWN-1"]);
  assert.equal(outsideBlocked.status, 1);
  assert.match(outsideBlocked.stderr, /outside task "TASK-OWN-1" owned_files/);

  const outsideAllowed = runCli([
    "lock",
    "verify-staged",
    "--dir",
    tmpDir,
    "--task",
    "TASK-OWN-1",
    "--allow-untracked-outside-swarm",
  ]);
  assert.equal(outsideAllowed.status, 0, outsideAllowed.stderr);

  // Allowing a staged file owned by active --task (and blocking anonymous commit on locked file)
  assert.equal(spawnSync("git", ["reset", "HEAD", "src/extra.js"], { cwd: tmpDir }).status, 0);
  assert.equal(spawnSync("git", ["add", "src/a.js"], { cwd: tmpDir }).status, 0);

  const anonBlocked = runCli(["lock", "verify-staged", "--dir", tmpDir]);
  assert.equal(anonBlocked.status, 1);
  assert.match(anonBlocked.stderr, /locked by active task "TASK-OWN-1"/);

  const ownAllowed = runCli(["lock", "verify-staged", "--dir", tmpDir, "--task", "TASK-OWN-1"]);
  assert.equal(ownAllowed.status, 0, ownAllowed.stderr);
  assert.equal(JSON.parse(ownAllowed.stdout.trim()).task_id, "TASK-OWN-1");
});

test("lock verify-staged validates staged audit-report markdown files", (t) => {
  const tmpDir = initTempGitRepo(t);
  fs.mkdirSync(path.join(tmpDir, "src"), { recursive: true });
  fs.writeFileSync(path.join(tmpDir, "src", "service.js"), "line1\nline2\nline3\n", "utf8");
  assert.equal(spawnSync("git", ["add", "src/service.js"], { cwd: tmpDir }).status, 0);

  // Invalid audit report (missing fields / bad line reference)
  const reportPath = path.join(tmpDir, "final-audit-report.md");
  fs.writeFileSync(
    reportPath,
    [
      "# Audit Report",
      "",
      "### Finding 1",
      "- **id**: F-1",
      "- **severity**: P1",
      "- **file:line**: [src/missing.js](src/missing.js#L1)",
      "",
    ].join("\n"),
    "utf8"
  );
  assert.equal(spawnSync("git", ["add", "final-audit-report.md"], { cwd: tmpDir }).status, 0);
  const badReport = runCli(["lock", "verify-staged", "--dir", tmpDir]);
  assert.equal(badReport.status, 1);
  assert.match(badReport.stderr, /Audit Report Guard failed/);

  // Valid audit report passes verification
  fs.writeFileSync(
    reportPath,
    [
      "# Audit Report",
      "",
      "### F-1: Validated Finding",
      "- **id**: F-1",
      "- **severity**: P2",
      "- **file:line**: [src/service.js](src/service.js#L2)",
      "- **evidence**: `node --test` reproduced missing check on line 2",
      "- **confidence**: verified",
      "- **intent_check**: bug",
      "- **proposed_fix**: Add guard clause at line 2",
      "- **fix_tier**: 1",
      "- **regression_test**: Added unit test asserting guard throws on invalid input",
      "",
    ].join("\n"),
    "utf8"
  );
  assert.equal(spawnSync("git", ["add", "final-audit-report.md"], { cwd: tmpDir }).status, 0);
  const goodReport = runCli(["lock", "verify-staged", "--dir", tmpDir]);
  assert.equal(goodReport.status, 0, goodReport.stderr);
  assert.equal(JSON.parse(goodReport.stdout.trim()).ok, true);
});
