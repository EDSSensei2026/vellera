import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { video_id, thumbnail_url, exercise_name } = await req.json();

    if (!video_id || !thumbnail_url || !exercise_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Call InvokeLLM with vision to analyze form
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert strength and conditioning coach specializing in lift form analysis.

Analyze this lift video screenshot for the exercise: ${exercise_name}

Provide your analysis in this exact JSON format:
{
  "form_score": <0-100 number>,
  "technique_errors": [<list of specific technique errors observed>],
  "form_tips": [<3-5 actionable tips to improve form>],
  "safety_alerts": [<any safety concerns or injury prevention tips>],
  "summary": "<1-2 sentence overall assessment>"
}

Focus on:
1. Spine alignment and neutral posture
2. Joint positioning (knees, hips, shoulders)
3. Range of motion and depth
4. Bar path and control
5. Symmetry and balance
6. Breathing and pace

Be specific and actionable.`,
      file_urls: [thumbnail_url],
      response_json_schema: {
        type: "object",
        properties: {
          form_score: { type: "number" },
          technique_errors: { type: "array", items: { type: "string" } },
          form_tips: { type: "array", items: { type: "string" } },
          safety_alerts: { type: "array", items: { type: "string" } },
          summary: { type: "string" }
        }
      }
    });

    // Update the LiftVideo record with analysis
    await base44.entities.LiftVideo.update(video_id, {
      form_score: analysis.form_score || 0,
      technique_errors: analysis.technique_errors || [],
      form_tips: analysis.form_tips || [],
      safety_alerts: analysis.safety_alerts || [],
      ai_feedback: analysis.summary || '',
      analyzed: true,
      analysis_date: new Date().toISOString()
    });

    return Response.json({
      success: true,
      analysis: {
        form_score: analysis.form_score,
        technique_errors: analysis.technique_errors,
        form_tips: analysis.form_tips,
        safety_alerts: analysis.safety_alerts,
        summary: analysis.summary
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});