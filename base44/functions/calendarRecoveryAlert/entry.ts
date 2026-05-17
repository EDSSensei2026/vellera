import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Keywords that identify training/martial arts events
const TRAINING_KEYWORDS = [
  'bjj', 'jiu-jitsu', 'jiu jitsu', 'drill', 'sparring', 'grappling',
  'striking', 'wrestling', 'martial arts', 'training', 'workout',
  'strength', 'conditioning', 'combat', 'bag work', 'mma', 'boxing',
  'muay thai', 'kickboxing', 'takedown', 'vellera',
  'ep drill', 'pistol draw', 'ruck', 'extraction', 'tactical', 'stress inoculation'
];

// EP/tactical keywords for more specific suggestions
const EP_KEYWORDS = ['ep drill', 'pistol', 'ruck', 'extraction', 'tactical', 'stress inoculation', 'combative', 'ambush'];

function isTrainingEvent(event) {
  const text = `${event.summary || ''} ${event.description || ''}`.toLowerCase();
  return TRAINING_KEYWORDS.some(kw => text.includes(kw));
}

function isEPEvent(event) {
  const text = `${event.summary || ''} ${event.description || ''}`.toLowerCase();
  return EP_KEYWORDS.some(kw => text.includes(kw));
}

const INTENSITY_ZONES = [
  { min: 0,  max: 33,  label: "Rest / Recovery Only",    icon: "🛑", nextSession: "Rest or passive mobility only. No tactical drills tomorrow." },
  { min: 34, max: 50,  label: "Technique Only",           icon: "🟡", nextSession: "Dry-fire and slow EP footwork only. No loaded movement or stress circuits." },
  { min: 51, max: 67,  label: "Moderate Training",        icon: "🟢", nextSession: "Moderate EP session OK — threat scanning, VIP extraction drills. Skip stress inoculation." },
  { min: 68, max: 84,  label: "Full Training Green",      icon: "⚡", nextSession: "Full EP session cleared. Pistol draw, combatives, and pack carry are all green." },
  { min: 85, max: 100, label: "Peak Performance Day",     icon: "🏆", nextSession: "Peak output day. Run your most demanding stress inoculation or vehicle ambush circuit." },
];

function getZone(score) {
  return INTENSITY_ZONES.find(z => score >= z.min && score <= z.max) || INTENSITY_ZONES[0];
}

