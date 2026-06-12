import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { ArrowLeft, Calendar, TrendingUp, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function PersonalizedTrainingDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activePlan, setActivePlan] = useState(null);
  const [upcomingWorkouts, setUpcomingWorkouts] = useState([]);
  const [biometricsTrend, setBiometricsTrend] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Get current user
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Load active training plan
        const plans = await base44.entities.TrainingPlan.filter({
          created_by: currentUser.email,
        }, "-created_date", 1);
        
        if (plans.length > 0) {
          setActivePlan(plans[0]);
        }

        // Load upcoming workouts (next 7 days)
        const today = new Date();
        const sessions = await base44.entities.TrainingSession.filter({
          created_by: currentUser.email,
        }, "-date", 20);
        
        const upcoming = sessions.filter(s => new Date(s.date) >= today).slice(0, 5);
        setUpcomingWorkouts(upcoming);

        // Load biometric trend (last 14 days)
        const biometrics = await base44.entities.BiometricLog.filter({
          created_by: currentUser.email,
        }, "-date", 14);
        
        const trendData = biometrics.reverse().map(log => ({
          date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          recovery: log.recovery_pct || 0,
          hrv: log.hrv || 0,
          sleep: log.sleep_performance || 0,
        }));
        
        setBiometricsTrend(trendData);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const getRecoveryColor = (score) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-commander-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-vellera-blue" />
      </div>
    );
  }

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
          <div>
            <h1 className="text-xl font-black">Your Training Hub</h1>
            <p className="text-commander-muted text-xs">Welcome back, {user?.full_name || "athlete"}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Active Training Plan */}
        {activePlan && (
          <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold">Active Training Plan</h2>
              <span className="bg-green-900/30 border border-green-800 text-green-400 text-xs font-bold px-2 py-1 rounded-lg">
                Active
              </span>
            </div>
            
            <div className="space-y-2">
              <div>
                <p className="text-commander-muted text-xs">Plan Name</p>
                <p className="text-white font-semibold">{activePlan.plan_name}</p>
              </div>
              
              <div>
                <p className="text-commander-muted text-xs">Primary Goal</p>
                <p className="text-white capitalize">{activePlan.primary_goal?.replace(/_/g, " ")}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-commander-muted text-xs">Phase</p>
                  <p className="text-vellera-blue font-bold text-lg">{activePlan.current_phase || 1} / {activePlan.total_phases || "—"}</p>
                </div>
                <div>
                  <p className="text-commander-muted text-xs">Days Left</p>
                  <p className="text-vellera-green font-bold text-lg">
                    {activePlan.end_date ? 
                      Math.max(0, Math.ceil((new Date(activePlan.end_date) - new Date()) / 86400000))
                      : "—"}
                  </p>
                </div>
              </div>

              {activePlan.notes && (
                <div className="pt-2 border-t border-commander-border">
                  <p className="text-commander-muted text-xs">Notes</p>
                  <p className="text-gray-300 text-sm">{activePlan.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upcoming Workouts */}
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-vellera-blue" />
            <h2 className="text-white font-bold">Upcoming Workouts</h2>
          </div>

          {upcomingWorkouts.length > 0 ? (
            <div className="space-y-2">
              {upcomingWorkouts.map((workout, idx) => (
                <div key={idx} className="bg-gray-800/50 border border-commander-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white font-semibold text-sm">{workout.session_type || "Workout"}</p>
                    <span className="text-commander-muted text-xs">
                      {new Date(workout.date).toLocaleDateString("en-US", { 
                        month: "short", 
                        day: "numeric",
                        weekday: "short"
                      })}
                    </span>
                  </div>
                  
                  {workout.duration_minutes && (
                    <p className="text-commander-muted text-xs">⏱️ {workout.duration_minutes} min</p>
                  )}
                  
                  {workout.intensity && (
                    <p className="text-vellera-green text-xs font-semibold">
                      {workout.intensity.toUpperCase()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-commander-muted text-sm">No upcoming workouts scheduled.</p>
          )}
        </div>

        {/* Biometric Progress Trend */}
        {biometricsTrend.length > 0 && (
          <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-vellera-green" />
              <h2 className="text-white font-bold">Recovery Trend (14 Days)</h2>
            </div>

            <div className="w-full h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={biometricsTrend}>
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
                  <Line 
                    type="monotone" 
                    dataKey="recovery" 
                    stroke="#00E5FF" 
                    dot={false} 
                    strokeWidth={2}
                    name="Recovery"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sleep" 
                    stroke="#CCFF00" 
                    dot={false} 
                    strokeWidth={2}
                    name="Sleep Quality"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Latest Metrics */}
            {biometricsTrend.length > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-commander-border">
                <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                  <p className="text-commander-muted text-xs">Latest Recovery</p>
                  <p className={`text-xl font-bold ${getRecoveryColor(biometricsTrend[biometricsTrend.length - 1].recovery)}`}>
                    {biometricsTrend[biometricsTrend.length - 1].recovery}%
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                  <p className="text-commander-muted text-xs">Sleep Quality</p>
                  <p className="text-vellera-green text-xl font-bold">
                    {biometricsTrend[biometricsTrend.length - 1].sleep}%
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!activePlan && upcomingWorkouts.length === 0 && biometricsTrend.length === 0 && (
          <div className="bg-commander-surface border border-commander-border rounded-xl p-6 text-center">
            <p className="text-commander-muted text-sm">No training data yet. Start logging workouts and connect your wearables to see personalized insights.</p>
          </div>
        )}
      </div>
    </div>
  );
}