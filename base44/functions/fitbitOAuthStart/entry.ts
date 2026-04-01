import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = Deno.env.get('FITBIT_CLIENT_ID');
  const redirectUri = 'https://api.base44.com/api/apps/69c722c665db36b41f55ba9c/functions/fitbitOAuthCallback';
  const scope = 'activity heartrate sleep profile';

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
    state: user.email,
  });

  return Response.json({ url: `https://www.fitbit.com/oauth2/authorize?${params}` });
});