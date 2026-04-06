import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * googleFitWebhook — Google Fit Activity Data Processor
 *
 * This function polls Google Fit's REST API for recent activity data
 * and auto-populates TrainingSession + WellnessLog + UserProfile workload metrics.
 *
 * IMPORTANT: Google Fit does NOT support true push webhooks for third-party apps.
 * This function is designed to be called:
 *   1. From a scheduled automation (e.g., every 30 minutes)
 *   2. Manually from the frontend: base44.functions.invoke('googleFitWebhook', { user_email })
 *
 * Apple Health: No public OAuth API exists for web apps. HealthKit is iOS-only.
 * Users can export Apple Health data as CSV/XML and import via the data import feature.
 *
 * Payload: { user_email?: string }  — admin can specify; otherwise uses authenticated user
 * Returns: { synced_sessions, workload_updated, wellness_updated, summary }
 */

const GOOGLE_FIT_BASE = 'https://www.googleapis.com/fitness/v1/users/me';

// Activity type mappings: Google Fit activityType → Vellera session_type
const ACTIVITY_TYPE_MAP = {
  1:   'S&C Strength',       // Aerobics
  7:   'BJJ/Grappling',      // Martial arts
  8:   'S&C Zone2',          // Biking (stationary)
  13:  'S&C Zone2',          // Cross training
  16:  'S&C Zone2',          // Elliptical
  17:  'S&C Strength',       // Ergometer
  20:  'S&C Strength',       // Fitness walking
  21:  'S&C Zone2',          // Football (American)
  26:  'Home Mobility',      // Gymnastics
  27:  'S&C Strength',       // Handball
  28:  'BJJ/Grappling',      // High intensity interval training
  29:  'Home Mobility',      // Hiking
  33:  'S&C Strength',       // Jumping rope
  34:  'S&C Strength',       // Kettlebell training
  35:  'Striking/MMA',       // Kickboxing
  41:  'BJJ/Grappling',      // Mixed martial arts
  45:  'S&C Zone2',          // P90X exercises
  46:  'S&C Zone2',          // Pilates
  47:  'S&C Zone2',          // Polo
  52:  'S&C Zone2',          // Rock climbing
  56:  'S&C Zone2',          // Running (treadmill)
  57:  'S&C Zone2',          // Running
  63:  'S&C Strength',       // Strength training
  64:  'S&C Zone2',          // Surfing
  68:  'Home Mobility',      // Swimming (pool)
  70:  'Home Mobility',      // Table tennis
  73:  'Home Mobility',      // Volleyball
  74:  'S&C Zone2',          // Walking
  75:  'S&C Strength',       // Water polo
  82:  'S&C Zone2',          // Zumba
  108: 'S&C Strength',       // Weight lifting
  113: 'S&C Strength',       // Crossfit
  115: 'BJJ/Grappling',      // Wrestling
};

function mapActivityType(typeId) {
  return ACTIVITY_TYPE_MAP[typeId] || 'S&C Strength';
}

function msToMinutes(ms) {
  return Math.round(ms / 60000);
}

