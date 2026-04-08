import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const BETA_USER_LIMIT = 1000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Count all registered users using service role
    const users = await base44.asServiceRole.entities.User.list('-created_date', 1100);
    const count = users.length;

    return Response.json({
      count,
      limit: BETA_USER_LIMIT,
      is_open: count < BETA_USER_LIMIT,
      spots_remaining: Math.max(0, BETA_USER_LIMIT - count),
    });
  } catch (error) {
    console.error('checkBetaLimit error:', error.message);
    // On error, allow access so we don't accidentally lock out users
    return Response.json({ count: 0, limit: BETA_USER_LIMIT, is_open: true, spots_remaining: BETA_USER_LIMIT });
  }
});