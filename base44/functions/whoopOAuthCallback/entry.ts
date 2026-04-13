import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const CLIENT_ID = Deno.env.get("WHOOP_CLIENT_ID");
const CLIENT_SECRET = Deno.env.get("WHOOP_CLIENT_SECRET");
const REDIRECT_URI = "https://api.base44.com/api/apps/69c722c665db36b41f55ba9c/functions/whoopOAuthCallback";
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Escape HTML to prevent reflected XSS in error responses
const escapeHtml = (s) => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

// Verify HMAC-signed state token — rejects forged/replayed states
async function verifySignedState(rawState) {
  try {
    const { p: payload, s: sig } = JSON.parse(atob(decodeURIComponent(rawState)));
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(Deno.env.get('BASE44_APP_ID') || 'vellera'),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
    const sigBytes = new Uint8Array(sig.match(/.{2}/g).map(b => parseInt(b, 16)));
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(payload));
    if (!valid) return null;
    const data = JSON.parse(payload);
    if (Date.now() - data.ts > STATE_TTL_MS) return null;
    return data;
  } catch (_) {
    return null;
  }
}

function errorPage(msg) {
  return new Response(
    `<html><head><title>Error</title></head><body><script>window.close();</script><p>Connection failed: ${escapeHtml(msg)}</p></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error || !code) return errorPage(error || 'no code');
  if (!state) return new Response("Missing state", { status: 400 });

  // Verify HMAC-signed state — rejects CSRF and forged states
  const base44 = createClientFromRequest(req);
  const stateData = await verifySignedState(state);
  if (!stateData?.email) {
    console.error('[whoopOAuthCallback] Invalid or expired state token');
    return new Response("Invalid or expired state token", { status: 401 });
  }
  const userEmail = stateData.email;

  // Exchange code for tokens
  const tokenRes = await fetch("https://api.prod.whoop.com/oauth/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error('[whoopOAuthCallback] Token exchange failed:', err);
    return new Response(`Token exchange failed`, { status: 500 });
  }

  const tokens = await tokenRes.json();
  const expiresAt = Date.now() + (tokens.expires_in * 1000);

  // Get Whoop user ID
  const profileRes = await fetch("https://api.prod.whoop.com/developer/v1/user/profile/basic", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const profile = profileRes.ok ? await profileRes.json() : {};

  // Upsert token record
  const existing = await base44.asServiceRole.entities.WhoopToken.filter({ user_email: userEmail });
  const tokenPayload = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: expiresAt,
    whoop_user_id: String(profile.user_id || ""),
    last_synced: new Date().toISOString(),
  };

  if (existing.length > 0) {
    await base44.asServiceRole.entities.WhoopToken.update(existing[0].id, tokenPayload);
  } else {
    await base44.asServiceRole.entities.WhoopToken.create({ user_email: userEmail, ...tokenPayload });
  }

  console.log(`[whoopOAuthCallback] Connected Whoop for ${userEmail}`);

  return new Response(
    `<html><head><title>Connected</title></head><body><script>
      if (window.opener) { window.opener.postMessage('whoop_connected', '*'); window.close(); }
      else { window.location.href = '/'; }
    </script><p>Whoop connected! You can close this tab.</p></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
});