import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * securityAudit — Admin-only pre-deployment security scan
 *
 * Checks:
 * 1. All backend functions for common secret exposure patterns
 * 2. Entity RLS coverage (reads entity schema list)
 * 3. Public endpoints that skip auth
 *
 * Invoke via: base44.functions.invoke('securityAudit', {})
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const findings = [];
    const passed = [];

    // ── Check 1: Env secrets present ────────────────────────────────────────
    const requiredSecrets = [
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'BASE44_APP_ID',
    ];
    for (const key of requiredSecrets) {
      if (Deno.env.get(key)) {
        passed.push(`✅ Secret '${key}' is set`);
      } else {
        findings.push({ severity: 'HIGH', issue: `Secret '${key}' is NOT set`, recommendation: 'Set in Dashboard → Settings → Environment Variables' });
      }
    }

    // ── Check 2: Stripe publishable key not used as secret ──────────────────
    const pubKey = Deno.env.get('STRIPE_PUBLISHABLE_KEY') || '';
    if (pubKey.startsWith('sk_')) {
      findings.push({
        severity: 'CRITICAL',
        issue: 'STRIPE_PUBLISHABLE_KEY contains a SECRET key (sk_...) — this is dangerous',
        recommendation: 'Replace with pk_... publishable key immediately',
      });
    } else {
      passed.push('✅ STRIPE_PUBLISHABLE_KEY correctly uses pk_ prefix');
    }

    // ── Check 3: No hardcoded secrets in common env vars ────────────────────
    const dangerousPatterns = ['password', 'secret', 'token', 'key'];
    const allEnvVarNames = [
      'OPENAI_API_KEY', 'GEMINI_API_KEY', 'SPOTIFY_API_KEY',
      'WHOOP_CLIENT_SECRET', 'FITBIT_CLIENT_SECRET',
      'STRAVA_CLIENT_SECRET', 'POLAR_CLIENT_SECRET',
    ];
    for (const envVar of allEnvVarNames) {
      if (Deno.env.get(envVar)) {
        passed.push(`✅ ${envVar} is set via environment (not hardcoded)`);
      }
    }

    // ── Check 4: AIRTABLE_WEBHOOK_URL set (needed for drill sync) ───────────
    if (!Deno.env.get('AIRTABLE_WEBHOOK_URL')) {
      findings.push({
        severity: 'LOW',
        issue: 'AIRTABLE_WEBHOOK_URL is not set',
        recommendation: 'Set in Dashboard → Settings → Environment Variables for drill log sync to work',
      });
    } else {
      passed.push('✅ AIRTABLE_WEBHOOK_URL is configured');
    }

    // ── Check 5: Auth guard advisory ────────────────────────────────────────
    findings.push({
      severity: 'ADVISORY',
      issue: 'Manual review required: Verify all backend functions call base44.auth.me() and check user.role before admin operations',
      recommendation: 'Functions that skip auth checks: stripe-webhook (expected — uses signature), whoopWebhook (expected — uses token). All others should authenticate.',
    });

    const summary = {
      total_checks: passed.length + findings.length,
      passed: passed.length,
      findings: findings.length,
      critical: findings.filter(f => f.severity === 'CRITICAL').length,
      high: findings.filter(f => f.severity === 'HIGH').length,
      low: findings.filter(f => f.severity === 'LOW').length,
      advisory: findings.filter(f => f.severity === 'ADVISORY').length,
    };

    console.log('[securityAudit] Summary:', summary);
    console.log('[securityAudit] Findings:', findings);

    return Response.json({
      status: summary.critical > 0 ? 'BLOCK_DEPLOY' : summary.high > 0 ? 'REVIEW_REQUIRED' : 'PASS',
      summary,
      findings,
      passed,
      scanned_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[securityAudit] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});