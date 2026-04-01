import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const tokens = await base44.asServiceRole.entities.WearableToken.filter({ provider: 'google_fit', user_email: user.email });
  if (!tokens[0]) return Response.json({ error: 'Google Fit not connected' }, { status: 400 });

  let token = tokens[0];

  // Refresh if expired
  if (Date.now() > token.expires_at) {
    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_FIT_CLIENT_ID'),
        client_secret: Deno.env.get('GOOGLE_FIT_CLIENT_SECRET'),
        refresh_token: token.refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    const refreshData = await refreshRes.json();
    await base44.asServiceRole.entities.WearableToken.update(token.id, {
      access_token: refreshData.access_token,
      expires_at: Date.now() + (refreshData.expires_in || 3600) * 1000,
    });
    token = { ...token, access_token: refreshData.access_token };
  }

  const endTime = Date.now();
  const startTime = endTime - 7 * 86400000;

  const fitRes = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      aggregateBy: [
        { dataTypeName: 'com.google.step_count.delta' },
        { dataTypeName: 'com.google.heart_rate.bpm' },
        { dataTypeName: 'com.google.calories.expended' },
      ],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis: startTime,
      endTimeMillis: endTime,
    }),
  });
  const fitData = await fitRes.json();

  let synced = 0;
  for (const bucket of fitData.bucket || []) {
    const date = new Date(parseInt(bucket.startTimeMillis)).toISOString().split('T')[0];
    let steps = null, heartRate = null, calories = null;

    for (const ds of bucket.dataset || []) {
      for (const point of ds.point || []) {
        if (ds.dataSourceId?.includes('step_count')) steps = (steps || 0) + (point.value?.[0]?.intVal || 0);
        if (ds.dataSourceId?.includes('heart_rate')) heartRate = point.value?.[0]?.fpVal || heartRate;
        if (ds.dataSourceId?.includes('calories')) calories = (calories || 0) + (point.value?.[0]?.fpVal || 0);
      }
    }

    if (!steps && !heartRate && !calories) continue;

    const existing = await base44.asServiceRole.entities.BiometricLog.filter({ date, user_email: user.email });
    const data = { date, user_email: user.email, source: 'google_fit', steps, heart_rate_avg: heartRate ? Math.round(heartRate) : null, active_calories: calories ? Math.round(calories) : null };

    if (existing[0]) {
      await base44.asServiceRole.entities.BiometricLog.update(existing[0].id, data);
    } else {
      await base44.asServiceRole.entities.BiometricLog.create(data);
    }
    synced++;
  }

  await base44.asServiceRole.entities.WearableToken.update(token.id, { last_synced: new Date().toISOString() });
  return Response.json({ success: true, synced, provider: 'google_fit' });
});