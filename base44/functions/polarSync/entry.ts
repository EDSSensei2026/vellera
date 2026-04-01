import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const tokens = await base44.asServiceRole.entities.WearableToken.filter({ provider: 'polar', user_email: user.email });
  if (!tokens[0]) return Response.json({ error: 'Polar not connected' }, { status: 400 });

  const token = tokens[0];

  // Create a transaction to pull new exercise data
  const txRes = await fetch('https://www.polaraccesslink.com/v3/users/transaction', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token.access_token}`, Accept: 'application/json' },
  });

  if (txRes.status === 204) {
    return Response.json({ success: true, synced: 0, message: 'No new data', provider: 'polar' });
  }

  const txData = await txRes.json();
  const txId = txData['transaction-id'];
  if (!txId) return Response.json({ success: true, synced: 0, provider: 'polar' });

  // List exercises in this transaction
  const listRes = await fetch(`https://www.polaraccesslink.com/v3/users/transaction/${txId}`, {
    headers: { Authorization: `Bearer ${token.access_token}`, Accept: 'application/json' },
  });
  const listData = await listRes.json();

  let synced = 0;
  for (const exerciseUrl of listData.exercises || []) {
    const exRes = await fetch(exerciseUrl, {
      headers: { Authorization: `Bearer ${token.access_token}`, Accept: 'application/json' },
    });
    const ex = await exRes.json();
    const date = ex['start-time']?.split('T')[0];
    if (!date) continue;

    const existing = await base44.asServiceRole.entities.BiometricLog.filter({ date, user_email: user.email });
    const data = {
      date,
      user_email: user.email,
      source: 'polar',
      heart_rate_avg: ex['heart-rate']?.average || null,
      heart_rate_max: ex['heart-rate']?.maximum || null,
      active_calories: ex['calories'] || null,
    };

    if (existing[0]) {
      await base44.asServiceRole.entities.BiometricLog.update(existing[0].id, data);
    } else {
      await base44.asServiceRole.entities.BiometricLog.create(data);
    }
    synced++;
  }

  // Commit transaction
  await fetch(`https://www.polaraccesslink.com/v3/users/transaction/${txId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token.access_token}` },
  });

  await base44.asServiceRole.entities.WearableToken.update(token.id, { last_synced: new Date().toISOString() });
  return Response.json({ success: true, synced, provider: 'polar' });
});