function getRecoveryMessage(event, biometrics) {
  const title = event.summary || 'Training session';
  const endTime = event.end?.dateTime ? new Date(event.end.dateTime) : null;
  const durationMs = endTime && event.start?.dateTime
    ? endTime - new Date(event.start.dateTime)
    : null;
  const durationMin = durationMs ? Math.round(durationMs / 60000) : null;
  const ep = isEPEvent(event);

  const lines = [
    `✅ ${title} completed${durationMin ? ` (${durationMin} min)` : ''}.`,
    ``,
  ];

  if (biometrics) {
    const { recovery_pct, hrv, resting_hr, sleep_performance, body_battery } = biometrics;
    const zone = recovery_pct != null ? getZone(recovery_pct) : null;

    lines.push(`📊 Your Biometrics Right Now:`);
    if (recovery_pct != null) lines.push(`• Recovery: ${recovery_pct}%${zone ? ` — ${zone.icon} ${zone.label}` : ''}`);
    if (hrv != null)           lines.push(`• HRV: ${hrv} ms`);
    if (resting_hr != null)    lines.push(`• Resting HR: ${resting_hr} bpm`);
    if (sleep_performance != null) lines.push(`• Sleep Performance: ${sleep_performance}%`);
    if (body_battery != null)  lines.push(`• Body Battery: ${body_battery}`);
    lines.push(``);

    if (zone) {
      lines.push(`🎯 Next Session Recommendation:`);
      lines.push(`• ${zone.nextSession}`);
      lines.push(``);

      if (recovery_pct < 50) {
        lines.push(`⚠️ Low recovery detected. Consider scaling back tomorrow's ${ep ? 'EP/tactical' : 'training'} load.`);
        lines.push(``);
      }
    }
  }

  lines.push(`🔁 Immediate Recovery Actions:`);
  lines.push(`• Consume 20–40g protein within 30 min`);
  lines.push(`• Rehydrate: drink 16–24 oz water now`);
  if (ep) {
    lines.push(`• 10 min mobility: hip flexors, shoulders, thoracic spine (critical for EP load bearing)`);
  } else {
    lines.push(`• Light stretching or mobility (10 min)`);
  }
  lines.push(`• Log this session in Vellera for tracking`);
  lines.push(``);
  lines.push(`💤 Prioritize 7–9 hours of sleep tonight for optimal adaptation.`);

  return lines.join('\n');
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json();

  // Google Calendar webhooks only signal a change — fetch recent events using incremental sync
  const state = body?.data?._provider_meta?.['x-goog-resource-state'];
  if (state === 'sync') return Response.json({ status: 'sync_ack' });

  const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
  const authHeader = { Authorization: `Bearer ${accessToken}` };

  // Load sync token
  const existing = await base44.asServiceRole.entities.SyncState.filter({ key: 'recovery_alert_sync' });
  const syncRecord = existing.length > 0 ? existing[0] : null;

  const now = new Date();
  let url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=50&singleEvents=true';
  if (syncRecord?.sync_token) {
    url += `&syncToken=${encodeURIComponent(syncRecord.sync_token)}`;
  } else {
    // First run: only look at events in the past 24 hours
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    url += `&timeMin=${encodeURIComponent(since)}`;
  }

  let res = await fetch(url, { headers: authHeader });

  // syncToken expired — do a full fresh sync
  if (res.status === 410) {
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=50&singleEvents=true&timeMin=${encodeURIComponent(since)}`;
    res = await fetch(url, { headers: authHeader });
  }

  if (!res.ok) {
    console.error('Calendar API error:', await res.text());
    return Response.json({ status: 'api_error' }, { status: 200 });
  }

  const allItems = [];
  let pageData = await res.json();
  let newSyncToken = null;

  while (true) {
    allItems.push(...(pageData.items || []));
    if (pageData.nextSyncToken) newSyncToken = pageData.nextSyncToken;
    if (!pageData.nextPageToken) break;
    const nextRes = await fetch(url + `&pageToken=${pageData.nextPageToken}`, { headers: authHeader });
    if (!nextRes.ok) break;
    pageData = await nextRes.json();
  }

  // Save sync token
  if (newSyncToken) {
    if (syncRecord) {
      await base44.asServiceRole.entities.SyncState.update(syncRecord.id, {
        sync_token: newSyncToken,
        last_synced: now.toISOString(),
      });
    } else {
      await base44.asServiceRole.entities.SyncState.create({
        key: 'recovery_alert_sync',
        sync_token: newSyncToken,
        last_synced: now.toISOString(),
      });
    }
  }

  // Find training events that have just ended (within the last 2 hours)
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const completedTraining = allItems.filter(event => {
    if (event.status === 'cancelled') return false;
    const endTime = event.end?.dateTime ? new Date(event.end.dateTime) : null;
    if (!endTime) return false;
    // Event ended in the past 2 hours
    return endTime >= twoHoursAgo && endTime <= now && isTrainingEvent(event);
  });

  console.log(`Found ${allItems.length} changed events, ${completedTraining.length} completed training events`);

  // Fetch today's biometric log (service role, most recent entry for today)
  const today = now.toISOString().split('T')[0];
  let biometrics = null;
  try {
    const bioLogs = await base44.asServiceRole.entities.BiometricLog.filter({ date: today });
    if (bioLogs.length > 0) {
      const b = bioLogs[0];
      biometrics = {
        recovery_pct: b.recovery_pct ?? null,
        hrv: b.hrv ?? null,
        resting_hr: b.rhr ?? null,       // entity field is 'rhr'
        sleep_performance: b.sleep_performance ?? null,
        body_battery: b.body_battery ?? null,
        strain: b.strain ?? null,
      };
      console.log(`Biometrics found for ${today}: recovery=${biometrics.recovery_pct}%, HRV=${biometrics.hrv}ms`);
    } else {
      console.log(`No biometric log found for ${today} — alerts will use generic recovery message`);
    }
  } catch (err) {
    console.error('Failed to fetch biometrics:', err.message);
  }

  // Create a recovery alert for each completed training event
  for (const event of completedTraining) {
    const message = getRecoveryMessage(event, biometrics);
    const alertKey = `recovery_${event.id}_${event.end?.dateTime}`;

    // Avoid duplicate alerts
    const dupCheck = await base44.asServiceRole.entities.RecoveryAlert.filter({ description: alertKey });
    if (dupCheck.length > 0) {
      console.log(`Skipping duplicate alert for event: ${event.summary}`);
      continue;
    }

    const durationMs = event.end?.dateTime && event.start?.dateTime
      ? new Date(event.end.dateTime) - new Date(event.start.dateTime)
      : null;
    const durationMin = durationMs ? Math.round(durationMs / 60000) : null;

    await base44.asServiceRole.entities.RecoveryAlert.create({
      event_title: event.summary || 'Training Session',
      event_id: event.id,
      event_end_time: event.end.dateTime,
      alert_message: message,
      duration_minutes: durationMin,
      acknowledged: false,
      description: alertKey,
    });

    console.log(`Recovery alert created for: ${event.summary}`);
  }

  return Response.json({
    status: 'ok',
    events_scanned: allItems.length,
    alerts_triggered: completedTraining.length,
  });
});