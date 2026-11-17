#!/usr/bin/env node

/**
 * scripts/verify-report.cjs
 * Validates an evidence-based audit report (markdown) against a project root.
 *
 * Checks:
 * 1. Referenced files exist in project root.
 * 2. Referenced lines are not beyond EOF.
 * 3. Links do not use file:/// or absolute drive paths.
 * 4. Link text path matches link target path.
 * 5. Findings contain all required fields with valid values.
 * 6. Inferred findings cannot be P0/P1 without reproduction steps in evidence.
 */

const fs = require("fs");
const path = require("path");

// Reuse validator pattern & helpers from security-audit/validate-findings.cjs
let isSafeRelativeSourcePath = null;
try {
  const vf = require("../skills/security-audit/validate-findings.cjs");
  isSafeRelativeSourcePath = vf.isSafeRelativeSourcePath;
} catch {
  // Fallback safe path check if module not loaded
  isSafeRelativeSourcePath = function(p) {
    if (typeof p !== "string" || p.length === 0) return false;
    if (path.isAbsolute(p)) return false;
    if (p.includes("\\") || p.includes("\0")) return false;
    const parts = p.split("/");
    return !parts.includes("..") && !parts.includes(".");
  };
}

const REQUIRED_FINDING_FIELDS = [
  "id",
  "severity",
  "file:line",
  "evidence",
  "confidence",
  "intent_check",
  "proposed_fix",
  "fix_tier",
  "regression_test",
];

const VALID_SEVERITIES = new Set(["P0", "P1", "P2", "P3"]);
const VALID_CONFIDENCES = new Set(["verified", "inferred"]);
const VALID_INTENT_CHECKS = new Set(["bug", "product_decision_needed"]);
const VALID_FIX_TIERS = new Set(["0", "1", "2"]);

