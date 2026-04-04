import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { video_url, session_type } = body;

    if (!video_url) {
      return Response.json({ error: 'video_url required' }, { status: 400 });
    }

    const prompt = `You are a martial arts and movement analyst specializing in action recognition.

Given this video URL: ${video_url}

Session Type: ${session_type || 'general'}

Identify and classify all actions/techniques visible:
1. **Primary Actions** - main movements (e.g., guard pass, takedown, punch combination)
2. **Transitions** - changes in position or technique
3. **Defense Reactions** - counter-movements
4. **Tempo & Timing** - rhythm and pacing assessment
5. **Sequence Analysis** - how techniques flow together

Return JSON:
{
  "primary_actions": [
    {
      "name": "action name",
      "body_parts_involved": ["part1"],
      "duration_estimate": "seconds",
      "efficiency_score": 0-100
    }
  ],
  "transitions": ["transition 1"],
  "defensive_moments": ["defense 1"],
  "tempo_score": 0-100,
  "technical_execution": "assessment",
  "action_recommendations": ["rec 1"]
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [video_url],
      model: 'gpt_5',
      response_json_schema: {
        type: 'object',
        properties: {
          primary_actions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                body_parts_involved: { type: 'array', items: { type: 'string' } },
                duration_estimate: { type: 'string' },
                efficiency_score: { type: 'number' },
              },
            },
          },
          transitions: { type: 'array', items: { type: 'string' } },
          defensive_moments: { type: 'array', items: { type: 'string' } },
          tempo_score: { type: 'number' },
          technical_execution: { type: 'string' },
          action_recommendations: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    return Response.json(result);
  } catch (error) {
    console.error('actionRecognition error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});