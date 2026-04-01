import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Loader2, AlertCircle, TrendingDown, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from "recharts";

export default function BiometricsDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [biometrics, setBiometrics] = useState([]);
  const [hrvTrend, setHrvTrend] = useState([]);
  const [trainingLoadData, setTrainingLoadData] = useState([]);
  const [recoveryInsights, setRecoveryInsights] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadBiometrics = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Fetch last 30 days of biometric data
        const logs = await base44.entities.BiometricLog.filter({
          created_by: currentUser.email,
        }, "-date", 30);

        if (logs.length === 0) {
          setLoading(false);
          return;
        }

        setBiometrics(logs);

        // Process HRV trend
        const hrvData = logs.reverse().map(log => ({
          date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          hrv: log.hrv || 0,
          rhr: log.resting_hr || 0,
        }));
        setHrvTrend(hrvData);

        // Process training load (gas level as proxy)
        const trainingData = logs.map(log => ({
          date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          load: log.gas_level || 0,
          recovery: log.recovery_pct || 0,
        }));
        setTrainingLoadData(trainingData);

        // Calculate recovery insights
        const avgRecovery = Math.round(
          logs.reduce((sum, log) => sum + (log.recovery_pct || 0), 0) / logs.length
        );
        const avgHrv = Math.round(
          logs.reduce((sum, log) => sum + (log.hrv || 0), 0) / logs.length
        );
        const latestRecovery = logs[logs.length - 1]?.recovery_pct || 0;
        const isRecovering = latestRecovery > avgRecovery;

        setRecoveryInsights({
          avgRecovery,
          avgHrv,
          latestRecovery,
          isRecovering,
          trend: isRecovering ? "improving" : "declining",
        });
      } catch (err) {
        console.error("Failed to load biometrics:", err);
      } finally {
        setLoading(false);
      }
    };

    loadBiometrics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-commander-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-vellera-blue" />
      </div>
    );
  }

  const getRecoveryColor = (value) => {
    if (value >= 80) return { text: "text-green-400", bg: "bg-green-900/30", border: "border-green-800" };
    if (value >= 60) return { text: "text-yellow-400", bg: "bg-yellow-900/30", border: "border-yellow-800" };
    return { text: "text-red-400", bg: "bg-red-900/30", border: "border-red-800" };
  };

  const recoveryColor = recoveryInsights ? getRecoveryColor(recoveryInsights.latestRecovery) : {};

  return (
    <div className="min-h-screen bg-commander-dark text-white safe-area-top overflow-auto pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-commander-dark/95 backdrop-blur border-b border-commander-border px-4 py-4">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="text-commander-muted hover:text-white transition-all touch-target-min"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-black">Biometrics Hub</h1>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {biometrics.length === 0 ? (
          <div className="bg-commander-surface border border-commander-border rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-commander-muted mx-auto mb-3 opacity-50" />
            <p className="text-commander-muted text-sm">No biometric data available. Connect a fitness device (Whoop, Fitbit, Strava) to see insights.</p>
          </div>
        ) : (
          <>
            {/* Recovery Status Card */}
            {recoveryInsights && (
              <div className={`${recoveryColor.bg} border ${recoveryColor.border} rounded-xl p-4 space-y-3`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-white font-bold">Recovery Status</h2>
                  {recoveryInsights.isRecovering ? (
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-commander-muted text-xs">Current</p>
                    <p className={`text-2xl font-black ${recoveryColor.text}`}>
                      {recoveryInsights.latestRecovery}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-commander-muted text-xs">30-Day Avg</p>
                    <p className="text-vellera-blue text-2xl font-black">{recoveryInsights.avgRecovery}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-commander-muted text-xs">Avg HRV</p>
                    <p className="text-vellera-green text-2xl font-black">{recoveryInsights.avgHrv}</p>
                  </div>
                </div>

                <p className="text-white text-sm font-semibold">
                  {recoveryInsights.isRecovering 
                    ? "✅ Your recovery is improving—good time to push harder."
                    : "⚠️ Recovery declining—consider lighter training today."}
                </p>
              </div>
            )}

            {/* Heart Rate Variability Trend */}
            <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-4">
              <h2 className="text-white font-bold flex items-center gap-2">
                <span className="text-vellera-blue">💓</span> Heart Rate Variability (30 Days)
              </h2>
              
              <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hrvTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#1a1a1a", 
                        border: "1px solid #333",
                        borderRadius: "8px"
                      }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="hrv" 
                      stroke="#00E5FF" 
                      dot={false} 
                      strokeWidth={2}
                      name="HRV (ms)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="rhr" 
                      stroke="#CCFF00" 
                      dot={false} 
                      strokeWidth={2}
                      name="Resting HR (bpm)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-300">
                <p className="font-semibold text-white mb-1">💡 HRV Insight</p>
                <p>Higher HRV indicates better recovery and parasympathetic tone. Low HRV may signal overtraining or illness.</p>
              </div>
            </div>

            {/* Training Load vs Recovery */}
            <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-4">
              <h2 className="text-white font-bold flex items-center gap-2">
                <span className="text-orange-400">⚡</span> Training Load & Recovery Balance
              </h2>

              <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trainingLoadData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#1a1a1a", 
                        border: "1px solid #333",
                        borderRadius: "8px"
                      }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Legend />
                    <Bar dataKey="load" fill="#FF6B6B" name="Training Load" />
                    <Bar dataKey="recovery" fill="#00E5FF" name="Recovery %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-300">
                <p className="font-semibold text-white mb-1">💡 Load Insight</p>
                <p>Aim for high training days followed by adequate recovery. Spike in load without recovery increase risks overtraining.</p>
              </div>
            </div>

            {/* Actionable Insights */}
            <div className="bg-vellera-blue/10 border border-vellera-blue/30 rounded-xl p-4 space-y-3">
              <h2 className="text-white font-bold">📊 Today's Recommendations</h2>
              
              <div className="space-y-2 text-sm">
                {recoveryInsights?.latestRecovery >= 80 && (
                  <div className="flex items-start gap-2">
                    <span className="text-green-400 font-bold">✓</span>
                    <p className="text-gray-200">Excellent recovery—today is ideal for high-intensity work or strength training.</p>
                  </div>
                )}
                
                {recoveryInsights?.latestRecovery >= 60 && recoveryInsights?.latestRecovery < 80 && (
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-400 font-bold">⚠</span>
                    <p className="text-gray-200">Moderate recovery—consider moderate intensity. Save peak efforts for tomorrow.</p>
                  </div>
                )}
                
                {recoveryInsights?.latestRecovery < 60 && (
                  <div className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">!</span>
                    <p className="text-gray-200">Low recovery—prioritize mobility, sleep, and nutrition. Light activity only.</p>
                  </div>
                )}

                {recoveryInsights?.avgHrv > 50 && (
                  <div className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">✓</span>
                    <p className="text-gray-200">Strong HRV baseline—your parasympathetic system is well-trained.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}