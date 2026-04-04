import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch last 5 BJJ journal entries
    const journals = await base44.entities.BJJTacticalJournal.list('-session_date', 5);

    if (journals.length === 0) {
      return Response.json({ error: 'No journal entries found. Log at least one BJJ session first.' }, { status: 400 });
    }

    // Serialize journal data for prompt
    const journalSummary = journals.map((j, i) => {
      const techs = j.techniques_practiced?.map(t => `${t.name} (${t.position || 'unknown position'}, ${t.reps || 1} reps)`).join(', ') || 'none logged';
      const lightbulbs = j.lightbulb_moments?.join('; ') || 'none';
      return `Session ${i + 1} [${j.session_date}] — Type: ${j.session_type} | Focus: ${j.focus_area} | Rating: ${j.overall_feeling}/10
  Techniques: ${techs}
  Coach Feedback: ${j.coach_feedback || 'none'}
  Lightbulb Moments: ${lightbulbs}
  Injury Notes: ${j.injury_notes || 'none'}
  Next Session Goals: ${j.next_session_goals || 'none'}`;
    }).join('\n\n');

    const { InvokeLLM } = base44.asServiceRole.integrations.Core;

    const result = await InvokeLLM({
      prompt: `You are an elite BJJ coach analyzing a student's last ${journals.length} training sessions. Your role is to identify recurring defensive lapses, missed opportunities, and weak areas, then prescribe a razor-sharp focus plan.

STUDENT'S RECENT SESSIONS:
${journalSummary}

Analyze the patterns across sessions and output a JSON report with:
1. Top recurring weaknesses/defensive lapses identified
2. Missed submission or sweep opportunities
3. ONE "Drill of the Day" — a specific, actionable drill that directly addresses the biggest gap
4. A personalized focus cue for the next class
5. A 60-second warm-up drill to prime the specific weakness
6. Warrior mindset cue (1 sentence motivation)

Be specific. Name exact techniques. Reference their logged sessions directly.`,
      response_json_schema: {
        type: "object",
        properties: {
          recurring_weaknesses: {
            type: "array",
            items: { type: "string" },
            description: "Top 2-3 recurring defensive lapses or gaps"
          },
          missed_opportunities: {
            type: "array",
            items: { type: "string" },
            description: "Submission/sweep opportunities being left on the mat"
          },
          drill_of_the_day: {
            type: "object",
            properties: {
              name: { type: "string" },
              duration: { type: "string" },
              reps: { type: "string" },
              description: { type: "string" },
              why_this_drill: { type: "string" }
            }
          },
          focus_area_next_class: { type: "string" },
          warmup_drill: {
            type: "object",
            properties: {
              name: { type: "string" },
              instructions: { type: "string" },
              duration: { type: "string" }
            }
          },
          warrior_cue: { type: "string" },
          sessions_analyzed: { type: "number" }
        }
      }
    });

    return Response.json({ advice: result, sessions_analyzed: journals.length });
  } catch (error) {
    console.error('aiSparringAdvisor error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});