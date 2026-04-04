import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch last 14 days of biometric data
    const today = new Date();
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

    const biometrics = await base44.entities.BiometricLog.filter({
      created_by: user.email,
      date: { $gte: twoWeeksAgo.toISOString().split('T')[0] },
    });

    const sessions = await base44.entities.TrainingSession.filter({
      created_by: user.email,
      date: { $gte: twoWeeksAgo.toISOString().split('T')[0] },
    });

    const userProfile = await base44.entities.UserProfile.filter({
      created_by: user.email,
    });

    // Prepare time-series data for analysis
    const timeSeriesData = biometrics.map(b => ({
      date: b.date,
      hrv: b.hrv || null,
      resting_hr: b.resting_hr || null,
      sleep_hours: b.sleep_hours || null,
      recovery_score: b.recovery_score || 50,
      training_load: b.training_load || null,
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    const recentTraining = sessions
      .filter(s => new Date(s.date) >= twoWeeksAgo)
      .map(s => ({
        date: s.date,
        type: s.session_type,
        duration: s.duration_minutes || 60,
        intensity: s.intensity || 5,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const prompt = `You are a sports science and recovery prediction specialist.

Analyze this 14-day athlete performance time-series data:

**Biometric History:**
${JSON.stringify(timeSeriesData, null, 2)}

**Recent Training:**
${JSON.stringify(recentTraining, null, 2)}

**Athlete Profile:**
- Age: ${userProfile[0]?.age || 'unknown'}
- Training Focus: ${userProfile[0]?.vellera_track || 'mixed'}
- Current Momentum: ${userProfile[0]?.current_streak_days || 0} day streak

Predict:
1. **Recovery Status** - current readiness (0-100)
2. **Trend** - improving, declining, or stable?
3. **Key Indicators** - which metrics most influence recovery?
4. **7-Day Forecast** - recovery trajectory
5. **Intervention Recommendations** - specific actions to optimize recovery
6. **Injury Risk Factors** - identify concerning patterns

Return JSON:
{
  "current_recovery_score": 0-100,
  "readiness_level": "poor|fair|good|excellent",
  "trend": "improving|declining|stable",
  "key_indicators": {
    "hrv": "impact description",
    "resting_hr": "impact description",
    "sleep": "impact description",
    "training_load": "impact description"
  },
  "seven_day_forecast": {
    "day_1": 0-100,
    "day_2": 0-100,
    "day_3": 0-100,
    "day_4": 0-100,
    "day_5": 0-100,
    "day_6": 0-100,
    "day_7": 0-100
  },
  "recommendations": ["rec 1", "rec 2"],
  "injury_risk_factors": ["risk 1"],
  "confidence_score": 0-100
}`;

    const prediction = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: 'gpt_5',
      response_json_schema: {
        type: 'object',
        properties: {
          current_recovery_score: { type: 'number' },
          readiness_level: { type: 'string' },
          trend: { type: 'string' },
          key_indicators: {
            type: 'object',
            properties: {
              hrv: { type: 'string' },
              resting_hr: { type: 'string' },
              sleep: { type: 'string' },
              training_load: { type: 'string' },
            },
          },
          seven_day_forecast: {
            type: 'object',
            properties: {
              day_1: { type: 'number' },
              day_2: { type: 'number' },
              day_3: { type: 'number' },
              day_4: { type: 'number' },
              day_5: { type: 'number' },
              day_6: { type: 'number' },
              day_7: { type: 'number' },
            },
          },
          recommendations: { type: 'array', items: { type: 'string' } },
          injury_risk_factors: { type: 'array', items: { type: 'string' } },
          confidence_score: { type: 'number' },
        },
      },
    });

    return Response.json({
      prediction,
      data_points: timeSeriesData.length,
      training_sessions: recentTraining.length,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('recoveryPredictor error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});