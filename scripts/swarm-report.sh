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

  for (const line of lines) {
    try {
      const record = JSON.parse(line);
      if (record && record.record_type === "task_summary") {
        taskSummaries.push(record);
      } else if (record && record.record_type === "agent_run") {
        agentRuns.push(record);
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
  console.log(`Total Records Processed: ${taskSummaries.length + agentRuns.length}`);
  if (skippedCount > 0) {
    console.log(`Skipped Invalid / Unrecognized Lines: ${skippedCount}`);
  }
  console.log("------------------------------------------------------------");

  // 1. Completed Tasks & Success / Test Status
  const completedTasks = taskSummaries.filter(t => t.status === "completed" || t.status === "done" || t.verdict === "approved");
  const passedTests = taskSummaries.filter(t => t.tests_status === "passed" || t.tests_status === "pass");
  console.log(`Completed Tasks: ${completedTasks.length} / ${taskSummaries.length}`);
  console.log(`Test Pass Rate: ${taskSummaries.length > 0 ? ((passedTests.length / taskSummaries.length) * 100).toFixed(1) + "%" : "N/A"} (${passedTests.length} passed)`);

  // 2. Average Task Duration by Risk Tier
  console.log("\n--- Task Duration by Risk Tier ---");
  const tiers = ["tier_0", "tier_1", "tier_2"];
  const tierStats = {};

  for (const tier of tiers) {
    tierStats[tier] = { count: 0, totalSeconds: 0 };
  }

  for (const t of taskSummaries) {
    const tier = t.risk_tier || t.tier || "unknown";
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

  // 6. Stall Events
  let stallCount = 0;
  for (const t of taskSummaries) {
    if (Number(t.stall_count) > 0) {
      stallCount += Number(t.stall_count);
    }
  }
  console.log(`Stall Detections / Pings: ${stallCount}`);

  // 7. Overall Summary
  console.log("------------------------------------------------------------");
  console.log("END-TO-END SPEEDUP: NOT MEASURED — RUNTIME UNAVAILABLE");
  console.log("============================================================");

} catch (err) {
  console.error("Error analyzing metrics file:", err.message);
  process.exit(1);
}
' "$METRICS_FILE"
