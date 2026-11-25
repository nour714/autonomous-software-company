'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const EXPORT_HOST = path.join(ROOT_DIR, 'scripts', 'export-host.cjs');
const INSTALL_SH = path.join(ROOT_DIR, 'install.sh');

function resolveBash() {
  if (process.platform === 'win32') {
    const gitBash = 'C:\\Program Files\\Git\\bin\\bash.exe';
    if (fs.existsSync(gitBash)) {
      return gitBash;
    }
  }
  return 'bash';
}

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function runExport(args) {
  const stdout = execFileSync(process.execPath, [EXPORT_HOST, ...args], {
    cwd: ROOT_DIR,
    encoding: 'utf8',
  });
  return JSON.parse(stdout);
}

test('export-host --dry-run writes zero files for all hosts', () => {
  const tmpDir = makeTempDir('swarm-export-dry-');
  try {
    const res = runExport(['--host', 'all', '--target', tmpDir, '--dry-run']);
    assert.equal(res.ok, true);
    assert.equal(res.dry_run, true);
    assert.equal(res.hosts.length, 4);
    assert.equal(fs.readdirSync(tmpDir).length, 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('export-host exports and verifies antigravity layout', () => {
  const tmpDir = makeTempDir('swarm-export-antigravity-');
  try {
    const exportRes = runExport(['--host', 'antigravity', '--target', tmpDir]);
    assert.equal(exportRes.ok, true);
    assert.equal(fs.existsSync(path.join(tmpDir, 'GEMINI.md')), true);
    assert.equal(fs.existsSync(path.join(tmpDir, 'skills', 'audit-reporting', 'SKILL.md')), true);
    assert.equal(fs.existsSync(path.join(tmpDir, 'rules', 'swarm-orchestration.md')), true);
    assert.equal(fs.existsSync(path.join(tmpDir, 'agents', 'backend-dev.md')), true);
    assert.equal(fs.existsSync(path.join(tmpDir, 'config', 'swarm.config.yaml')), true);
    assert.equal(fs.existsSync(path.join(tmpDir, 'scripts', 'swarm-cli.cjs')), true);

    const verifyRes = runExport(['--host', 'antigravity', '--target', tmpDir, '--verify']);
    assert.equal(verifyRes.ok, true);
    assert.equal(verifyRes.verified, true);
    assert.ok(verifyRes.exported[0].verified_files >= 17);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('export-host exports and verifies gemini-cli layout', () => {
  const tmpDir = makeTempDir('swarm-export-gemini-');
  try {
    const exportRes = runExport(['--host', 'gemini-cli', '--target', tmpDir]);
    assert.equal(exportRes.ok, true);
    assert.equal(fs.existsSync(path.join(tmpDir, 'GEMINI.md')), true);
    assert.equal(fs.existsSync(path.join(tmpDir, 'skills', 'audit-reporting', 'SKILL.md')), true);
    assert.equal(fs.existsSync(path.join(tmpDir, 'rules', 'references', 'runtime-state.md')), true);
    assert.equal(fs.existsSync(path.join(tmpDir, 'agents', 'qa-tester.md')), true);
    assert.equal(fs.existsSync(path.join(tmpDir, 'config', 'swarm.config.yaml')), true);

    const verifyRes = runExport(['--host', 'gemini-cli', '--target', tmpDir, '--verify']);
    assert.equal(verifyRes.ok, true);
    assert.equal(verifyRes.verified, true);
    assert.ok(verifyRes.exported[0].verified_files >= 17);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('export-host exports and verifies claude-code layout', () => {
  const tmpDir = makeTempDir('swarm-export-claude-');
  try {
    const exportRes = runExport(['--host', 'claude-code', '--target', tmpDir]);
    assert.equal(exportRes.ok, true);
    assert.equal(fs.existsSync(path.join(tmpDir, 'CLAUDE.md')), true);
    assert.equal(fs.existsSync(path.join(tmpDir, '.claude', 'agents', 'backend-dev.md')), true);
    assert.equal(fs.existsSync(path.join(tmpDir, '.claude', 'skills', 'backend-architect', 'SKILL.md')), true);
    assert.equal(fs.existsSync(path.join(tmpDir, '.swarm-config', 'config', 'swarm.config.yaml')), true);
    assert.equal(fs.existsSync(path.join(tmpDir, '.swarm-config', 'scripts', 'swarm-cli.cjs')), true);

    const claudeMd = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf8');
    assert.match(claudeMd, /Claude Code/);

    const verifyRes = runExport(['--host', 'claude-code', '--target', tmpDir, '--verify']);
    assert.equal(verifyRes.ok, true);
    assert.equal(verifyRes.verified, true);
    assert.ok(verifyRes.exported[0].verified_files >= 16);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('export-host exports and verifies cursor layout with .mdc frontmatter', () => {
  const tmpDir = makeTempDir('swarm-export-cursor-');
  try {
    const exportRes = runExport(['--host', 'cursor', '--target', tmpDir]);
    assert.equal(exportRes.ok, true);
    const mainMdc = path.join(tmpDir, '.cursor', 'rules', 'swarm-orchestration.mdc');
    const agentMdc = path.join(tmpDir, '.cursor', 'rules', 'agent-backend-dev.mdc');
    assert.equal(fs.existsSync(mainMdc), true);
    assert.equal(fs.existsSync(agentMdc), true);
    assert.equal(fs.existsSync(path.join(tmpDir, '.cursor', 'swarm', 'config', 'swarm.config.yaml')), true);
    assert.equal(fs.existsSync(path.join(tmpDir, '.cursor', 'swarm', 'scripts', 'swarm-cli.cjs')), true);

    const mainContent = fs.readFileSync(mainMdc, 'utf8');
    assert.match(mainContent, /^---\r?\ndescription:/);
    assert.match(mainContent, /alwaysApply: true/);

    const agentContent = fs.readFileSync(agentMdc, 'utf8');
    assert.match(agentContent, /^---\r?\ndescription:/);
    assert.match(agentContent, /alwaysApply: false/);

    const verifyRes = runExport(['--host', 'cursor', '--target', tmpDir, '--verify']);
    assert.equal(verifyRes.ok, true);
    assert.equal(verifyRes.verified, true);
    assert.ok(verifyRes.exported[0].verified_files >= 15);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('export-host --host all creates per-host subdirectories and verifies all', () => {
  const tmpDir = makeTempDir('swarm-export-all-');
  try {
    const exportRes = runExport(['--host', 'all', '--target', tmpDir]);
    assert.equal(exportRes.ok, true);
    for (const host of ['antigravity', 'gemini-cli', 'claude-code', 'cursor']) {
      assert.equal(fs.existsSync(path.join(tmpDir, host)), true, `missing host dir ${host}`);
    }
    const verifyRes = runExport(['--host', 'all', '--target', tmpDir, '--verify']);
    assert.equal(verifyRes.ok, true);
    assert.equal(verifyRes.verified, true);
    assert.equal(verifyRes.exported.length, 4);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('install.sh --host delegates non-antigravity targets cleanly', () => {
  const tmpDir = makeTempDir('swarm-install-host-');
  try {
    const bash = resolveBash();
    const env = {
      ...process.env,
      SWARM_SOURCE_DIR: ROOT_DIR,
      SWARM_TARGET_DIR: tmpDir,
    };
    execFileSync(bash, [INSTALL_SH, '--host', 'claude-code'], {
      cwd: ROOT_DIR,
      env,
      encoding: 'utf8',
    });
    assert.equal(fs.existsSync(path.join(tmpDir, 'CLAUDE.md')), true);
    assert.equal(fs.existsSync(path.join(tmpDir, '.claude', 'agents', 'backend-dev.md')), true);

    const verifyOut = execFileSync(bash, [INSTALL_SH, '--host=claude-code', '--verify'], {
      cwd: ROOT_DIR,
      env,
      encoding: 'utf8',
    });
    const verifyRes = JSON.parse(verifyOut);
    assert.equal(verifyRes.ok, true);
    assert.equal(verifyRes.verified, true);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
