import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const tokens = await base44.asServiceRole.entities.WearableToken.filter({ provider: 'fitbit', user_email: user.email });
  if (!tokens[0]) return Response.json({ error: 'Fitbit not connected' }, { status: 400 });

  let token = tokens[0];

  // Refresh if expired
  if (Date.now() > token.expires_at) {
    const clientId = Deno.env.get('FITBIT_CLIENT_ID');
    const clientSecret = Deno.env.get('FITBIT_CLIENT_SECRET');
    const refreshRes = await fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: token.refresh_token }),
    });
    const refreshData = await refreshRes.json();
    await base44.asServiceRole.entities.WearableToken.update(token.id, {
      access_token: refreshData.access_token,
      refresh_token: refreshData.refresh_token,
      expires_at: Date.now() + (refreshData.expires_in || 28800) * 1000,
    });
    token = { ...token, access_token: refreshData.access_token };
  }

  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const [actRes, hrRes, sleepRes] = await Promise.all([
    fetch(`https://api.fitbit.com/1/user/-/activities/date/${today}.json`, { headers: { Authorization: `Bearer ${token.access_token}` } }),
    fetch(`https://api.fitbit.com/1/user/-/activities/heart/date/${weekAgo}/${today}.json`, { headers: { Authorization: `Bearer ${token.access_token}` } }),
    fetch(`https://api.fitbit.com/1.2/user/-/sleep/date/${weekAgo}/${today}.json`, { headers: { Authorization: `Bearer ${token.access_token}` } }),
  ]);

  const [actData, hrData, sleepData] = await Promise.all([actRes.json(), hrRes.json(), sleepRes.json()]);

  // Build a map per date
  const dateMap = {};
  const addDate = (date) => { if (!dateMap[date]) dateMap[date] = {}; };

  // Activities (today only from this endpoint)
  if (actData.summary) {
    addDate(today);
    dateMap[today].steps = actData.summary.steps || null;
    dateMap[today].active_calories = actData.summary.caloriesOut || null;
  }

  // Heart rate by day
  for (const entry of hrData['activities-heart'] || []) {
    addDate(entry.dateTime);
    const resting = entry.value?.restingHeartRate;
    if (resting) dateMap[entry.dateTime].resting_hr = resting;
  }

  // Sleep by day
  for (const entry of sleepData.sleep || []) {
    const date = entry.dateOfSleep;
    addDate(date);
    dateMap[date].sleep_minutes = entry.minutesAsleep || null;
    dateMap[date].sleep_performance = entry.efficiency || null;
  }

  let synced = 0;
  for (const [date, vals] of Object.entries(dateMap)) {
    const existing = await base44.asServiceRole.entities.BiometricLog.filter({ date, user_email: user.email });
    const data = { date, user_email: user.email, source: 'fitbit', ...vals };
    if (existing[0]) {
      await base44.asServiceRole.entities.BiometricLog.update(existing[0].id, data);
    } else {
      await base44.asServiceRole.entities.BiometricLog.create(data);
    }
    synced++;
  }

  await base44.asServiceRole.entities.WearableToken.update(token.id, { last_synced: new Date().toISOString() });
  return Response.json({ success: true, synced, provider: 'fitbit' });
});