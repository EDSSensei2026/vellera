import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { video_url, exercise_name } = body;

    if (!video_url) {
      return Response.json({ error: 'video_url required' }, { status: 400 });
    }

    const prompt = `You are a biomechanics expert analyzing lift form using pose estimation concepts.

Given this video URL: ${video_url}

For the exercise: ${exercise_name || 'unknown'}

Analyze the body position and joint alignment:
1. **Key Joint Positions** (neck, shoulders, elbows, wrists, spine, hips, knees, ankles)
2. **Movement Quality** - identify deviations from optimal form
3. **Stability Assessment** - base of support, balance, core engagement
4. **Range of Motion** - depth, lockout, control through full ROM
5. **Symmetry** - left/right imbalances

Return JSON:
{
  "joints": {
    "neck": "position description",
    "shoulders": "position description",
    "spine": "position description",
    "hips": "position description",
    "knees": "position description",
    "ankles": "position description"
  },
  "stability_score": 0-100,
  "rom_assessment": "description",
  "symmetry_issues": ["issue 1"],
  "biomechanical_risks": ["risk 1"],
  "key_cues": ["cue 1"]
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [video_url],
      model: 'gpt_5',
      response_json_schema: {
        type: 'object',
        properties: {
          joints: {
            type: 'object',
            properties: {
              neck: { type: 'string' },
              shoulders: { type: 'string' },
              spine: { type: 'string' },
              hips: { type: 'string' },
              knees: { type: 'string' },
              ankles: { type: 'string' },
            },
          },
          stability_score: { type: 'number' },
          rom_assessment: { type: 'string' },
          symmetry_issues: { type: 'array', items: { type: 'string' } },
          biomechanical_risks: { type: 'array', items: { type: 'string' } },
          key_cues: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    return Response.json(result);
  } catch (error) {
    console.error('poseEstimation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});