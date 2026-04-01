import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Zone mapping for adjustments
const INTENSITY_ZONES = [
  { min: 0, max: 33, zone: "Rest", activities: ["Rest / Recovery Only", "Home Mobility", "Light Walk"] },
  { min: 34, max: 50, zone: "Technique", activities: ["Light Drilling", "Film Study", "Zone 2 @ 60%"] },
  { min: 51, max: 67, zone: "Moderate", activities: ["BJJ Drilling", "Moderate Sparring", "S&C Strength"] },
  { min: 68, max: 84, zone: "Green", activities: ["Full BJJ Class", "Hard Sparring", "S&C + Mat Combo"] },
  { min: 85, max: 100, zone: "Peak", activities: ["Full Competition Simulation", "A-Game Sparring", "PR Lifts"] }
];

function getZoneInfo(recoveryScore) {
  return INTENSITY_ZONES.find(z => recoveryScore >= z.min && recoveryScore <= z.max) || INTENSITY_ZONES[0];
}

function mapActivityToZone(originalActivity, zone) {
  // If original activity matches zone level, keep it
  const activityLower = originalActivity.toLowerCase();
  if (zone.activities.some(a => activityLower.includes(a.toLowerCase()))) {
    return originalActivity;
  }
  // Otherwise pick first recommended activity for zone
  return zone.activities[0];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId } = await req.json().catch(() => ({}));

    // If called with userId, adjust for that user only; otherwise admin runs for all
    let users = [];
    if (userId) {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      users = [user];
    } else {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin only for batch' }, { status: 403 });
      }
      users = await base44.asServiceRole.entities.User.list();
    }

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const adjustments = [];

    for (const user of users) {
      // Get today's biometric log
      const bioLogs = await base44.asServiceRole.entities.BiometricLog.filter(
        { created_by: user.email, date: today },
        "-created_date",
        1
      );
      const todayBio = bioLogs[0];

      if (!todayBio) continue; // No biometric data, skip

      // Get recovery score (if available)
      const recoveryScore = todayBio.recovery_pct ?? null;
      if (recoveryScore === null) continue;

      // Get user's active training plans
      const plans = await base44.asServiceRole.entities.TrainingPlan.filter(
        { created_by: user.email, auto_adjust_enabled: true }
      );

      for (const plan of plans) {
        // Find tomorrow's plan entry
        const allDays = plan.weeks.flatMap(w => w.days);
        const tomorrowEntry = allDays.find(d => d.date === tomorrow);

        if (!tomorrowEntry) continue;

        // Get intensity zone based on recovery
        const zone = getZoneInfo(recoveryScore);

        // Determine adjustment
        const needsAdjustment = tomorrowEntry.base_intensity !== zone.zone.toLowerCase();

        if (needsAdjustment) {
          const adjustedActivity = mapActivityToZone(tomorrowEntry.base_activity, zone);
          const adjustmentReason = `Recovery at ${recoveryScore}% → ${zone.zone} zone. Original: ${tomorrowEntry.base_activity}`;

          // Update plan day entry
          const updatedWeeks = plan.weeks.map(w => ({
            ...w,
            days: w.days.map(d =>
              d.date === tomorrow
                ? {
                    ...d,
                    adjusted_activity: adjustedActivity,
                    adjusted_intensity: zone.zone.toLowerCase(),
                    reason_for_adjustment: adjustmentReason,
                    is_adjusted: true
                  }
                : d
            )
          }));

          await base44.asServiceRole.entities.TrainingPlan.update(plan.id, { weeks: updatedWeeks });

          // Log adjustment for audit
          await base44.asServiceRole.entities.PlanAdjustment.create({
            plan_id: plan.id,
            user_email: user.email,
            adjustment_date: today,
            target_date: tomorrow,
            recovery_score: recoveryScore,
            intensity_zone: zone.zone,
            original_activity: tomorrowEntry.base_activity,
            original_intensity: tomorrowEntry.base_intensity,
            adjusted_activity: adjustedActivity,
            adjusted_intensity: zone.zone.toLowerCase(),
            adjustment_reason: adjustmentReason,
            metrics_snapshot: {
              hrv: todayBio.hrv,
              resting_hr: todayBio.resting_hr,
              sleep_performance: todayBio.sleep_performance,
              body_battery: todayBio.body_battery
            }
          });

          adjustments.push({
            user: user.email,
            plan: plan.plan_name,
            date: tomorrow,
            zone: zone.zone,
            recovery: recoveryScore
          });
        }
      }
    }

    return Response.json({
      success: true,
      date: today,
      adjustments_made: adjustments.length,
      details: adjustments
    });
  } catch (error) {
    console.error('Plan adjustment failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});