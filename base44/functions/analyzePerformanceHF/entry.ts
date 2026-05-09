import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { logs } = await req.json();
    if (!logs || logs.length === 0) {
      return Response.json({ error: 'No biometric logs provided' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('hugging_face');

    // Build a structured summary of recent biometric data
    const recent = logs.slice(0, 14);
    const avgHrv = (recent.filter(l => l.hrv).reduce((s, l) => s + l.hrv, 0) / (recent.filter(l => l.hrv).length || 1)).toFixed(1);
    const avgRecovery = (recent.filter(l => l.recovery_pct).reduce((s, l) => s + l.recovery_pct, 0) / (recent.filter(l => l.recovery_pct).length || 1)).toFixed(1);
    const avgSleep = (recent.filter(l => l.sleep_performance).reduce((s, l) => s + l.sleep_performance, 0) / (recent.filter(l => l.sleep_performance).length || 1)).toFixed(1);
    const avgRhr = (recent.filter(l => l.rhr).reduce((s, l) => s + l.rhr, 0) / (recent.filter(l => l.rhr).length || 1)).toFixed(1);
    const avgStrain = (recent.filter(l => l.strain).reduce((s, l) => s + l.strain, 0) / (recent.filter(l => l.strain).length || 1)).toFixed(1);

    const latest = logs[0];

    const prompt = `You are an elite sports science AI analyzing a combat athlete's biometric performance data.

ATHLETE BIOMETRIC SUMMARY (last ${recent.length} days):
- Average HRV: ${avgHrv} ms (latest: ${latest.hrv ?? 'N/A'} ms)
- Average Recovery: ${avgRecovery}% (latest: ${latest.recovery_pct ?? 'N/A'}%)
- Average Sleep Performance: ${avgSleep}% (latest: ${latest.sleep_performance ?? 'N/A'}%)
- Average Resting HR: ${avgRhr} bpm (latest: ${latest.rhr ?? 'N/A'} bpm)
- Average Strain: ${avgStrain}/21 (latest: ${latest.strain ?? 'N/A'}/21)
- Body Battery: ${latest.body_battery ?? 'N/A'}%

Provide a concise performance analysis with:
1. TREND ASSESSMENT: What the 14-day trend indicates (improving, declining, stable)
2. KEY INSIGHT: The single most important finding from this data
3. RECOVERY STATUS: Current recovery quality and what it means for training
4. ACTION ITEMS: 2-3 specific, actionable recommendations for the next 48 hours
5. RISK FLAGS: Any concerning patterns that need immediate attention

Keep each section to 1-2 sentences. Be direct, data-driven, and athlete-focused.`;

    const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Meta-Llama-3-8B-Instruct',
        // Using Meta-Llama-3-8B via Hugging Face inference API
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[analyzePerformanceHF] HF API error:', err);
      return Response.json({ error: 'Hugging Face inference failed', details: err }, { status: 500 });
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || 'No analysis returned.';

    return Response.json({
      analysis,
      model: 'meta-llama/Llama-3.2-3B-Instruct',
      stats: { avgHrv, avgRecovery, avgSleep, avgRhr, avgStrain, daysAnalyzed: recent.length },
    });

  } catch (error) {
    console.error('[analyzePerformanceHF] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});