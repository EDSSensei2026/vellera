/**
 * Drill Library Starter: 20 pre-loaded workouts
 * 10 Fitness, 10 Martial Arts
 * Used to seed new users on day 1
 */

export const STARTER_DRILLS = {
  fitness: [
    {
      name: 'Full Body Strength Day 1',
      category: 'strength',
      duration_minutes: 60,
      exercises: [
        { name: 'Squat', sets: 5, reps: 5, focus: 'hip_power' },
        { name: 'Bench Press', sets: 5, reps: 5, focus: 'upper_body_pressing' },
        { name: 'Deadlift', sets: 3, reps: 3, focus: 'posterior_chain' },
        { name: 'Accessory Work', sets: 3, reps: 8, focus: 'muscle_building' },
      ],
      difficulty: 'intermediate',
      description: 'Heavy compound day. Rest 3-5 min between sets.',
    },
    {
      name: 'Upper Body Push/Pull',
      category: 'strength',
      duration_minutes: 50,
      exercises: [
        { name: 'Overhead Press', sets: 4, reps: 6, focus: 'shoulder_power' },
        { name: 'Pull-ups', sets: 4, reps: 5, focus: 'back_strength' },
        { name: 'Barbell Row', sets: 4, reps: 6, focus: 'posterior_chain' },
        { name: 'Dips', sets: 3, reps: 8, focus: 'tricep_strength' },
      ],
      difficulty: 'intermediate',
    },
    {
      name: 'Lower Body Hypertrophy',
      category: 'strength',
      duration_minutes: 55,
      exercises: [
        { name: 'Leg Press', sets: 4, reps: 8, focus: 'quad_hypertrophy' },
        { name: 'Leg Curl', sets: 4, reps: 10, focus: 'hamstring_development' },
        { name: 'Leg Extension', sets: 3, reps: 12, focus: 'quad_isolation' },
        { name: 'Calf Raises', sets: 3, reps: 15, focus: 'calf_development' },
      ],
      difficulty: 'beginner',
    },
    {
      name: 'Zone 2 Cardio',
      category: 'conditioning',
      duration_minutes: 45,
      intensity: 'low',
      description: 'Sustainable aerobic work. Can talk but not sing. 60-70% max HR.',
      difficulty: 'beginner',
    },
    {
      name: 'HIIT Circuit',
      category: 'conditioning',
      duration_minutes: 30,
      exercises: [
        { name: '20 sec Burpees', rest_sec: 10 },
        { name: '20 sec Jump Rope', rest_sec: 10 },
        { name: '20 sec Mountain Climbers', rest_sec: 10 },
        { name: '20 sec Rest', rest_sec: 0 },
      ],
      rounds: 8,
      difficulty: 'advanced',
    },
    {
      name: 'Core & Mobility',
      category: 'recovery',
      duration_minutes: 20,
      exercises: [
        { name: 'Dead Bug', duration_min: 3 },
        { name: 'Bird Dog', duration_min: 3 },
        { name: 'Cat Cow Stretch', duration_min: 2 },
        { name: 'Hip Flexor Stretch', duration_min: 2 },
        { name: 'Thoracic Rotation', duration_min: 2 },
        { name: 'Pigeon Pose', duration_min: 4 },
      ],
      difficulty: 'beginner',
    },
    {
      name: 'Farmer Carries & Sled Push',
      category: 'strength',
      duration_minutes: 30,
      exercises: [
        { name: 'Farmer Carry', sets: 4, duration_sec: 30, focus: 'grip_and_core' },
        { name: 'Sled Push', sets: 4, distance_meters: 40, focus: 'explosive_power' },
      ],
      difficulty: 'intermediate',
    },
    {
      name: 'Olympic Lift Technique',
      category: 'strength',
      duration_minutes: 45,
      exercises: [
        { name: 'Clean & Jerk', sets: 6, reps: 2, focus: 'power' },
        { name: 'Snatch', sets: 6, reps: 2, focus: 'explosiveness' },
      ],
      difficulty: 'advanced',
      description: 'Technical day. Focus on form over weight.',
    },
    {
      name: 'Metabolic Conditioning',
      category: 'conditioning',
      duration_minutes: 20,
      exercises: [
        { name: '10 cal Row', rest_sec: 20 },
        { name: '10 cal Bike', rest_sec: 20 },
        { name: '30 Double-Unders', rest_sec: 20 },
      ],
      rounds: 5,
      difficulty: 'advanced',
    },
  ],
  martial_arts: [
    {
      name: 'BJJ Technique: Guard Retention',
      category: 'technique',
      duration_minutes: 45,
      description: 'Fundamental guard protection drills.',
      exercises: [
        { name: 'Knee Shield Defense', reps: 20 },
        { name: 'Underhook Escape', reps: 20 },
        { name: 'De La Riva Hook', reps: 20 },
        { name: 'Guard Retention Drill', reps: 50, sparring: true },
      ],
      difficulty: 'beginner',
    },
    {
      name: 'BJJ Technique: Guard Pass',
      category: 'technique',
      duration_minutes: 50,
      exercises: [
        { name: 'Stack Pass', reps: 20 },
        { name: 'Toreando Pass', reps: 20 },
        { name: 'Knee Slice Pass', reps: 20 },
        { name: 'Pass Defense Drill', reps: 50 },
      ],
      difficulty: 'intermediate',
    },
    {
      name: 'BJJ Open Mat Sparring',
      category: 'sparring',
      duration_minutes: 60,
      description: '3x 8-min rounds with different partners. Focus on position control.',
      rounds: 3,
      duration_per_round_min: 8,
      difficulty: 'intermediate',
    },
    {
      name: 'Wrestling Fundamentals',
      category: 'technique',
      duration_minutes: 50,
      exercises: [
        { name: 'Takedown Drill', reps: 30 },
        { name: 'Hip Throw Practice', reps: 20 },
        { name: 'Clinch Work', duration_min: 10 },
        { name: 'Sprawl Drills', reps: 30 },
      ],
      difficulty: 'intermediate',
    },
    {
      name: 'MMA Stand-Up Striking',
      category: 'striking',
      duration_minutes: 30,
      exercises: [
        { name: 'Jab-Cross Combinations', rounds: 3, duration_min: 3 },
        { name: 'Footwork Drills', rounds: 3, duration_min: 3 },
        { name: 'Pad Work', rounds: 3, duration_min: 3 },
      ],
      difficulty: 'intermediate',
    },
    {
      name: 'Boxing Technical Rounds',
      category: 'striking',
      duration_minutes: 40,
      description: 'Bag work focusing on angles and combinations.',
      rounds: 4,
      duration_per_round_min: 3,
      difficulty: 'beginner',
    },
    {
      name: 'Submission Transitions',
      category: 'technique',
      duration_minutes: 45,
      exercises: [
        { name: 'Armbar from Guard', reps: 20 },
        { name: 'Triangle Choke', reps: 20 },
        { name: 'Guillotine Choke', reps: 20 },
        { name: 'Submission Chain Drill', reps: 50 },
      ],
      difficulty: 'intermediate',
    },
    {
      name: 'BJJ Positional Sparring',
      category: 'sparring',
      duration_minutes: 30,
      description: 'Start from mount position. 5-min rounds x 3.',
      rounds: 3,
      starting_position: 'mount',
      difficulty: 'beginner',
    },
    {
      name: 'Escape & Reset Drills',
      category: 'technique',
      duration_minutes: 40,
      exercises: [
        { name: 'Mount Escape', reps: 20 },
        { name: 'Side Control Escape', reps: 20 },
        { name: 'Back Control Escape', reps: 20 },
      ],
      difficulty: 'beginner',
    },
    {
      name: 'Competition Simulation',
      category: 'sparring',
      duration_minutes: 60,
      description: '2x 8-min rounds with breaks. Match conditions.',
      rounds: 2,
      duration_per_round_min: 8,
      difficulty: 'advanced',
    },
  ],
};

export const seedStarterDrills = async (userEmail, base44) => {
  const drills = [
    ...STARTER_DRILLS.fitness.slice(0, 5),
    ...STARTER_DRILLS.martial_arts.slice(0, 5),
  ].map(drill => ({
    ...drill,
    user_email: userEmail,
    created_date: new Date().toISOString(),
  }));

  return drills;
};