function intensityFromCalories(calories, durationMin) {
  if (!calories || !durationMin) return 5;
  const cpm = calories / durationMin;
  if (cpm > 12) return 9;
  if (cpm > 9)  return 8;
  if (cpm > 7)  return 7;
  if (cpm > 5)  return 6;
  if (cpm > 3)  return 5;
  return 4;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const targetEmail = (user.role === 'admin' && body.user_email) ? body.user_email : user.email;

  // ── Retrieve Google Fit access token ─────────────────────────────────────
  // Token stored in WearableToken entity by the OAuth flow (googleFitOAuthCallback)
  const tokens = await base44.asServiceRole.entities.WearableToken.filter({ user_email: targetEmail, provider: 'google_fit' });
  const tokenRecord = tokens[0];

  if (!tokenRecord?.access_token) {
    return Response.json({
      error: 'No Google Fit token found. Connect Google Fit first at /wearables.',
      user: targetEmail,
    }, { status: 404 });
  }

  const accessToken = tokenRecord.access_token;
  const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

  // ── Determine sync window: last 48 hours ─────────────────────────────────
  const endMs   = Date.now();
  const startMs = endMs - (48 * 60 * 60 * 1000);

  // ── Fetch activity sessions ───────────────────────────────────────────────
  const sessionsRes = await fetch(
    `${GOOGLE_FIT_BASE}/sessions?startTime=${new Date(startMs).toISOString()}&endTime=${new Date(endMs).toISOString()}`,
    { headers }
  );

  if (!sessionsRes.ok) {
    const err = await sessionsRes.text();
    console.error('[googleFitWebhook] Sessions fetch failed:', err);
    return Response.json({ error: 'Google Fit API error', detail: err }, { status: 502 });
  }

  const sessionsData = await sessionsRes.json();
  const sessions = sessionsData.session || [];
  console.log(`[googleFitWebhook] Found ${sessions.length} sessions for ${targetEmail}`);

  // ── Fetch aggregate data (calories + steps) ──────────────────────────────
  const aggregatePayload = {
    aggregateBy: [
      { dataTypeName: 'com.google.calories.expended' },
      { dataTypeName: 'com.google.step_count.delta'  },
      { dataTypeName: 'com.google.heart_rate.bpm'    },
    ],
    bucketByTime: { durationMillis: 86400000 }, // 1-day buckets
    startTimeMillis: startMs,
    endTimeMillis:   endMs,
  };

  const aggRes = await fetch(`${GOOGLE_FIT_BASE}/dataset:aggregate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(aggregatePayload),
  });

  let dailyCalories = 0, dailySteps = 0, avgHR = 0;
  if (aggRes.ok) {
    const aggData = await aggRes.json();
    const buckets = aggData.bucket || [];
    buckets.forEach(b => {
      (b.dataset || []).forEach(ds => {
        (ds.point || []).forEach(p => {
          const val = p.value?.[0]?.fpVal ?? p.value?.[0]?.intVal ?? 0;
          if (ds.dataSourceId?.includes('calories')) dailyCalories += val;
          if (ds.dataSourceId?.includes('step_count')) dailySteps += val;
          if (ds.dataSourceId?.includes('heart_rate')) avgHR = val; // last value
        });
      });
    });
  }

  // ── Sync sessions → TrainingSession entity ───────────────────────────────
  const existingSessions = await base44.asServiceRole.entities.TrainingSession.filter({
    created_by: targetEmail,
  });
  const existingDates = new Set(existingSessions.map(s => s.date));

  let syncedCount = 0;
  for (const s of sessions) {
    const sessionDate = new Date(parseInt(s.startTimeMillis)).toISOString().split('T')[0];
    const durationMs  = parseInt(s.endTimeMillis) - parseInt(s.startTimeMillis);
    const durationMin = msToMinutes(durationMs);
    if (durationMin < 5) continue; // skip micro-sessions

    const sessionType = mapActivityType(s.activityType);
    const dedupeKey   = `${sessionDate}-${sessionType}`;

    // Skip if we already have a session of this type on this date
    if (existingDates.has(sessionDate)) {
      console.log(`[googleFitWebhook] Skipping duplicate: ${dedupeKey}`);
      continue;
    }

    const intensity = intensityFromCalories(dailyCalories, durationMin);

    await base44.asServiceRole.entities.TrainingSession.create({
      date:             sessionDate,
      session_type:     sessionType,
      duration_minutes: durationMin,
      intensity,
      session_notes:    `Auto-synced from Google Fit: ${s.name || 'Activity'}`,
      created_by:       targetEmail,
    });

    existingDates.add(sessionDate);
    syncedCount++;
    console.log(`[googleFitWebhook] Created session: ${sessionType} on ${sessionDate} (${durationMin} min)`);
  }

  // ── Auto-populate WellnessLog if today not logged ─────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const existingWellness = await base44.asServiceRole.entities.WellnessLog.filter({
    user_email: targetEmail,
    log_date: today,
  });

  let wellnessUpdated = false;
  if (existingWellness.length === 0 && (dailySteps > 0 || dailyCalories > 0)) {
    // Derive a rough readiness score from steps/calories
    const stepScore    = Math.min(100, Math.round((dailySteps / 10000) * 40));
    const calScore     = Math.min(60,  Math.round((dailyCalories / 500) * 60));
    const readiness    = stepScore + calScore;

    await base44.asServiceRole.entities.WellnessLog.create({
      user_email:      targetEmail,
      log_date:        today,
      readiness_score: readiness,
      notes:           `Auto-populated from Google Fit. Steps: ${Math.round(dailySteps).toLocaleString()}, Calories: ${Math.round(dailyCalories)} kcal`,
    });
    wellnessUpdated = true;
    console.log(`[googleFitWebhook] WellnessLog auto-populated. Readiness: ${readiness}%`);
  }

  // ── Update UserProfile workload metrics ───────────────────────────────────
  const profiles = await base44.asServiceRole.entities.UserProfile.filter({ created_by: targetEmail });
  let workloadUpdated = false;

  if (profiles.length > 0) {
    const profile = profiles[0];
    const totalMinutes = (profile.lifetime_minutes || 0) + sessions.reduce((sum, s) => {
      return sum + msToMinutes(parseInt(s.endTimeMillis) - parseInt(s.startTimeMillis));
    }, 0);
    const totalWorkouts = (profile.lifetime_workouts || 0) + syncedCount;

    await base44.asServiceRole.entities.UserProfile.update(profile.id, {
      lifetime_minutes:  totalMinutes,
      lifetime_workouts: totalWorkouts,
      last_workout_date: today,
    });
    workloadUpdated = true;
    console.log(`[googleFitWebhook] UserProfile updated. Total minutes: ${totalMinutes}`);
  }

  return Response.json({
    success: true,
    user: targetEmail,
    synced_sessions: syncedCount,
    workload_updated: workloadUpdated,
    wellness_updated: wellnessUpdated,
    summary: {
      sessions_found:   sessions.length,
      sessions_created: syncedCount,
      daily_calories:   Math.round(dailyCalories),
      daily_steps:      Math.round(dailySteps),
      avg_heart_rate:   Math.round(avgHR),
    },
    apple_health_note: 'Apple Health has no public OAuth API for web apps. HealthKit is iOS-only. Export Apple Health data as XML and use the data import feature.',
    synced_at: new Date().toISOString(),
  });
});