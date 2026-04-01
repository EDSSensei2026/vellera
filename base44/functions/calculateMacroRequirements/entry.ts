import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { weight_lbs, training_volume_minutes, goal } = await req.json();

    if (!weight_lbs || !training_volume_minutes) {
      return Response.json({ error: 'Weight and training volume required' }, { status: 400 });
    }

    // Macro calculation based on training volume and goal
    const trainingHours = training_volume_minutes / 60;
    
    // Base TDEE: ~15-16 cal per lb for sedentary + activity multiplier
    const activityMultiplier = trainingHours > 2 ? 1.6 : trainingHours > 1 ? 1.5 : 1.3;
    const baseTDEE = weight_lbs * 15;
    const tdee = Math.round(baseTDEE * activityMultiplier);

    // Macro ratios based on goal
    let proteinRatio, carbRatio, fatRatio;
    
    if (goal === 'strength') {
      // High protein, moderate carbs/fat
      proteinRatio = 0.35;
      carbRatio = 0.45;
      fatRatio = 0.20;
    } else if (goal === 'endurance') {
      // High carbs, moderate protein/fat
      proteinRatio = 0.20;
      carbRatio = 0.60;
      fatRatio = 0.20;
    } else if (goal === 'cut') {
      // High protein, moderate carbs, low fat
      proteinRatio = 0.40;
      carbRatio = 0.40;
      fatRatio = 0.20;
    } else {
      // Default balanced
      proteinRatio = 0.30;
      carbRatio = 0.45;
      fatRatio = 0.25;
    }

    // Calculate macros
    const proteinCals = tdee * proteinRatio;
    const carbsCals = tdee * carbRatio;
    const fatCals = tdee * fatRatio;

    const proteinG = Math.round(proteinCals / 4);
    const carbsG = Math.round(carbsCals / 4);
    const fatG = Math.round(fatCals / 9);

    // Under-fueling threshold: if intake < 85% of TDEE
    const underFuelingThreshold = tdee * 0.85;

    return Response.json({
      success: true,
      tdee: tdee,
      daily_protein: proteinG,
      daily_carbs: carbsG,
      daily_fat: fatG,
      under_fueling_threshold: Math.round(underFuelingThreshold),
      notes: `Based on ${weight_lbs}lbs, ${trainingHours.toFixed(1)} hours training, ${goal} goal`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});