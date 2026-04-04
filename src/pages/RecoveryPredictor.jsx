import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Heart } from 'lucide-react';
import BackButton from '../components/BackButton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

function RecoveryBadge({ score }) {
  if (score >= 80) return <div className="bg-green-900/40 border border-green-700 text-green-400 px-3 py-1.5 rounded-lg text-sm font-bold">Excellent</div>;
  if (score >= 60) return <div className="bg-blue-900/40 border border-blue-700 text-blue-400 px-3 py-1.5 rounded-lg text-sm font-bold">Good</div>;
  if (score >= 40) return <div className="bg-yellow-900/40 border border-yellow-700 text-yellow-400 px-3 py-1.5 rounded-lg text-sm font-bold">Fair</div>;
  return <div className="bg-red-900/40 border border-red-700 text-red-400 px-3 py-1.5 rounded-lg text-sm font-bold">Poor</div>;
}

export default function RecoveryPredictor() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: prediction, isLoading, error, refetch } = useQuery({
    queryKey: ['recovery-prediction', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const res = await base44.functions.invoke('recoveryPredictor', {});
      return res.data?.prediction;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 30,
  });

  if (!user) {
    return (
      <div className="p-4 max-w-lg mx-auto text-center py-16">
        <p className="text-commander-muted">Please log in to view your recovery prediction.</p>
      </div>
    );
  }

  // Prepare forecast chart data
  const forecastData = prediction?.seven_day_forecast ? [
    { day: 'Day 1', score: prediction.seven_day_forecast.day_1 },
    { day: 'Day 2', score: prediction.seven_day_forecast.day_2 },
    { day: 'Day 3', score: prediction.seven_day_forecast.day_3 },
    { day: 'Day 4', score: prediction.seven_day_forecast.day_4 },
    { day: 'Day 5', score: prediction.seven_day_forecast.day_5 },
    { day: 'Day 6', score: prediction.seven_day_forecast.day_6 },
    { day: 'Day 7', score: prediction.seven_day_forecast.day_7 },
  ] : [];

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24 safe-area-top overflow-auto h-screen">
      <div className="flex items-center gap-2 mb-2">
        <BackButton to="/" />
        <div>
          <h1 className="text-white text-xl font-black">Recovery Predictor</h1>
          <p className="text-commander-muted text-xs">AI-powered 7-day forecast using Whoop & biometrics</p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-vellera-blue" />
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4">
          <p className="text-red-300 text-sm">Failed to load prediction: {error.message}</p>
          <button onClick={() => refetch()} className="text-red-400 text-xs font-bold mt-2 hover:text-red-300">Retry</button>
        </div>
      )}

      {prediction && (
        <div className="space-y-4">
          {/* Current Status */}
          <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-commander-muted uppercase tracking-widest">Current Recovery</p>
              <RecoveryBadge score={prediction.current_recovery_score} />
            </div>

            <div className="flex items-end gap-3">
              <div>
                <p className="text-5xl font-black text-vellera-blue">{prediction.current_recovery_score}</p>
                <p className="text-commander-muted text-xs">/ 100</p>
              </div>
              <div className="flex-1">
                <p className="text-commander-muted text-xs mb-1">Trend</p>
                <div className="flex items-center gap-2">
                  {prediction.trend === 'improving' && <TrendingUp className="w-4 h-4 text-green-400" />}
                  {prediction.trend === 'declining' && <TrendingDown className="w-4 h-4 text-red-400" />}
                  {prediction.trend === 'stable' && <Heart className="w-4 h-4 text-yellow-400" />}
                  <span className="text-sm font-bold capitalize text-white">{prediction.trend}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Indicators */}
          {prediction.key_indicators && (
            <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-2">
              <p className="text-xs text-commander-muted uppercase tracking-widest mb-2">Key Indicators</p>
              {Object.entries(prediction.key_indicators).map(([key, val]) => (
                <div key={key} className="border-b border-commander-border/50 pb-2 last:border-0 last:pb-0">
                  <p className="text-white text-xs font-bold capitalize">{key.replace('_', ' ')}</p>
                  <p className="text-commander-muted text-xs">{val}</p>
                </div>
              ))}
            </div>
          )}

          {/* 7-Day Forecast */}
          {forecastData.length > 0 && (
            <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
              <p className="text-xs text-commander-muted uppercase tracking-widest">7-Day Forecast</p>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="day" stroke="#999" />
                  <YAxis stroke="#999" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#00E5FF" strokeWidth={2} dot={{ fill: '#00E5FF', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recommendations */}
          {prediction.recommendations && prediction.recommendations.length > 0 && (
            <div className="bg-vellera-green/10 border border-vellera-green/40 rounded-xl p-4 space-y-2">
              <p className="text-vellera-green text-xs font-bold uppercase tracking-widest">Recommendations</p>
              <div className="space-y-1.5">
                {prediction.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-vellera-green flex-shrink-0 mt-0.5" />
                    <p className="text-white text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Injury Risk Factors */}
          {prediction.injury_risk_factors && prediction.injury_risk_factors.length > 0 && (
            <div className="bg-red-900/20 border border-red-700 rounded-xl p-4 space-y-2">
              <p className="text-red-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Risk Factors
              </p>
              <div className="space-y-1.5">
                {prediction.injury_risk_factors.map((risk, i) => (
                  <p key={i} className="text-red-300 text-sm">• {risk}</p>
                ))}
              </div>
            </div>
          )}

          {/* Confidence Score */}
          <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
            <p className="text-commander-muted text-xs mb-2">Prediction Confidence</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-vellera-blue h-full transition-all"
                  style={{ width: `${prediction.confidence_score}%` }}
                />
              </div>
              <p className="text-white font-bold text-sm w-12 text-right">{prediction.confidence_score}%</p>
            </div>
          </div>

          <button
            onClick={() => refetch()}
            className="w-full bg-vellera-blue/20 border border-vellera-blue text-vellera-blue py-3 rounded-xl font-bold text-sm hover:bg-vellera-blue/30 transition-all"
          >
            Refresh Prediction
          </button>
        </div>
      )}
    </div>
  );
}