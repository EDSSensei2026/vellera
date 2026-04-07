import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const CLIENT_ID = Deno.env.get("WHOOP_CLIENT_ID");
const REDIRECT_URI = "https://api.base44.com/api/apps/69c722c665db36b41f55ba9c/functions/whoopOAuthCallback";
const SCOPES = "read:recovery read:sleep read:workout read:cycles read:body_measurement offline";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Encode email as base64 JSON state (simple, no DB needed)
  const state = btoa(JSON.stringify({ email: user.email }));

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPES,
    state,
  });

  const authUrl = `https://api.prod.whoop.com/oauth/oauth2/auth?${params}`;
  return Response.json({ url: authUrl });
});