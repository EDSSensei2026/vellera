import { useState, useEffect } from 'react';

export const useBiometricCalibrator = (metrics) => {
  const [recommendations, setRecommendations] = useState({
    targetCalories: 2000,
    intensityLevel: 'Moderate',
    focusType: 'Hypertrophy',
  });

  useEffect(() => {
    if (!metrics.currentWeight || !metrics.targetWeight) return;

    let targetCalories = 2000;
    let intensityLevel = 'Moderate';
    let focusType = 'Hypertrophy';

    const weightDifference = metrics.currentWeight - metrics.targetWeight;

    // Weight adjustment engine
    if (weightDifference > 0) {
      targetCalories = Math.round(metrics.currentWeight * 24 * 0.85); // 15% caloric deficit
      focusType = 'Cardio Core';
    } else if (weightDifference < 0) {
      targetCalories = Math.round(metrics.currentWeight * 24 * 1.15); // 15% surplus
      focusType = 'Hypertrophy';
    }

    // Cardiovascular safety pacing logic
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
