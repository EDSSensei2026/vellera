import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json().catch(() => ({}));
  const { code, state: userEmail } = body;

  if (!code || !userEmail) return Response.json({ error: 'Missing code or state' }, { status: 400 });

  const clientId = Deno.env.get('POLAR_CLIENT_ID');
  const clientSecret = Deno.env.get('POLAR_CLIENT_SECRET');
  const redirectUri = 'https://api.base44.com/api/apps/69c722c665db36b41f55ba9c/functions/polarOAuthCallback';

  const tokenRes = await fetch('https://polarremote.com/v2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      Accept: 'application/json',
    },
    body: new URLSearchParams({ code, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
  });
  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) return Response.json({ error: 'Token exchange failed', details: tokenData }, { status: 400 });

  // Register user with Polar Accesslink
  await fetch('https://www.polaraccesslink.com/v3/users', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenData.access_token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ 'member-id': userEmail }),
  });

  const existing = await base44.asServiceRole.entities.WearableToken.filter({ provider: 'polar', user_email: userEmail });
  const payload = {
    provider: 'polar',
    user_email: userEmail,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token || '',
    expires_at: Date.now() + (tokenData.expires_in || 3600) * 1000,
    provider_user_id: String(tokenData.x_user_id || ''),
    last_synced: new Date().toISOString(),
  };

  if (existing[0]) {
    await base44.asServiceRole.entities.WearableToken.update(existing[0].id, payload);
  } else {
    await base44.asServiceRole.entities.WearableToken.create(payload);
  }

  return new Response('<html><body><script>window.close();</script><p>Polar connected! You can close this window.</p></body></html>', {
    headers: { 'Content-Type': 'text/html' },
  });
});