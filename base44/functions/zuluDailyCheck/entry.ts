import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split("T")[0];
    const hour = new Date().getHours();
    const isMorning = hour >= 5 && hour < 12;
    const isEvening = hour >= 17 && hour < 21;

    // Get latest biometric log (Whoop recovery)
    const biometrics = await base44.entities.BiometricLog.filter(
      { date: today },
      { limit: 1 }
    );

    if (!biometrics || biometrics.length === 0) {
      return Response.json({
        success: true,
        message: "No Whoop data yet. Default to Yellow (Technical Restraint).",
        recovery_status: "unknown",
        pm_clearance: "drills_only",
        notification: "⚠️ No Whoop data. PM: Drills only (no live rolling).",
      });
    }

    const bio = biometrics[0];
    const recoveryScore = bio.recovery_score || 50;
    const amStrain = bio.training_load || 0;

    // Recovery Gate Logic with Contextual Triggers
    let recoveryStatus, pmClearance, notification;

    if (recoveryScore > 67) {
      recoveryStatus = "green";
      pmClearance = "combat_approved";
      notification = isMorning 
        ? "🔥 AM FORGE: Your strength is the shield for your family. Push for them."
        : isEvening 
        ? "✅ GREEN ZONE: Cleared for Combat. Assess Strain vs. Capacity. Go compete."
        : "✅ GREEN ZONE: Cleared for Combat. AM +2.5% load.";
    } else if (recoveryScore >= 34) {
      recoveryStatus = "yellow";
      pmClearance = "drills_only";
      notification = isMorning
        ? "⚠️ YELLOW MORNING: Maintenance load. Drills only PM. Tactical discipline over ego."
        : isEvening
        ? "⚠️ YELLOW EVENING: Drills only (no live rolling). Preserve capacity."
        : "⚠️ YELLOW ZONE: Technical Restraint. PM drills only.";
    } else {
      recoveryStatus = "red";
      pmClearance = "shield_recovery";
      notification = isMorning
        ? "🛑 SHIELD RECOVERY: Cancel AM lift. Wisdom is knowing when to decompress."
        : isEvening
        ? "🛑 RED ZONE: Complete rest. Recovery is a tactical decision for the long game."
        : "🛑 RED ZONE: Shield Recovery activated. Cancel AM lift. PM rest.";
    }

    // Log decision to PlanAdjustment if Red
    if (recoveryStatus === "red") {
      const plan = await base44.entities.TrainingPlan.filter(
        { created_by: user.email },
        { limit: 1 }
      );

      if (plan && plan.length > 0) {
        await base44.entities.PlanAdjustment.create({
          plan_id: plan[0].id,
          user_email: user.email,
          adjustment_date: today,
          target_date: today,
          recovery_score: recoveryScore,
          intensity_zone: "Rest",
          original_activity: "Full Zulu Elite Schedule",
          original_intensity: "high",
          adjusted_activity: "Shield Recovery (Stretching Protocol)",
          adjusted_intensity: "light",
          adjustment_reason: `Recovery ${recoveryScore}% triggered Red Zone auto-adjustment.`,
          metrics_snapshot: {
            recovery_score: recoveryScore,
            training_load: amStrain,
          },
          was_applied: false,
        });
      }
    }

    console.log(`[Zulu Daily Check v2.0] ${user.email} | Recovery: ${recoveryScore}% | Status: ${recoveryStatus.toUpperCase()} | AM Strain: ${amStrain} | Trigger: ${isMorning ? 'AM' : isEvening ? 'PM' : 'DAILY'}`);

    return Response.json({
      success: true,
      recovery_score: recoveryScore,
      recovery_status: recoveryStatus,
      am_strain: amStrain,
      pm_clearance: pmClearance,
      notification: notification,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Zulu Daily Check Error]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});