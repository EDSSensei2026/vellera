import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user data
    const [sessions, profiles, biometrics, techniques] = await Promise.all([
      base44.entities.TrainingSession.list('-date', 500),
      base44.entities.UserProfile.filter({ created_by: user.email }),
      base44.entities.BiometricLog.list('-date', 100),
      base44.entities.Technique.list('-date', 100),
    ]);

    const userProfile = profiles[0];
    const existingAchievements = await base44.entities.Achievement.filter({ created_by: user.email });
    const awardedBadges = existingAchievements.map(a => a.badge_id);

    const toAward = [];

    // Session milestones
    const sessionCount = sessions.length;
    if (sessionCount >= 1 && !awardedBadges.includes('first_session')) {
      toAward.push({ badge_id: 'first_session', badge_name: 'First Steps', category: 'milestone' });
    }
    if (sessionCount >= 10 && !awardedBadges.includes('sessions_10')) {
      toAward.push({ badge_id: 'sessions_10', badge_name: 'Momentum Starter', category: 'milestone' });
    }
    if (sessionCount >= 50 && !awardedBadges.includes('sessions_50')) {
      toAward.push({ badge_id: 'sessions_50', badge_name: 'Iron Grinder', category: 'milestone' });
    }
    if (sessionCount >= 100 && !awardedBadges.includes('sessions_100')) {
      toAward.push({ badge_id: 'sessions_100', badge_name: 'Warrior', category: 'milestone' });
    }

    // Strength milestones (check max 1RM increases)
    const liftData = {};
    sessions.forEach(s => {
      if (s.lifting_exercises) {
        const matches = s.lifting_exercises.match(/(\d+)lbs/g) || [];
        matches.forEach(w => {
          const weight = parseInt(w);
          liftData.maxWeight = Math.max(liftData.maxWeight || 0, weight);
        });
      }
    });

    if (liftData.maxWeight >= 5 && !awardedBadges.includes('strength_5lb_increase')) {
      toAward.push({ badge_id: 'strength_5lb_increase', badge_name: 'Gaining Ground', category: 'strength' });
    }
    if (liftData.maxWeight >= 25 && !awardedBadges.includes('strength_25lb_increase')) {
      toAward.push({ badge_id: 'strength_25lb_increase', badge_name: 'Power Surge', category: 'strength' });
    }
    if (liftData.maxWeight >= 50 && !awardedBadges.includes('strength_50lb_increase')) {
      toAward.push({ badge_id: 'strength_50lb_increase', badge_name: 'Beast Mode', category: 'strength' });
    }

    // Consistency (consecutive days)
    const datesSet = new Set(sessions.map(s => s.date));
    const sortedDates = Array.from(datesSet).sort().reverse();
    let consecutiveDays = 0;
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const curr = new Date(sortedDates[i]);
      const next = new Date(sortedDates[i + 1]);
      if ((curr - next) / 86400000 === 1) {
        consecutiveDays++;
      } else {
        break;
      }
    }

    if (consecutiveDays >= 7 && !awardedBadges.includes('consistency_7_days')) {
      toAward.push({ badge_id: 'consistency_7_days', badge_name: 'On a Roll', category: 'consistency' });
    }
    if (consecutiveDays >= 30 && !awardedBadges.includes('consistency_30_days')) {
      toAward.push({ badge_id: 'consistency_30_days', badge_name: 'Unstoppable', category: 'consistency' });
    }

    // Endurance minutes
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    if (totalMinutes >= 100 && !awardedBadges.includes('endurance_100_minutes')) {
      toAward.push({ badge_id: 'endurance_100_minutes', badge_name: 'Endurance Start', category: 'endurance' });
    }
    if (totalMinutes >= 500 && !awardedBadges.includes('endurance_500_minutes')) {
      toAward.push({ badge_id: 'endurance_500_minutes', badge_name: 'Marathon Runner', category: 'endurance' });
    }

    // Weight loss
    if (biometrics.length >= 2) {
      const latestWeight = biometrics[0]?.weight;
      const oldestWeight = biometrics[biometrics.length - 1]?.weight;
      if (latestWeight && oldestWeight) {
        const weightLoss = oldestWeight - latestWeight;
        if (weightLoss >= 5 && !awardedBadges.includes('weight_loss_5lbs')) {
          toAward.push({ badge_id: 'weight_loss_5lbs', badge_name: 'Lighter Load', category: 'weight' });
        }
        if (weightLoss >= 10 && !awardedBadges.includes('weight_loss_10lbs')) {
          toAward.push({ badge_id: 'weight_loss_10lbs', badge_name: 'Shredded', category: 'weight' });
        }
      }
    }

    // Technique milestones
    const techniqueCount = techniques.length;
    if (techniqueCount >= 1 && !awardedBadges.includes('first_technique')) {
      toAward.push({ badge_id: 'first_technique', badge_name: 'Technique Scholar', category: 'technique' });
    }
    if (techniqueCount >= 10 && !awardedBadges.includes('techniques_10')) {
      toAward.push({ badge_id: 'techniques_10', badge_name: 'Arsenal Master', category: 'technique' });
    }

    // XP award milestone
    const hasXpAward = sessions.some(s => s.xp_awarded_technique);
    if (hasXpAward && !awardedBadges.includes('first_xp_award')) {
      toAward.push({ badge_id: 'first_xp_award', badge_name: 'XP Earned', category: 'technique' });
    }

    // Award new achievements using service role (RLS restricts create to admins)
    if (toAward.length > 0) {
      await base44.asServiceRole.entities.Achievement.bulkCreate(
        toAward.map(badge => ({
          badge_id: badge.badge_id,
          badge_name: badge.badge_name,
          category: badge.category,
          awarded_date: new Date().toISOString(),
          badge_description: `${badge.badge_name} - Achievement earned`,
          rarity: 'common',
        })),
        { created_by: user.email } // Set created_by to track which user earned the badge
      );
    }

    return Response.json({ awarded: toAward.length, badges: toAward });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});