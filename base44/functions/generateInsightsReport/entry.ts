import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch last 90 days of biometric logs
  const logs = await base44.entities.BiometricLog.list('-date', 90);

  if (logs.length < 5) {
    return Response.json({ error: 'not_enough_data', message: 'Need at least 5 days of data to generate insights.' });
  }

  // Sort ascending for trend analysis
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));

  // Build a compact data summary for the LLM (avoid token overflow)
  const dataSummary = sorted.map(l => ({
    date: l.date,
    recovery: l.recovery_pct ?? null,
    strain: l.strain ?? null,
    hrv: l.hrv ?? null,
    rhr: l.rhr ?? l.resting_hr ?? null,
    sleep: l.sleep_performance ?? null,
    calories: l.active_calories ?? null,
    steps: l.steps ?? null,
    source: l.source ?? null,
  }));

  // Compute basic stats to help the LLM
  const withRecovery = dataSummary.filter(d => d.recovery != null);
  const withHrv = dataSummary.filter(d => d.hrv != null);
  const withSleep = dataSummary.filter(d => d.sleep != null);
  const withStrain = dataSummary.filter(d => d.strain != null);

  const avg = (arr, key) => arr.length ? Math.round(arr.reduce((s, d) => s + d[key], 0) / arr.length) : null;
  const last7 = dataSummary.slice(-7);
  const prev7 = dataSummary.slice(-14, -7);

  const stats = {
    total_days: dataSummary.length,
    avg_recovery_all: avg(withRecovery, 'recovery'),
    avg_hrv_all: avg(withHrv, 'hrv'),
    avg_sleep_all: avg(withSleep, 'sleep'),
    avg_strain_all: avg(withStrain, 'strain'),
    last7_avg_recovery: avg(last7.filter(d => d.recovery != null), 'recovery'),
    last7_avg_hrv: avg(last7.filter(d => d.hrv != null), 'hrv'),
    last7_avg_sleep: avg(last7.filter(d => d.sleep != null), 'sleep'),
    last7_avg_strain: avg(last7.filter(d => d.strain != null), 'strain'),
    prev7_avg_recovery: avg(prev7.filter(d => d.recovery != null), 'recovery'),
    prev7_avg_hrv: avg(prev7.filter(d => d.hrv != null), 'hrv'),
    prev7_avg_sleep: avg(prev7.filter(d => d.sleep != null), 'sleep'),
  };

  const prompt = `You are an elite sports science analyst with deep expertise in HRV, recovery, sleep physiology, and training load management.

Analyze the following biometric data for an athlete and produce a structured weekly insights report.

## Aggregate Stats
${JSON.stringify(stats, null, 2)}

## Daily Data (last ${Math.min(dataSummary.length, 60)} days)
${JSON.stringify(dataSummary.slice(-60), null, 2)}

## Your Task
Generate a thorough, evidence-based weekly insights report. Identify real correlations from the data — don't make generic statements. Focus only on patterns you can actually see in the numbers.

Return a JSON object with this exact structure:
{
  "weekly_summary": "2-3 sentence plain-English summary of this week vs last week",
  "trend_direction": "improving" | "declining" | "stable",
  "performance_score": <number 0-100 representing overall biometric health this week>,
  "insights": [
    {
      "title": "Short insight title",
      "finding": "Specific, data-backed observation (cite actual numbers)",
      "impact": "What this means for training/recovery",
      "action": "Concrete, specific recommendation",
      "category": "sleep" | "recovery" | "hrv" | "strain" | "nutrition" | "trend",
      "severity": "positive" | "warning" | "critical" | "neutral"
    }
  ],
  "correlations": [
    {
      "title": "Correlation title",
      "description": "Describe the relationship found between two metrics",
      "metric_a": "name of metric A",
      "metric_b": "name of metric B",
      "strength": "strong" | "moderate" | "weak",
      "direction": "positive" | "negative"
    }
  ],
  "weekly_actions": ["Action 1", "Action 2", "Action 3"],
  "highlight_day": {
    "date": "YYYY-MM-DD",
    "reason": "Why this day stands out (best or worst)"
  },
  "red_flags": ["any critical warnings if present, or empty array"]
}

Generate 4-7 insights and 2-4 correlations. Be specific and cite exact numbers from the data.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        weekly_summary: { type: "string" },
        trend_direction: { type: "string" },
        performance_score: { type: "number" },
        insights: { type: "array", items: { type: "object" } },
        correlations: { type: "array", items: { type: "object" } },
        weekly_actions: { type: "array", items: { type: "string" } },
        highlight_day: { type: "object" },
        red_flags: { type: "array", items: { type: "string" } }
      }
    },
    model: "claude_sonnet_4_6"
  });

  return Response.json({ report: result, generated_at: new Date().toISOString(), days_analyzed: dataSummary.length });
});