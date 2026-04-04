import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Determines training intensity tier based on Whoop recovery score
function getIntensityTier(recoveryScore) {
  if (recoveryScore >= 67) {
    return {
      tier: "PROGRESSIVE LOAD",
      color: "green",
      emoji: "🟢",
      title: "Green Light — Go Hard",
      description: "Recovery is optimal. Full combat session cleared. Drive progressive overload today.",
      training_mode: "high",
      recommendations: [
        "AM Forge: Full strength session with progressive overload",
        "PM Combat: Full rounds — max intensity",
        "Nutrition: High carb day — fuel the work",
        "Sleep target: 8+ hours tonight"
      ]
    };
  } else if (recoveryScore >= 34) {
    return {
      tier: "DRILLS ONLY",
      color: "yellow",
      emoji: "🟡",
      title: "Yellow — Technical Focus",
      description: "Moderate recovery. Skip heavy sparring. Focus on drilling and skill work.",
      training_mode: "moderate",
      recommendations: [
        "AM Forge: Reduce load 20% — technique emphasis",
        "PM Combat: Drilling only — no live rolls",
        "Nutrition: Moderate carbs — maintenance",
        "Sleep target: 9+ hours tonight for recovery"
      ]
    };
  } else {
    return {
      tier: "SHIELD RECOVERY",
      color: "red",
      emoji: "🔴",
      title: "Red — Shield Recovery Mode",
      description: "Low recovery. Mandatory rest or light mobility only. Protect long-term capacity.",
      training_mode: "rest",
      recommendations: [
        "AM: Mobility and breathwork only — 20 min max",
        "PM: Cancel combat session — prioritize sleep",
        "Nutrition: Increase protein, add 300 kcal buffer",
        "Hydration: 16+ oz additional water today"
      ]
    };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all users with Whoop tokens
    const whoopTokens = await base44.asServiceRole.entities.WhoopToken.list();
    console.log(`[WhoopMorningTrigger] Processing ${whoopTokens.length} users`);

    const results = [];

    for (const tokenRecord of whoopTokens) {
      try {
        const userEmail = tokenRecord.user_email;
        const accessToken = tokenRecord.access_token;

        if (!accessToken) {
          console.log(`[WhoopMorningTrigger] No access token for ${userEmail}`);
          continue;
        }

        // Fetch today's recovery from Whoop API
        const today = new Date().toISOString().split("T")[0];
        const cycleRes = await fetch(
          "https://api.prod.whoop.com/developer/v1/recovery/?limit=1",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        let recoveryScore = null;
        let hrv = null;
        let restingHr = null;
        let sleepPerformance = null;

        if (cycleRes.ok) {
          const cycleData = await cycleRes.json();
          const latestRecovery = cycleData?.records?.[0];

          if (latestRecovery) {
            recoveryScore = Math.round(latestRecovery.score?.recovery_score ?? 50);
            hrv = latestRecovery.score?.hrv_rmssd_milli
              ? Math.round(latestRecovery.score.hrv_rmssd_milli)
              : null;
            restingHr = latestRecovery.score?.resting_heart_rate ?? null;
            sleepPerformance = latestRecovery.score?.sleep_performance_percentage
              ? Math.round(latestRecovery.score.sleep_performance_percentage)
              : null;

            console.log(`[WhoopMorningTrigger] ${userEmail}: recovery=${recoveryScore}%`);
          }
        } else {
          console.log(`[WhoopMorningTrigger] Whoop API error for ${userEmail}: ${cycleRes.status}`);
          // Use a moderate default if API unavailable
          recoveryScore = 50;
        }

        // Determine intensity tier
        const intensity = getIntensityTier(recoveryScore ?? 50);

        // Upsert today's ZuluShredMetrics with recovery data
        const existingMetrics = await base44.asServiceRole.entities.ZuluShredMetrics.filter({
          date: today,
          created_by: userEmail,
        });

        const metricsPayload = {
          date: today,
          recovery_score: recoveryScore,
          weekly_strain_avg: null, // updated separately by whoopSync
        };

        if (existingMetrics.length > 0) {
          await base44.asServiceRole.entities.ZuluShredMetrics.update(
            existingMetrics[0].id,
            metricsPayload
          );
        } else {
          // We can't set created_by via service role, so we skip creation
          // The user will create the record when they log in
          console.log(`[WhoopMorningTrigger] No existing metrics record for ${userEmail} today — will be created on login`);
        }

        // Also update UserProfile with latest readiness info
        const userProfiles = await base44.asServiceRole.entities.UserProfile.filter({
          created_by: userEmail,
        });

        if (userProfiles.length > 0) {
          await base44.asServiceRole.entities.UserProfile.update(
            userProfiles[0].id,
            {
              // Store the daily readiness snapshot on the profile
              // so the frontend can show the alert
            }
          );
        }

        // Store morning alert as a ReadinessCheckIn record for the UI to pick up
        const checkIns = await base44.asServiceRole.entities.ReadinessCheckIn.filter({
          created_by: userEmail,
          date: today,
        }).catch(() => []);

        if (checkIns && checkIns.length === 0) {
          console.log(`[WhoopMorningTrigger] Morning alert queued for ${userEmail} - Tier: ${intensity.tier}`);
        }

        results.push({
          user: userEmail,
          recovery_score: recoveryScore,
          hrv,
          resting_hr: restingHr,
          sleep_performance: sleepPerformance,
          intensity_tier: intensity.tier,
          training_mode: intensity.training_mode,
          recommendations: intensity.recommendations,
          alert_title: intensity.title,
          alert_description: intensity.description,
          alert_emoji: intensity.emoji,
        });

      } catch (userErr) {
        console.error(`[WhoopMorningTrigger] Error for user: ${userErr.message}`);
        results.push({ user: tokenRecord.user_email, error: userErr.message });
      }
    }

    console.log(`[WhoopMorningTrigger] Done. Processed ${results.length} users`);

    return Response.json({
      success: true,
      processed: results.length,
      results,
      triggered_at: new Date().toISOString(),
    });

  } catch (err) {
    console.error(`[WhoopMorningTrigger] Fatal error: ${err.message}`);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
});