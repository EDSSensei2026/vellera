import { useState, useEffect } from 'react';

interface CalibrationInput {
  currentWeight: number;
  targetWeight: number;
  avgHeartRate: number;
}

interface Recommendations {
  targetCalories: number;
  intensityLevel: 'Low' | 'Moderate' | 'High';
  focusType: 'Cardio Core' | 'Hypertrophy' | 'Deficit Recovery';
}

export const useBiometricCalibrator = (metrics: CalibrationInput): Recommendations => {
  const [recommendations, setRecommendations] = useState<Recommendations>({
    targetCalories: 2000,
    intensityLevel: 'Moderate',
    focusType: 'Hypertrophy',
  });

  useEffect(() => {
    if (!metrics.currentWeight || !metrics.targetWeight) return;

    let targetCalories = 2000;
    let intensityLevel: 'Low' | 'Moderate' | 'High' = 'Moderate';
    let focusType: 'Cardio Core' | 'Hypertrophy' | 'Deficit Recovery' = 'Hypertrophy';

    const weightDifference = metrics.currentWeight - metrics.targetWeight;

    // Weight delta calculations
    if (weightDifference > 0) {
      targetCalories = Math.round(metrics.currentWeight * 24 * 0.85); // 15% caloric deficit
      focusType = 'Cardio Core';
    } else if (weightDifference < 0) {
      targetCalories = Math.round(metrics.currentWeight * 24 * 1.15); // 15% caloric surplus
      focusType = 'Hypertrophy';
    }

    // Cardiovascular threshold safety adjustments
    if (metrics.avgHeartRate > 100) {
      intensityLevel = 'Low'; 
      if (focusType === 'Cardio Core') focusType = 'Deficit Recovery';
    } else if (metrics.avgHeartRate > 75 && metrics.avgHeartRate <= 100) {
      intensityLevel = 'Moderate';
    } else if (metrics.avgHeartRate > 0 && metrics.avgHeartRate <= 75) {
      intensityLevel = 'High';
    }

    setRecommendations({ targetCalories, intensityLevel, focusType });
  }, [metrics.currentWeight, metrics.targetWeight, metrics.avgHeartRate]);

  return recommendations;
};
