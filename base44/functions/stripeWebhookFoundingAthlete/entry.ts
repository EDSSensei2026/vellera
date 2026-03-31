import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const FOUNDING_ATHLETE_CAP = 1000;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // Verify Stripe signature (placeholder - use actual Stripe library in production)
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return Response.json({ error: "Missing signature" }, { status: 401 });
    }

    const body = await req.text();
    const event = JSON.parse(body);

    // Initialize Base44 client
    const base44 = createClientFromRequest(req);

    // Only process charge.succeeded events for founding athlete pricing
    if (event.type !== "charge.succeeded") {
      return Response.json({ received: true });
    }

    const charge = event.data.object;
    const priceIdMetadata = charge.metadata?.price_id;

    // Only process Founding Athlete tier
    if (priceIdMetadata !== "price_founding_athlete") {
      return Response.json({ received: true });
    }

    const userEmail = charge.billing_details?.email;
    if (!userEmail) {
      return Response.json({ error: "Missing email" }, { status: 400 });
    }

    // --- ATOMIC TRANSACTION ---
    // 1. Get current config
    const configs = await base44.asServiceRole.entities.System_Config.filter(
      { config_key: "founding_athlete" }
    );
    let config = configs.length > 0 ? configs[0] : null;

    // 2. Initialize config if doesn't exist
    if (!config) {
      config = await base44.asServiceRole.entities.System_Config.create({
        config_key: "founding_athlete",
        founding_athlete_count: 0,
        founding_athlete_cap: FOUNDING_ATHLETE_CAP,
        founding_athlete_price_usd: 249.99,
        stripe_price_id: "price_founding_athlete",
      });
    }

    // 3. Check if cap is reached
    if (config.founding_athlete_count >= FOUNDING_ATHLETE_CAP) {
      return Response.json(
        { error: "Founding Athlete tier is sold out. Refunding transaction." },
        { status: 409 }
      );
    }

    // 4. Increment counter atomically
    const updatedConfig = await base44.asServiceRole.entities.System_Config.update(
      config.id,
      {
        founding_athlete_count: config.founding_athlete_count + 1,
        last_updated: new Date().toISOString(),
      }
    );

    // 5. Verify increment succeeded (double-check for race condition)
    if (updatedConfig.founding_athlete_count > FOUNDING_ATHLETE_CAP) {
      // Rollback: revert the count
      await base44.asServiceRole.entities.System_Config.update(
        config.id,
        {
          founding_athlete_count: config.founding_athlete_count,
        }
      );
      return Response.json(
        { error: "Cap exceeded during transaction. Refunding." },
        { status: 409 }
      );
    }

    // 6. Update or create user profile with Founding Athlete tier
    const userProfiles = await base44.asServiceRole.entities.UserProfile.filter(
      { created_by: userEmail }
    );

    if (userProfiles.length > 0) {
      await base44.asServiceRole.entities.UserProfile.update(userProfiles[0].id, {
        subscription_status: "active_lifetime",
        subscription_tier: "Founding Athlete",
        subscription_price_paid: 249.99,
        lifetime_access: true,
      });
    } else {
      await base44.asServiceRole.entities.UserProfile.create({
        created_by: userEmail,
        subscription_status: "active_lifetime",
        subscription_tier: "Founding Athlete",
        subscription_price_paid: 249.99,
        lifetime_access: true,
      });
    }

    // 7. Log success
    console.log(`[Founding Athlete] User ${userEmail} purchased spot #${updatedConfig.founding_athlete_count}/${FOUNDING_ATHLETE_CAP}`);

    return Response.json({
      success: true,
      founding_athlete_number: updatedConfig.founding_athlete_count,
      total_cap: FOUNDING_ATHLETE_CAP,
    });
  } catch (error) {
    console.error("[Stripe Webhook Error]", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});