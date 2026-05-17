import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the payload from the automation
    const payload = await req.json();
    const biometricData = payload.data;

    if (!biometricData) {
      return Response.json({ error: 'No biometric data' }, { status: 400 });
    }

    // Define alert thresholds (can be customized in settings)
    const RECOVERY_THRESHOLD = 60; // Alert if recovery < 60%
    const SLEEP_THRESHOLD = 60; // Alert if sleep performance < 60%

    const recovery = biometricData.recovery_pct;
    const sleep = biometricData.sleep_performance;
    const date = biometricData.date;

    // Check if alerts should be triggered
    const recoveryAlert = recovery !== null && recovery !== undefined && recovery < RECOVERY_THRESHOLD;
    const sleepAlert = sleep !== null && sleep !== undefined && sleep < SLEEP_THRESHOLD;

    if (!recoveryAlert && !sleepAlert) {
      return Response.json({ alerted: false });
    }

    // Build alert message
    let alertMessage = `⚠️ Recovery Alert for ${date}\n\n`;

    if (recoveryAlert) {
      alertMessage += `💔 Recovery Score: ${recovery}% (Below ${RECOVERY_THRESHOLD}% threshold)\n`;
      if (recovery <= 40) {
        alertMessage += `   → CRITICAL: Consider rest day or very light activity only\n`;
      } else if (recovery <= 50) {
        alertMessage += `   → LOW: Dial back intensity today, focus on recovery\n`;
      } else {
        alertMessage += `   → MODERATE: Be cautious with high-intensity work\n`;
      }
    }

    if (sleepAlert) {
      alertMessage += `😴 Sleep Performance: ${sleep}% (Below ${SLEEP_THRESHOLD}% threshold)\n`;
      alertMessage += `   → Prioritize sleep tonight before next training session\n`;
    }

    alertMessage += `\nRecommendation: Review your training plan and consider adjusting intensity accordingly.`;

    // Send email alert
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: `🔴 Recovery Alert - ${date}`,
      body: alertMessage,
    });

    console.log(`Recovery alert sent to ${user.email}`);

    return Response.json({
      alerted: true,
      recovery,
      sleep,
      type: recoveryAlert && sleepAlert ? 'both' : recoveryAlert ? 'recovery' : 'sleep',
    });
  } catch (error) {
    console.error('Recovery alert error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});