function normalizePath(p) {
  return p.replace(/^\.\//, "").replace(/\\/g, "/").trim();
}

function parseMarkdownFindings(content) {
  const findings = [];
  const sections = content.split(/\n(?=###?\s+)/);

  for (const section of sections) {
    if (!/(?:^|\n)\s*[-*]?\s*\**id\**\s*:/i.test(section)) {
      continue;
    }

    const finding = {};
    const lines = section.split(/\r?\n/);
    let currentKey = null;
    let currentValue = [];

    function flushField() {
      if (currentKey) {
        finding[currentKey] = currentValue.join("\n").trim();
      }
      currentKey = null;
      currentValue = [];
    }

    for (const line of lines) {
      const fieldMatch = line.match(/^\s*[-*]?\s*\**([a-zA-Z0-9_:-]+)\**\s*:\s*(.*)$/);
      if (fieldMatch) {
        const rawKey = fieldMatch[1].toLowerCase().replace(/-/g, "_");
        const val = fieldMatch[2].trim();
        const knownKeys = [
          "id",
          "severity",
          "file:line",
          "file_line",
          "evidence",
          "confidence",
          "intent_check",
          "proposed_fix",
          "fix_tier",
          "regression_test",
        ];
        if (knownKeys.includes(rawKey)) {
          flushField();
          currentKey = (rawKey === "file_line" ? "file:line" : rawKey);
          currentValue.push(val);
          continue;
        }
      }
      if (currentKey && line.trim().length > 0) {
        if (/^\s*[-*]\s+\*\*/.test(line) || /^###?/.test(line)) {
          flushField();
        } else {
          currentValue.push(line.trim());
        }
      }
    }
    flushField();

    if (finding.id || Object.keys(finding).length > 0) {
      findings.push(finding);
    }
  }

  // Also check for fenced JSON/YAML code blocks
  const codeBlockRegex = /```(?:json|yaml)\r?\n([\s\S]*?)\r?\n```/g;
  let cbMatch;
  while ((cbMatch = codeBlockRegex.exec(content)) !== null) {
    const block = cbMatch[1].trim();
    if (block.startsWith("{") || block.startsWith("[")) {
      try {
        const parsed = JSON.parse(block);
        const items = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of items) {
          if (item && (item.id || item.severity)) {
            const normalized = {};
            for (const [k, v] of Object.entries(item)) {
              const nk = k.toLowerCase().replace(/-/g, "_");
              normalized[nk === "file_line" ? "file:line" : nk] = String(v);
            }
            if (!findings.some(f => f.id === normalized.id)) {
              findings.push(normalized);
            }
          }
        }
      } catch {
        // Ignore non-JSON blocks
      }
    }
  }

  return findings;
}

function verifyReport(reportContent, projectRoot) {
  const errors = [];

  // ---------------------------------------------------------------------------
  // Check 1: Validate all markdown links in the document
  // ---------------------------------------------------------------------------
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;

  while ((match = linkRegex.exec(reportContent)) !== null) {
    const rawText = match[1].trim();
    const rawTarget = match[2].trim();

    // Check forbidden file:/// scheme or absolute paths
    if (rawTarget.startsWith("file:///") || rawTarget.startsWith("file://")) {
      errors.push(`Link target uses forbidden file:/// scheme: "${rawTarget}"`);
    } else if (/^[a-zA-Z]:[/\\]/.test(rawTarget) || /^[/\\]/.test(rawTarget)) {
      errors.push(`Link target uses forbidden absolute path: "${rawTarget}"`);
    }

    if (rawText.includes("file:///") || rawText.includes("file://")) {
      errors.push(`Link text uses forbidden file:/// scheme: "${rawText}"`);
    } else if (/^[a-zA-Z]:[/\\]/.test(rawText)) {
      errors.push(`Link text uses forbidden absolute path: "${rawText}"`);
    }

    // Skip web URLs and in-document anchor links
    if (
      rawTarget.startsWith("http://") ||
      rawTarget.startsWith("https://") ||
      rawTarget.startsWith("mailto:") ||
      rawTarget.startsWith("#")
    ) {
      continue;
    }

    const cleanTarget = normalizePath(rawTarget.split("#")[0].split("?")[0]);
    if (!cleanTarget) continue;

    // Link text path vs Link target path
    const textHasPathForm = /[\/\\]|\.[a-zA-Z0-9]+(?::[0-9]+)?$/.test(rawText);
    if (textHasPathForm) {
      const textPathClean = normalizePath(
        rawText.replace(/:[0-9]+.*$/, "").replace(/#.*$/, "")
      );
      if (textPathClean !== cleanTarget) {
        errors.push(
          `Link text path "${textPathClean}" != link target path "${cleanTarget}"`
        );
      }
    }

    // Check referenced file existence and EOF bounds
    const resolvedPath = path.resolve(projectRoot, cleanTarget);
    if (!fs.existsSync(resolvedPath)) {
      errors.push(`Referenced file does not exist: "${cleanTarget}"`);
    } else {
      const anchorMatch = rawTarget.match(/#(?:L|line-)?([0-9]+)/i);
      if (anchorMatch) {
        const anchorLine = parseInt(anchorMatch[1], 10);
        try {
          const fileContent = fs.readFileSync(resolvedPath, "utf8");
          const totalLines = fileContent.split(/\r?\n/).length;
          if (anchorLine < 1 || anchorLine > totalLines) {
            errors.push(
              `Referenced line ${anchorLine} is beyond EOF (${totalLines}) in "${cleanTarget}"`
            );
          }
        } catch (err) {
          errors.push(`Could not read referenced file "${cleanTarget}": ${err.message}`);
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Check 2: Parse and validate findings
  // ---------------------------------------------------------------------------
  const findings = parseMarkdownFindings(reportContent);

  if (findings.length === 0) {
    if (/(?:###?\s+(?:FIND-|Finding)|##\s+Findings)/i.test(reportContent)) {
      errors.push("Failed to parse findings from report despite finding sections present.");
    }
  }

  for (const finding of findings) {
    const findingId = finding.id || "UNKNOWN_ID";

    // Required fields check
    for (const reqField of REQUIRED_FINDING_FIELDS) {
      if (
        finding[reqField] === undefined ||
        finding[reqField] === null ||
        String(finding[reqField]).trim() === ""
      ) {
        errors.push(`Finding "${findingId}" lacks required field: "${reqField}"`);
      }
    }

    // Severity validation
    const sev = (finding.severity || "").trim().toUpperCase();
    if (!VALID_SEVERITIES.has(sev)) {
      errors.push(
        `Finding "${findingId}" has invalid severity: "${finding.severity}" (must be P0, P1, P2, or P3)`
      );
    }

    // Confidence validation
    const conf = (finding.confidence || "").trim().toLowerCase();
    if (!VALID_CONFIDENCES.has(conf)) {
      errors.push(
        `Finding "${findingId}" confidence must be "verified" or "inferred", got: "${finding.confidence}"`
      );
    } else if (conf === "inferred" && (sev === "P0" || sev === "P1")) {
      const ev = finding.evidence || "";
      const hasRepro = /\b(repro|reproduce|reproducing|reproduction|steps to reproduce)\b/i.test(ev);
      if (!hasRepro) {
        errors.push(
          `Finding "${findingId}" with confidence "inferred" cannot be severity ${sev} without repro steps in evidence`
        );
      }
    }

    // Intent check validation
    const intent = (finding.intent_check || "").trim().toLowerCase();
    if (!VALID_INTENT_CHECKS.has(intent)) {
      errors.push(
        `Finding "${findingId}" intent_check must be "bug" or "product_decision_needed", got: "${finding.intent_check}"`
      );
    }

    // Fix tier validation
    const tier = String(finding.fix_tier || "").trim();
    if (!VALID_FIX_TIERS.has(tier)) {
      errors.push(
        `Finding "${findingId}" fix_tier must be 0, 1, or 2, got: "${finding.fix_tier}"`
      );
    }

    // file:line validation
    const rawFileLine = (finding["file:line"] || "").trim();
    if (rawFileLine) {
      if (rawFileLine.includes("file:///") || rawFileLine.includes("file://")) {
        errors.push(`Finding "${findingId}" file:line must never use file:///: "${rawFileLine}"`);
      } else if (/^[a-zA-Z]:[/\\]/.test(rawFileLine) || /^[/\\]/.test(rawFileLine)) {
        errors.push(`Finding "${findingId}" file:line must be a relative path, not absolute: "${rawFileLine}"`);
      }

      let filePath = null;
      let lineNumber = null;

      const linkMatch = rawFileLine.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        const linkText = linkMatch[1].trim();
        const linkTarget = linkMatch[2].trim();

        if (linkTarget.startsWith("file:///") || linkTarget.startsWith("file://")) {
          errors.push(`Finding "${findingId}" file:line link uses forbidden file:/// scheme: "${linkTarget}"`);
        }
        if (/^[a-zA-Z]:[/\\]/.test(linkTarget) || /^[/\\]/.test(linkTarget)) {
          errors.push(`Finding "${findingId}" file:line link uses forbidden absolute path: "${linkTarget}"`);
        }

        const cleanTarget = normalizePath(linkTarget.split("#")[0].split("?")[0]);
        const targetAnchorMatch = linkTarget.match(/#(?:L|line-)?([0-9]+)/i);

        const textPathMatch = linkText.match(/^([^:#]+)(?::([0-9]+))?/);
        const textPath = textPathMatch ? normalizePath(textPathMatch[1]) : "";
        const textLine = textPathMatch && textPathMatch[2] ? parseInt(textPathMatch[2], 10) : null;
        const targetLine = targetAnchorMatch ? parseInt(targetAnchorMatch[1], 10) : null;

        if (textPath && cleanTarget && textPath !== cleanTarget) {
          errors.push(`Finding "${findingId}" link text path "${textPath}" != link target path "${cleanTarget}"`);
        }

        filePath = cleanTarget;
        lineNumber = targetLine !== null ? targetLine : textLine;
      } else {
        const plainMatch = rawFileLine.match(/^([^:]+):([0-9]+)$/);
        if (!plainMatch) {
          errors.push(
            `Finding "${findingId}" file:line must be in format "path:line" or [path:line](path#Lline), got: "${rawFileLine}"`
          );
          filePath = rawFileLine;
          lineNumber = null;
        } else {
          filePath = normalizePath(plainMatch[1]);
          lineNumber = parseInt(plainMatch[2], 10);
        }
      }

      if (filePath) {
        if (!isSafeRelativeSourcePath(filePath)) {
          errors.push(`Finding "${findingId}" file:line has unsafe relative path: "${filePath}"`);
        }

        const resolved = path.resolve(projectRoot, filePath);
        if (!fs.existsSync(resolved)) {
          errors.push(`Referenced file does not exist: "${filePath}" (finding "${findingId}")`);
        } else if (lineNumber !== null && lineNumber !== undefined) {
          if (lineNumber < 1) {
            errors.push(`Referenced line ${lineNumber} must be positive in "${filePath}" (finding "${findingId}")`);
          } else {
            try {
              const fileContent = fs.readFileSync(resolved, "utf8");
              const totalLines = fileContent.split(/\r?\n/).length;
              if (lineNumber > totalLines) {
                errors.push(
                  `Referenced line ${lineNumber} is beyond EOF (${totalLines}) in "${filePath}" (finding "${findingId}")`
                );
              }
            } catch (err) {
              errors.push(`Could not read referenced file "${filePath}": ${err.message}`);
            }
          }
        }
      }
    }
  }

  return { errors, findingsCount: findings.length };
}

function run(reportArg, projectRootArg) {
  if (!reportArg || !projectRootArg) {
    console.error("Usage: node verify-report.cjs <report.md> <project_root>");
    return 1;
  }

  const absReportPath = path.resolve(reportArg);
  const absProjectRoot = path.resolve(projectRootArg);

  if (!fs.existsSync(absReportPath)) {
    console.error(`ERROR: Report file does not exist: ${reportArg}`);
    return 1;
  }

  if (!fs.existsSync(absProjectRoot)) {
    console.error(`ERROR: Project root does not exist: ${projectRootArg}`);
    return 1;
  }

  let content;
  try {
    content = fs.readFileSync(absReportPath, "utf8");
  } catch (err) {
    console.error(`ERROR: Failed to read report file: ${err.message}`);
    return 1;
  }

  const { errors, findingsCount } = verifyReport(content, absProjectRoot);

  if (errors.length > 0) {
    console.error(`FAIL: ${errors.length} error(s) found in ${reportArg}:`);
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    return 1;
  }

  console.log(`PASS: Report "${reportArg}" verified successfully (${findingsCount} findings checked)`);
  return 0;
}

module.exports = {
  verifyReport,
  parseMarkdownFindings,
  REQUIRED_FINDING_FIELDS,
  run,
};

if (require.main === module) {
  process.exit(run(process.argv[2], process.argv[3]));
}
