import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const jointIntegrityCheck = body.joint_integrity_check || {};

    // Fetch latest coach feedback to extract joint status
    const feedbackList = await base44.entities.CoachFeedback.filter(
      { athlete_email: user.email },
      { limit: 1, sort: { session_date: -1 } }
    );

    let clearanceForHeavyLift = true;
    let blockedExercises = [];
    let alerts = [];

    if (feedbackList.length > 0) {
      const latestFeedback = feedbackList[0];

      if (latestFeedback.joint_integrity_check) {
        const jointStatus = latestFeedback.joint_integrity_check;

        if (jointStatus.knee_status === 'Rest Required') {
          clearanceForHeavyLift = false;
          blockedExercises.push('Squats', 'Lunges', 'Leg Press');
          alerts.push('⚠️ Knee: Rest required. Skip heavy leg work.');
        } else if (jointStatus.knee_status === 'Monitor') {
          alerts.push('⚡ Knee: Monitor during leg work. Reduce volume by 20%.');
        }

        if (jointStatus.back_status === 'Rest Required') {
          clearanceForHeavyLift = false;
          blockedExercises.push('Deadlifts', 'Squats', 'Bent Rows');
          alerts.push('⚠️ Back: Rest required. Skip heavy posterior chain work.');
        } else if (jointStatus.back_status === 'Monitor') {
          alerts.push('⚡ Back: Monitor during deadlifts. Reduce volume by 20%.');
        }

        if (jointStatus.shoulder_status === 'Rest Required') {
          clearanceForHeavyLift = false;
          blockedExercises.push('OHP', 'Incline Press', 'Pull-ups');
          alerts.push('⚠️ Shoulder: Rest required. Skip heavy upper pressing.');
        } else if (jointStatus.shoulder_status === 'Monitor') {
          alerts.push('⚡ Shoulder: Monitor during pressing. Reduce volume by 20%.');
        }
      }
    }

    console.log(`[Joint Integrity Check] ${user.email} | Cleared for heavy lift: ${clearanceForHeavyLift}`);

    return Response.json({
      success: true,
      cleared_for_heavy_lift: clearanceForHeavyLift,
      blocked_exercises: blockedExercises,
      alerts: alerts,
      message: clearanceForHeavyLift
        ? 'All joints clear. Proceed with full AM heavy programming.'
        : 'Joint restrictions detected. Adjustments applied to prevent further injury.',
    });
  } catch (error) {
    console.error('[Joint Integrity Check Error]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});