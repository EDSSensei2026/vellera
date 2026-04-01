import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const tokens = await base44.asServiceRole.entities.WearableToken.filter({ provider: 'strava', user_email: user.email });
  if (!tokens[0]) return Response.json({ error: 'Strava not connected' }, { status: 400 });

  let token = tokens[0];

  // Refresh if expired
  if (Date.now() > token.expires_at) {
    const refreshRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: Deno.env.get('STRAVA_CLIENT_ID'),
        client_secret: Deno.env.get('STRAVA_CLIENT_SECRET'),
        refresh_token: token.refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    const refreshData = await refreshRes.json();
    await base44.asServiceRole.entities.WearableToken.update(token.id, {
      access_token: refreshData.access_token,
      refresh_token: refreshData.refresh_token,
      expires_at: refreshData.expires_at * 1000,
    });
    token = { ...token, access_token: refreshData.access_token };
  }

  // Fetch recent activities (last 7 days)
  const after = Math.floor((Date.now() - 7 * 86400000) / 1000);
  const activitiesRes = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=30`, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const activities = await activitiesRes.json();

  // Upsert into BiometricLog
  let synced = 0;
  for (const act of activities) {
    const date = act.start_date_local?.split('T')[0];
    if (!date) continue;
    const existing = await base44.asServiceRole.entities.BiometricLog.filter({ date, user_email: user.email });
    const data = {
      date,
      user_email: user.email,
      source: 'strava',
      active_calories: act.calories || null,
      heart_rate_avg: act.average_heartrate || null,
      heart_rate_max: act.max_heartrate || null,
      steps: null,
      notes: `${act.name} — ${Math.round((act.distance || 0) / 1000 * 0.621)}mi`,
    };
    if (existing[0]) {
      await base44.asServiceRole.entities.BiometricLog.update(existing[0].id, data);
    } else {
      await base44.asServiceRole.entities.BiometricLog.create(data);
    }
    synced++;
  }

  await base44.asServiceRole.entities.WearableToken.update(token.id, { last_synced: new Date().toISOString() });

  return Response.json({ success: true, synced, provider: 'strava' });
});