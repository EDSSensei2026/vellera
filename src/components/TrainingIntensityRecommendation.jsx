import { AlertCircle, Zap, Activity, Flame } from 'lucide-react';

const RECOMMENDATIONS = [
  {
    range: [0, 40],
    label: "REST DAY",
    icon: AlertCircle,
    color: "bg-red-950 border-red-800",
    textColor: "text-red-300",
    iconColor: "text-red-400",
    guidance: "Recovery priority. Light mobility, yoga, or complete rest.",
  },
  {
    range: [41, 60],
    label: "EASY",
    icon: Activity,
    color: "bg-yellow-950 border-yellow-800",
    textColor: "text-yellow-300",
    iconColor: "text-yellow-400",
    guidance: "Technique work only. 30-min Zone 2 cardio max.",
  },
  {
    range: [61, 80],
    label: "MODERATE",
    icon: Zap,
    color: "bg-blue-950 border-blue-800",
    textColor: "text-blue-300",
    iconColor: "text-blue-400",
    guidance: "Normal training. Open mat, light sparring OK.",
  },
  {
    range: [81, 100],
    label: "PEAK",
    icon: Flame,
    color: "bg-green-950 border-green-800",
    textColor: "text-green-300",
    iconColor: "text-green-400",
    guidance: "Full intensity. Compete, max strength, heavy sparring.",
  },
];

export default function TrainingIntensityRecommendation({ recovery = null, sleep = null, hrv = null }) {
  if (recovery === null && sleep === null && hrv === null) {
    return (
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
        <p className="text-white text-sm font-bold mb-2">Today's Training Recommendation</p>
        <p className="text-commander-muted text-xs">Connect a wearable (Whoop, Fitbit, Oura) to get personalized intensity guidance.</p>
      </div>
    );
  }

  // Calculate recommendation score from available metrics
  let score = 0;
  let dataPoints = 0;

  if (recovery !== null && recovery !== undefined) {
    score += recovery;
    dataPoints++;
  }
  if (sleep !== null && sleep !== undefined) {
    score += sleep * 0.8; // Sleep slightly weighted lower
    dataPoints++;
  }
  if (hrv !== null && hrv !== undefined) {
    // Normalize HRV (typical range 20-100 ms, map to 0-100)
    const normalized = Math.min(100, Math.max(0, (hrv / 100) * 100));
    score += normalized;
    dataPoints++;
  }

  const avgScore = dataPoints > 0 ? Math.round(score / dataPoints) : 0;
  const recommendation = RECOMMENDATIONS.find(r => avgScore >= r.range[0] && avgScore <= r.range[1]) || RECOMMENDATIONS[0];
  const Icon = recommendation.icon;

  return (
    <div className={`border rounded-xl p-4 ${recommendation.color}`}>
      <div className="flex items-start gap-3 mb-2">
        <Icon className={`w-5 h-5 ${recommendation.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <p className={`font-black text-lg ${recommendation.textColor}`}>{recommendation.label}</p>
          <p className={`text-xs ${recommendation.textColor} opacity-75`}>Recovery Score: {avgScore}</p>
        </div>
      </div>

      <p className="text-white text-sm mb-3">{recommendation.guidance}</p>

      {/* Data breakdown */}
      <div className="grid grid-cols-3 gap-2">
        {recovery !== null && (
          <div className="bg-black/30 rounded-lg p-2 text-center">
            <p className={`font-bold text-sm ${recommendation.textColor}`}>{recovery}%</p>
            <p className="text-xs text-commander-muted">Recovery</p>
          </div>
        )}
        {sleep !== null && (
          <div className="bg-black/30 rounded-lg p-2 text-center">
            <p className={`font-bold text-sm ${recommendation.textColor}`}>{sleep}%</p>
            <p className="text-xs text-commander-muted">Sleep</p>
          </div>
        )}
        {hrv !== null && (
          <div className="bg-black/30 rounded-lg p-2 text-center">
            <p className={`font-bold text-sm ${recommendation.textColor}`}>{Math.round(hrv)}</p>
            <p className="text-xs text-commander-muted">HRV</p>
          </div>
        )}
      </div>
    </div>
  );
}