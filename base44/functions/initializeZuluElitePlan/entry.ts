import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const WEEKLY_SCHEDULE = [
  {
    day: 1,
    name: "MON",
    amPhase: "The Shield (OHP 4x8, Incline Press 3x10, Pull-ups 4x8)",
    amDuration: 60,
    pmPhase: "BJJ Fundamentals",
    pmDuration: 90,
  },
  {
    day: 2,
    name: "TUE",
    amPhase: "The Charge (Squat 5x5, Lunges 3x20, KB Swings 4x20)",
    amDuration: 65,
    pmPhase: "MMA Striking",
    pmDuration: 75,
  },
  {
    day: 3,
    name: "WED",
    amPhase: "Shield Recovery (90/90 Flow, Couch Stretch, Thoracic Bridge)",
    amDuration: 30,
    pmPhase: "Technical BJJ (Light)",
    pmDuration: 60,
  },
  {
    day: 4,
    name: "THU",
    amPhase: "The Density (Deadlift 3x5, Rows 4x10, Hammer Curls 3x12)",
    amDuration: 70,
    pmPhase: "BJJ Live Rolling",
    pmDuration: 90,
  },
  {
    day: 5,
    name: "FRI",
    amPhase: "The Impi (Dips 4x10, Landmine Press 3x12, Leg Raises 4xAMRAP)",
    amDuration: 60,
    pmPhase: "MMA Sparring",
    pmDuration: 75,
  },
  {
    day: 6,
    name: "SAT",
    amPhase: "Sprints (5x 40yd + Conditioning)",
    amDuration: 45,
    pmPhase: "Open Mat / Skill Work",
    pmDuration: 90,
  },
  {
    day: 0,
    name: "SUN",
    amPhase: "Total Reset (Mobility only, zero impact)",
    amDuration: 20,
    pmPhase: "Complete Rest",
    pmDuration: 0,
  },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build 15-week plan structure
    const startDate = new Date("2026-04-07");
    const weeks = [];

    for (let w = 1; w <= 15; w++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + (w - 1) * 7);

      const days = WEEKLY_SCHEDULE.map((dayConfig) => {
        const dayDate = new Date(weekStart);
        const dayOfWeek = dayConfig.day;
        const daysToAdd = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        dayDate.setDate(dayDate.getDate() + daysToAdd);

        return {
          day_of_week: dayConfig.day,
          date: dayDate.toISOString().split("T")[0],
          base_activity: `AM: ${dayConfig.amPhase} | PM: ${dayConfig.pmPhase}`,
          base_duration_minutes: dayConfig.amDuration + dayConfig.pmDuration,
          base_intensity: dayConfig.amPhase.includes("Recovery") ? "light" : dayConfig.amPhase.includes("Sprints") ? "max" : "high",
          adjusted_activity: `AM: ${dayConfig.amPhase} | PM: ${dayConfig.pmPhase}`,
          adjusted_intensity: dayConfig.amPhase.includes("Recovery") ? "light" : dayConfig.amPhase.includes("Sprints") ? "max" : "high",
          is_adjusted: false,
        };
      });

      weeks.push({
        week_number: w,
        phase: w <= 5 ? 1 : w <= 10 ? 2 : 3,
        focus: w <= 5 ? "Foundation (Green Recovery)" : w <= 10 ? "Peak (Yellow/Green Cycling)" : "Taper (Red Recovery Management)",
        days,
      });
    }

    // Create the plan
    const plan = await base44.entities.TrainingPlan.create({
      plan_name: "Zulu Warrior: AM/PM Elite Protocol v1.2",
      user_email: user.email,
      start_date: "2026-04-07",
      end_date: "2026-07-18",
      primary_goal: "strength",
      total_phases: 3,
      current_phase: 1,
      base_intensity_level: "Advanced",
      auto_adjust_enabled: true,
      notes: "AM Phase (05:00): The Forge - Strength & Aesthetic | PM Phase (18:00): The Combat - BJJ/MMA Skill. Whoop 5.0 Recovery Gating: Green >67% (+2.5% load), Yellow 34-66% (-15% load, drills only), Red <34% (Shield Recovery, rest).",
      motivational_metadata: {
        am_trigger: "Your strength is the shield for Shauntze, your son, and Emerging Defense Solutions. Push for them.",
        pm_trigger: "Assess Strain vs. Capacity. A wise protector stays healthy to defend. Tactical discipline over ego.",
        recovery_trigger: "Wisdom is knowing when to decompress. Recovery is a tactical decision for the long game."
      },
      weeks,
    });

    console.log(`[Zulu Elite v2.0] Created for ${user.email}: ${plan.id}`);

    return Response.json({
      success: true,
      plan_id: plan.id,
      plan_name: plan.plan_name,
      start_date: plan.start_date,
      end_date: plan.end_date,
      phases: "AM (05:00) | PM (18:00)",
      message: "Zulu Elite v2.0 initialized. Motivational triggers active. Connect Whoop 5.0 for recovery gating. Daily check at 17:00 compares AM strain vs recovery capacity.",
    });
  } catch (error) {
    console.error('[Zulu Elite Plan Error]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});