import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const sessionDate = body.session_date;
    const intensityLevel = body.intensity_level;

    // Fetch coach feedback for today
    const feedbackList = await base44.entities.CoachFeedback.filter({
      athlete_email: user.email,
      session_date: sessionDate,
    });

    if (feedbackList.length === 0) {
      return Response.json({
        success: true,
        adjustment_applied: false,
        message: 'No coach feedback found for this session.',
      });
    }

    const feedback = feedbackList[0];

    // Auto-adjustment logic: if High Intensity, set next AM to Recovery
    let adjustmentApplied = false;
    let nextSessionOverride = 'Standard';

    if (intensityLevel === 'High' || intensityLevel === 'Max') {
      nextSessionOverride = 'Shield Recovery';
      adjustmentApplied = true;

      // Update the coach feedback record
      await base44.entities.CoachFeedback.update(feedback.id, {
        next_session_override: nextSessionOverride,
      });

      console.log(`[Coach Adjustment] High intensity lab session → Next AM: Shield Recovery`);
    }

    return Response.json({
      success: true,
      adjustment_applied: adjustmentApplied,
      next_session_override: nextSessionOverride,
      coach_notes: feedback.coach_notes || '',
      message: adjustmentApplied
        ? `After High Intensity session, next AM is shifted to Shield Recovery to prevent injury.`
        : `Session logged at Standard intensity. Continue regular AM programming.`,
    });
  } catch (error) {
    console.error('[Coach Intensity Adjustment Error]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});