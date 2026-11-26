#!/usr/bin/env bash
# ==============================================================================
# Swarm Performance Benchmark & Metrics Report
# ==============================================================================
set -euo pipefail

METRICS_FILE="${1:-${SWARM_METRICS_FILE:-.swarm/metrics.jsonl}}"

if [ ! -f "$METRICS_FILE" ] || [ ! -s "$METRICS_FILE" ]; then
  echo "============================================================"
  echo "         SWARM PERFORMANCE BENCHMARK REPORT"
  echo "============================================================"
  echo "Target File: $METRICS_FILE"
  echo "Status: No metrics recorded yet — metrics file missing or empty"
  echo "END-TO-END SPEEDUP: NOT MEASURED — RUNTIME UNAVAILABLE"
  echo "============================================================"
  exit 0
fi

node -e '
const fs = require("fs");
const filePath = process.argv[1];

try {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);

  let skippedCount = 0;
  let taskSummaries = [];
  let agentRuns = [];
  let stallEvents = [];

  for (const line of lines) {
    try {
      const record = JSON.parse(line);
      if (record && record.record_type === "task_summary") {
        taskSummaries.push(record);
      } else if (record && record.record_type === "agent_run") {
        agentRuns.push(record);
      } else if (record && record.record_type === "stall") {
        stallEvents.push(record);
      } else {
        skippedCount++;
      }
    } catch (e) {
      skippedCount++;
    }
  }

  console.log("============================================================");
  console.log("         SWARM PERFORMANCE BENCHMARK REPORT");
  console.log("============================================================");
  console.log(`Target Metrics File: ${filePath}`);
  console.log(`Total Records Processed: ${taskSummaries.length + agentRuns.length + stallEvents.length}`);
  if (skippedCount > 0) {
    console.log(`Skipped Invalid / Unrecognized Lines: ${skippedCount}`);
  }
  console.log("------------------------------------------------------------");

  function normalizeTier(rawTier) {
    if (rawTier === undefined || rawTier === null) return "unknown";
    const s = String(rawTier).trim().toLowerCase();
    if (s === "0" || s === "tier_0" || s === "tier-0") return "tier_0";
    if (s === "1" || s === "tier_1" || s === "tier-1") return "tier_1";
    if (s === "2" || s === "tier_2" || s === "tier-2") return "tier_2";
    return s;
  }

  // 1. Completed Tasks & Success / Test Status
  const completedTasks = taskSummaries.filter(t => t.status === "completed" || t.status === "done" || t.verdict === "approved");
  console.log(`Completed Tasks: ${completedTasks.length} / ${taskSummaries.length}`);

  // Test pass rate computed from BOTH agent_run and task_summary records
  const allTestRecords = [...taskSummaries, ...agentRuns].filter(r => r && r.tests_status !== undefined && r.tests_status !== null && String(r.tests_status).trim() !== "");
  const passedTests = allTestRecords.filter(r => {
    const s = String(r.tests_status).trim().toLowerCase();
    return s === "passed" || s === "pass";
  });
  const totalEvaluations = allTestRecords.length > 0 ? allTestRecords.length : taskSummaries.length;
  console.log(`Test Pass Rate: ${totalEvaluations > 0 ? ((passedTests.length / totalEvaluations) * 100).toFixed(1) + "%" : "N/A"} (${passedTests.length} passed)`);

  // 2. Average Task Duration by Risk Tier
  console.log("\n--- Task Duration by Risk Tier ---");
  const tiers = ["tier_0", "tier_1", "tier_2"];
  const tierStats = {};

  for (const tier of tiers) {
    tierStats[tier] = { count: 0, totalSeconds: 0 };
  }

  for (const t of taskSummaries) {
    const raw = t.risk_tier !== undefined ? t.risk_tier : t.tier;
    const tier = normalizeTier(raw);
    if (!tierStats[tier]) {
      tierStats[tier] = { count: 0, totalSeconds: 0 };
    }
    const duration = Number(t.duration_seconds || (t.duration_minutes ? t.duration_minutes * 60 : 0) || (t.duration_ms ? t.duration_ms / 1000 : 0));
    if (duration > 0) {
      tierStats[tier].count++;
      tierStats[tier].totalSeconds += duration;
    }
  }

  for (const [tier, stat] of Object.entries(tierStats)) {
    if (stat.count > 0) {
      const avgMin = (stat.totalSeconds / stat.count / 60).toFixed(2);
      console.log(`  ${tier}: avg ${avgMin} min (${stat.count} tasks)`);
    } else {
      console.log(`  ${tier}: No recorded tasks`);
    }
  }

  // 3. Average Agent Duration by Agent
  console.log("\n--- Average Agent Duration ---");
  const agentStats = {};
  for (const r of agentRuns) {
    const agent = r.agent || r.agent_name || "unknown";
    if (!agentStats[agent]) {
      agentStats[agent] = { count: 0, totalSeconds: 0 };
    }
    const duration = Number(r.duration_seconds || (r.duration_minutes ? r.duration_minutes * 60 : 0) || (r.duration_ms ? r.duration_ms / 1000 : 0));
    if (duration > 0) {
      agentStats[agent].count++;
      agentStats[agent].totalSeconds += duration;
    }
  }

  const agentKeys = Object.keys(agentStats).sort();
  if (agentKeys.length > 0) {
    for (const a of agentKeys) {
      const stat = agentStats[a];
      const avgSec = (stat.totalSeconds / stat.count).toFixed(1);
      console.log(`  ${a.padEnd(20)}: avg ${avgSec}s (${stat.count} runs)`);
    }
  } else {
    console.log("  No individual agent runs recorded.");
  }

  // 4. Tasks Reaching Two-Review-Round Cap
  const cappedTasks = taskSummaries.filter(t => t.max_review_rounds_hit === true || (Number(t.review_rounds) >= 2));
  console.log(`\nReview Cap Reached (2 rounds): ${cappedTasks.length} tasks`);

  // 5. Fallback Events
  let fallbackCount = 0;
  for (const t of taskSummaries) {
    if (t.fallback_used === true || Number(t.fallback_count) > 0) {
      fallbackCount += Number(t.fallback_count || 1);
    }
  }
  for (const r of agentRuns) {
    if (r.fallback_used === true) {
      fallbackCount++;
    }
  }
  console.log(`Fallback Model Activations: ${fallbackCount}`);

  // 6. Stall Events (computed from task_summary, agent_run, and stall records)
  let stallCount = 0;
  for (const t of taskSummaries) {
    if (Number(t.stall_count) > 0) {
      stallCount += Number(t.stall_count);
    } else if (t.stalled === true || t.stall_detected === true) {
      stallCount++;
    }
  }
  for (const r of agentRuns) {
    if (Number(r.stall_count) > 0) {
      stallCount += Number(r.stall_count);
    } else if (r.stalled === true || r.stall_detected === true) {
      stallCount++;
    }
  }
  for (const s of stallEvents) {
    stallCount += Number(s.stall_count) > 0 ? Number(s.stall_count) : 1;
  }
  console.log(`Stall Detections / Pings: ${stallCount}`);

  // 7. Token & Cost Telemetry (rendered when token or cost fields are present)
  let totalTokensIn = 0;
  let totalTokensOut = 0;
  let totalCostUsd = 0;
  let hasTokenTelemetry = false;
  let hasCostTelemetry = false;
  const tierCostTotals = { tier_0: 0, tier_1: 0, tier_2: 0 };

  for (const r of [...taskSummaries, ...agentRuns, ...stallEvents]) {
    if (r.tokens_in !== undefined && r.tokens_in !== null && Number.isFinite(Number(r.tokens_in))) {
      totalTokensIn += Number(r.tokens_in);
      hasTokenTelemetry = true;
    }
    if (r.tokens_out !== undefined && r.tokens_out !== null && Number.isFinite(Number(r.tokens_out))) {
      totalTokensOut += Number(r.tokens_out);
      hasTokenTelemetry = true;
    }
    if (r.cost_usd !== undefined && r.cost_usd !== null && Number.isFinite(Number(r.cost_usd))) {
      const costVal = Number(r.cost_usd);
      totalCostUsd += costVal;
      hasCostTelemetry = true;
      const tierKey = normalizeTier(r.risk_tier !== undefined ? r.risk_tier : r.tier);
      tierCostTotals[tierKey] = (tierCostTotals[tierKey] || 0) + costVal;
    }
  }

  if (hasTokenTelemetry || hasCostTelemetry) {
    console.log("\n--- Cost & Token Telemetry ---");
    if (hasTokenTelemetry) {
      const totalTokens = totalTokensIn + totalTokensOut;
      console.log(`  Total Tokens: ${totalTokens} (in: ${totalTokensIn}, out: ${totalTokensOut})`);
    }
    if (hasCostTelemetry) {
      console.log(`  Total Cost (USD): $${totalCostUsd.toFixed(4)}`);
      const taskCountForAvg = taskSummaries.length;
      if (taskCountForAvg > 0) {
        console.log(`  Avg Cost per Task: $${(totalCostUsd / taskCountForAvg).toFixed(4)} (${taskCountForAvg} tasks)`);
      } else {
        console.log("  Avg Cost per Task: N/A (0 task summaries)");
      }
      for (const tier of Object.keys(tierStats)) {
        const stat = tierStats[tier];
        if (stat.count > 0) {
          const tierCost = tierCostTotals[tier] || 0;
          console.log(`  Avg Cost (${tier}): $${(tierCost / stat.count).toFixed(4)} (${stat.count} tasks)`);
        }
      }
    }
  }

  // 8. Overall Summary
  console.log("------------------------------------------------------------");
  console.log("END-TO-END SPEEDUP: NOT MEASURED — RUNTIME UNAVAILABLE");
  console.log("============================================================");

} catch (err) {
  console.error("Error analyzing metrics file:", err.message);
  process.exit(1);
}
' "$METRICS_FILE"
