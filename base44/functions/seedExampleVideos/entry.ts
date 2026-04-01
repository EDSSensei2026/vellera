import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const DEMO_VIDEOS = [
  {
    exercise_name: "Squat",
    video_url: "https://media.base44.com/images/public/69c722c665db36b41f55ba9c/demo_squat.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80",
    form_score: 78,
    technique_errors: [
      "Knees caving inward on descent",
      "Heels lifting slightly at bottom",
      "Torso angle could be more upright"
    ],
    form_tips: [
      "Keep weight in heels throughout entire lift",
      "Drive knees outward and keep chest up",
      "Descend with control and pause briefly at bottom"
    ],
    safety_alerts: [
      "Watch for excessive forward knee travel — adjust stance width"
    ],
    ai_feedback: "Solid depth and control. Minor knee positioning issue that's easily correctable. Form is fundamentally sound for a 250lb athlete."
  },
  {
    exercise_name: "Deadlift",
    video_url: "https://media.base44.com/images/public/69c722c665db36b41f55ba9c/demo_deadlift.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80",
    form_score: 85,
    technique_errors: [
      "Bar path slightly forward at lockout"
    ],
    form_tips: [
      "Bar should travel in a straight vertical line",
      "Squeeze glutes at top and maintain neutral spine",
      "Keep shoulders directly over the bar at setup"
    ],
    safety_alerts: [],
    ai_feedback: "Excellent deadlift mechanics. Bar speed is strong, back angle is correct, and hip drive is explosive. Minor bar path adjustment needed for perfection."
  },
  {
    exercise_name: "Bench Press",
    video_url: "https://media.base44.com/images/public/69c722c665db36b41f55ba9c/demo_bench.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400&q=80",
    form_score: 72,
    technique_errors: [
      "Shoulder blades not fully retracted",
      "Elbows flaring too much at bottom",
      "Feet placement inconsistent"
    ],
    form_tips: [
      "Retract shoulder blades and keep them pinned throughout",
      "Elbows at 45-degree angle — not 90",
      "Plant feet firmly on ground for leg drive"
    ],
    safety_alerts: [
      "Loose foot placement reduces stability and power transfer"
    ],
    ai_feedback: "Good pressing strength but mechanics need tightening. Focus on scapular control and tighter shoulder position. This will unlock more weight and reduce injury risk."
  }
];

const DEMO_BJJ_CLIPS = [
  {
    title: "Guard pass attempt — collar drag to side control",
    date: new Date(Date.now() - 86400000 * 3).toISOString().split("T")[0],
    video_url: "https://media.base44.com/images/public/69c722c665db36b41f55ba9c/demo_guard_pass.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&q=80",
    session_type: "BJJ Foundations",
    ai_techniques_tagged: ["Collar Drag", "Side Control", "Guard Pass"],
    posture_score: 76,
    ai_analysis: "Solid collar drag setup with good frame control. You maintained pressure throughout the transition to side control. Hip position was excellent for a heavyweight athlete.",
    ai_coaching_cues: [
      "Keep chest glued to opponent to prevent reversal",
      "Post your weight on the opponent before adjusting position",
      "Control the far hip to prevent bridge escape"
    ]
  },
  {
    title: "Mount escape — shrimping and bridge drill",
    date: new Date(Date.now() - 86400000 * 5).toISOString().split("T")[0],
    video_url: "https://media.base44.com/images/public/69c722c665db36b41f55ba9c/demo_mount_escape.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=400&q=80",
    session_type: "BJJ Foundations",
    ai_techniques_tagged: ["Mount Escape", "Elbow Escape", "Hip Bridge"],
    posture_score: 82,
    ai_analysis: "Textbook elbow escape technique. Timing was perfect and you created space efficiently. Solid base structure for a 250lb frame.",
    ai_coaching_cues: [
      "Excellent hip lift timing — caught them when weight was centered",
      "Good knee placement to control the opponent's center of gravity",
      "Consider pedaling the feet sooner to create more space"
    ]
  },
  {
    title: "No-Gi rolling — wrestling transitions to leg lock setup",
    date: new Date(Date.now() - 86400000 * 7).toISOString().split("T")[0],
    video_url: "https://media.base44.com/images/public/69c722c665db36b41f55ba9c/demo_nogi_rolling.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80",
    session_type: "No-Gi",
    ai_techniques_tagged: ["Wrestling Takedown", "Leg Lock", "Top Control"],
    posture_score: 79,
    ai_analysis: "Good wrestling fundamentals with solid transition timing. You're developing good leg lock entry points. Some loose positions on top — tighten base control.",
    ai_coaching_cues: [
      "Tighten your top position by controlling the hips",
      "Commit more to the leg lock entries — you showed hesitation",
      "Better head positioning to defend chokes from bottom"
    ]
  }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user already has demo data
    const existingLifts = await base44.entities.LiftVideo.filter({ created_by: user.email });
    const existingClips = await base44.entities.VideoVault.filter({ created_by: user.email });

    if (existingLifts.length > 0 || existingClips.length > 0) {
      return Response.json({ message: "Demo data already seeded for this user" });
    }

    // Seed demo lift videos
    const liftResults = [];
    for (const video of DEMO_VIDEOS) {
      const created = await base44.entities.LiftVideo.create({
        ...video,
        analyzed: true,
        analysis_date: new Date().toISOString(),
      });
      liftResults.push(created);
    }

    // Seed demo BJJ clips
    const clipResults = [];
    for (const clip of DEMO_BJJ_CLIPS) {
      const created = await base44.entities.VideoVault.create({
        ...clip,
        analyzed: true,
      });
      clipResults.push(created);
    }

    return Response.json({
      success: true,
      message: "Demo videos seeded successfully",
      lifts_created: liftResults.length,
      clips_created: clipResults.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});