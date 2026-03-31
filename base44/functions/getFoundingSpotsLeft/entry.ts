import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const FOUNDING_ATHLETE_CAP = 1000;

Deno.serve(async (req) => {
  if (req.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);

    // Get current config
    const configs = await base44.asServiceRole.entities.System_Config.filter(
      { config_key: "founding_athlete" }
    );

    let currentCount = 0;
    if (configs.length > 0) {
      currentCount = configs[0].founding_athlete_count || 0;
    }

    const spotsLeft = Math.max(0, FOUNDING_ATHLETE_CAP - currentCount);
    const percentFilled = Math.round((currentCount / FOUNDING_ATHLETE_CAP) * 100);

    return Response.json({
      success: true,
      spots_sold: currentCount,
      spots_total: FOUNDING_ATHLETE_CAP,
      spots_left: spotsLeft,
      percent_filled: percentFilled,
      is_sold_out: spotsLeft === 0,
      urgency_message: spotsLeft > 0 ? `Only ${spotsLeft} spots left!` : "Sold out",
    });
  } catch (error) {
    console.error("[getFoundingSpotsLeft Error]", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});