import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json().catch(() => ({}));
  const { code, state: userEmail } = body;

  if (!code || !userEmail) return Response.json({ error: 'Missing code or state' }, { status: 400 });

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: Deno.env.get('GOOGLE_FIT_CLIENT_ID'),
      client_secret: Deno.env.get('GOOGLE_FIT_CLIENT_SECRET'),
      redirect_uri: 'https://api.base44.com/api/apps/69c722c665db36b41f55ba9c/functions/googleFitOAuthCallback',
      grant_type: 'authorization_code',
    }),
  });
  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) return Response.json({ error: 'Token exchange failed', details: tokenData }, { status: 400 });

  const existing = await base44.asServiceRole.entities.WearableToken.filter({ provider: 'google_fit', user_email: userEmail });
  const payload = {
    provider: 'google_fit',
    user_email: userEmail,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token || '',
    expires_at: Date.now() + (tokenData.expires_in || 3600) * 1000,
    last_synced: new Date().toISOString(),
  };

  if (existing[0]) {
    await base44.asServiceRole.entities.WearableToken.update(existing[0].id, payload);
  } else {
    await base44.asServiceRole.entities.WearableToken.create(payload);
  }

  return new Response('<html><body><script>window.close();</script><p>Google Fit connected! You can close this window.</p></body></html>', {
    headers: { 'Content-Type': 'text/html' },
  });
});