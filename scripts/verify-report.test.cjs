#!/usr/bin/env node

/**
 * scripts/verify-report.test.cjs
 * Automated test suite for verify-report.cjs using temporary fixtures.
 * Tests:
 * 1. Valid report passes (exit code 0).
 * 2. Missing referenced file fails (exit code 1).
 * 3. Referenced line beyond EOF fails (exit code 1).
 * 4. file:/// or absolute drive path link fails (exit code 1).
 * 5. Link text path != link target path fails (exit code 1).
 * 6. Finding lacking required fields fails (exit code 1).
 * 7. Inferred finding with P0/P1 without repro steps fails (exit code 1).
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const SCRIPT_PATH = path.join(__dirname, "verify-report.cjs");

function createTempFixture() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "verify-report-test-"));
  const srcDir = path.join(tmpDir, "src");
  fs.mkdirSync(srcDir, { recursive: true });

  // Create dummy source file with exactly 10 lines
  const dummyLines = [];
  for (let i = 1; i <= 10; i++) {
    dummyLines.push(`// Line ${i}: export const value${i} = ${i};`);
  }
  fs.writeFileSync(path.join(srcDir, "auth.ts"), dummyLines.join("\n"), "utf8");

  return tmpDir;
}

function runVerifier(reportPath, projectRoot) {
  return spawnSync(process.execPath, [SCRIPT_PATH, reportPath, projectRoot], {
    encoding: "utf8",
  });
}

let totalTests = 0;
let passedTests = 0;

function assertTest(name, result, expectedExitCode, expectedErrorSubstring) {
  totalTests++;
  const exitCodeMatches = result.status === expectedExitCode;
  const stderrOrStdout = (result.stderr || "") + (result.stdout || "");
  const errorMatches = !expectedErrorSubstring || stderrOrStdout.includes(expectedErrorSubstring);

  if (exitCodeMatches && errorMatches) {
    console.log(`[PASS] ${name}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${name}`);
    console.error(`  Expected status: ${expectedExitCode}, got: ${result.status}`);
    if (expectedErrorSubstring) {
      console.error(`  Expected output containing: "${expectedErrorSubstring}"`);
      console.error(`  Actual output:\n${stderrOrStdout}`);
    }
  }
}

function runAll() {
  console.log("============================================================");
  console.log("      VERIFY-REPORT TEST SUITE (FIXTURE VALIDATION)");
  console.log("============================================================");

  const fixtureRoot = createTempFixture();

  try {
    // -------------------------------------------------------------
    // Test 1: Valid report
    // -------------------------------------------------------------
    const validReportPath = path.join(fixtureRoot, "valid-report.md");
    fs.writeFileSync(
      validReportPath,
      `# Audit Report

### FIND-001: Missing token expiration check
- **id**: FIND-001
- **severity**: P1
- **file:line**: [src/auth.ts:5](src/auth.ts#L5)
- **evidence**: Repro steps: run npm test tests/auth.test.ts -> observed failure
- **confidence**: verified
- **intent_check**: bug
- **proposed_fix**: Add expiration timestamp check before decoding token claims.
- **fix_tier**: 1
- **regression_test**: tests/auth/token-expiration.test.ts
`,
      "utf8"
    );

    const res1 = runVerifier(validReportPath, fixtureRoot);
    assertTest("Test 1: Valid report exits with 0", res1, 0, "verified successfully");

    // -------------------------------------------------------------
    // Test 2: Missing referenced file
    // -------------------------------------------------------------
    const missingFileReportPath = path.join(fixtureRoot, "missing-file-report.md");
    fs.writeFileSync(
      missingFileReportPath,
      `# Audit Report

### FIND-002: Insecure cookie attribute
- **id**: FIND-002
- **severity**: P2
- **file:line**: src/nonexistent-file.ts:12
- **evidence**: Command output: grep -rn "Set-Cookie" returned unflagged session
- **confidence**: verified
- **intent_check**: bug
- **proposed_fix**: Add Secure and SameSite=Lax attributes to cookie options.
- **fix_tier**: 1
- **regression_test**: tests/cookie.test.ts
`,
      "utf8"
    );

    const res2 = runVerifier(missingFileReportPath, fixtureRoot);
    assertTest("Test 2: Missing referenced file exits with 1", res2, 1, "does not exist");

    // -------------------------------------------------------------
    // Test 3: Referenced line beyond EOF
    // -------------------------------------------------------------
    const beyondEofReportPath = path.join(fixtureRoot, "beyond-eof-report.md");
    fs.writeFileSync(
      beyondEofReportPath,
      `# Audit Report

### FIND-003: Unhandled promise rejection
- **id**: FIND-003
- **severity**: P2
- **file:line**: [src/auth.ts:99](src/auth.ts#L99)
- **evidence**: Command output: unhandled rejection at auth.ts:99
- **confidence**: verified
- **intent_check**: bug
- **proposed_fix**: Wrap async handler in try/catch block.
- **fix_tier**: 1
- **regression_test**: tests/auth/promise.test.ts
`,
      "utf8"
    );

    const res3 = runVerifier(beyondEofReportPath, fixtureRoot);
    assertTest("Test 3: Line beyond EOF exits with 1", res3, 1, "beyond EOF");

    // -------------------------------------------------------------
    // Test 4: Link uses file:/// or absolute drive path
    // -------------------------------------------------------------
    const fileUriReportPath = path.join(fixtureRoot, "file-uri-report.md");
    fs.writeFileSync(
      fileUriReportPath,
      `# Audit Report

### FIND-004: Hardcoded credential
- **id**: FIND-004
- **severity**: P1
- **file:line**: [src/auth.ts:2](file:///C:/Users/test/auth.ts#L2)
- **evidence**: Command output: credential scan detected secret
- **confidence**: verified
- **intent_check**: bug
- **proposed_fix**: Move secret to environment variable.
- **fix_tier**: 2
- **regression_test**: tests/secrets.test.ts
`,
      "utf8"
    );

    const res4 = runVerifier(fileUriReportPath, fixtureRoot);
    assertTest("Test 4: file:/// link exits with 1", res4, 1, "file:///");

    // -------------------------------------------------------------
    // Test 5: Link text path != Link target path
    // -------------------------------------------------------------
    const mismatchReportPath = path.join(fixtureRoot, "mismatch-report.md");
    fs.writeFileSync(
      mismatchReportPath,
      `# Audit Report

### FIND-005: Incorrect path link
- **id**: FIND-005
- **severity**: P2
- **file:line**: [src/auth.ts:5](src/wrong-file.ts#L5)
- **evidence**: Command output: path discrepancy
- **confidence**: verified
- **intent_check**: bug
- **proposed_fix**: Align link text and target paths.
- **fix_tier**: 0
- **regression_test**: tests/links.test.ts
`,
      "utf8"
    );

    const res5 = runVerifier(mismatchReportPath, fixtureRoot);
    assertTest("Test 5: Link text path != target path exits with 1", res5, 1, "!=");

    // -------------------------------------------------------------
    // Test 6: Finding lacks required fields
    // -------------------------------------------------------------
    const missingFieldsReportPath = path.join(fixtureRoot, "missing-fields-report.md");
    fs.writeFileSync(
      missingFieldsReportPath,
      `# Audit Report

### FIND-006: Incomplete finding
- **id**: FIND-006
- **severity**: P2
- **file:line**: src/auth.ts:4
- **evidence**: Command output: test output
- **confidence**: verified
- **intent_check**: bug
- **proposed_fix**: Add validation
- **fix_tier**: 1
`,
      "utf8"
    );

    const res6 = runVerifier(missingFieldsReportPath, fixtureRoot);
    assertTest("Test 6: Missing required field exits with 1", res6, 1, "lacks required field");

    // -------------------------------------------------------------
    // Test 7: Inferred finding with P0/P1 without repro steps
    // -------------------------------------------------------------
    const inferredNoReproReportPath = path.join(fixtureRoot, "inferred-no-repro-report.md");
    fs.writeFileSync(
      inferredNoReproReportPath,
      `# Audit Report

### FIND-007: Speculative authentication flaw
- **id**: FIND-007
- **severity**: P0
- **file:line**: src/auth.ts:3
- **evidence**: Static analysis inspection noted possible race condition in token renewal
- **confidence**: inferred
- **intent_check**: bug
- **proposed_fix**: Add mutex around renewal call.
- **fix_tier**: 2
- **regression_test**: tests/auth/race.test.ts
`,
      "utf8"
    );

    const res7 = runVerifier(inferredNoReproReportPath, fixtureRoot);
    assertTest(
      "Test 7: Inferred P0 without repro steps exits with 1",
      res7,
      1,
      "cannot be severity P0 without repro"
    );
  } finally {
    // Cleanup temp fixture
    try {
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  }

  console.log("------------------------------------------------------------");
  console.log(`Results: ${passedTests}/${totalTests} tests passed`);
  console.log("============================================================");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

if (require.main === module) {
  runAll();
}

module.exports = { runAll };
