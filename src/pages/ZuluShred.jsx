import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { ArrowLeft, TrendingDown, Flame, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ZuluShred() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [weeklyMetrics, setWeeklyMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadShredData = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser) {
          navigate("/auth");
          return;
        }
        setUser(currentUser);

        // Fetch Shred plan
        const plans = await base44.entities.TrainingPlan.filter(
          { created_by: currentUser.email, plan_name: { $contains: "Shred" } },
          { limit: 1 }
        );

        if (plans.length > 0) {
          setPlan(plans[0]);
        }

        // Fetch today's shred metrics
        const today = new Date().toISOString().split("T")[0];
        const todayMetrics = await base44.entities.ZuluShredMetrics.filter(
          { date: today, created_by: currentUser.email },
          { limit: 1 }
        );

        if (todayMetrics.length > 0) {
          setMetrics(todayMetrics[0]);
        }

        // Fetch last 30 days for progress chart
        const allMetrics = await base44.entities.ZuluShredMetrics.filter(
          { created_by: currentUser.email },
          { limit: 30 }
        );

        const sortedMetrics = allMetrics
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .map((m) => ({
            date: m.date,
            weight: m.current_weight_lbs,
            protein: m.protein_intake_g,
          }));

        setWeeklyMetrics(sortedMetrics);
      } catch (err) {
        console.error("Failed to load shred data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadShredData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-commander-dark flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  const progress = plan ? Math.round(((260 - (metrics?.current_weight_lbs || 260)) / (260 - 225)) * 100) : 0;
  const lbsLost = (metrics?.current_weight_lbs || 260) ? Math.round(260 - (metrics?.current_weight_lbs || 260)) : 0;
  const lbsRemaining = Math.max(0, (metrics?.current_weight_lbs || 260) - 225);

  const proteinCompliance = metrics
    ? Math.round((metrics.protein_intake_g / metrics.protein_target_g) * 100)
    : 0;

  const carbTiming = metrics?.carb_cycling_type;

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-24 safe-area-top">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="text-commander-muted hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white text-2xl font-black">Zulu Shred v3.0</h1>
      </div>

      {/* Warrior Credo */}
      <div className="bg-gradient-to-r from-vellera-green/20 to-vellera-blue/20 border border-vellera-green/50 rounded-xl p-4">
        <p className="text-vellera-green font-black text-sm">⚔️ THE BLADE</p>
        <p className="text-white text-sm font-semibold mt-2">
          "260 is the current armor; 225 is the sharpened blade. Every rep carves the man in the picture out of the stone."
        </p>
        <p className="text-commander-muted text-xs mt-2">Hunger is the feeling of the 225-lb protector waking up. Fuel the muscle, starve the fat.</p>
      </div>

      {/* Recomposition Progress */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-commander-muted text-xs uppercase font-bold mb-1">RECOMPOSITION PROGRESS</p>
            <p className="text-white text-3xl font-black">{metrics?.current_weight_lbs || 260} lbs</p>
            <p className="text-vellera-green text-sm font-bold">Target: 225 lbs</p>
          </div>
          <div className="text-right">
            <p className="text-vellera-green text-2xl font-black">↓ {lbsLost} lbs</p>
            <p className="text-commander-muted text-xs">{lbsRemaining} lbs remaining</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-gray-800 rounded-full h-3">
            <div className="bg-gradient-to-r from-vellera-green to-vellera-blue h-3 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-commander-muted">{progress}% shred complete</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="bg-gray-800/50 rounded-lg p-2 text-center">
            <p className="text-commander-muted text-xs">Weekly Loss</p>
            <p className="text-white font-bold">{metrics?.weight_loss_this_week || 0} lbs</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-2 text-center">
            <p className="text-commander-muted text-xs">Est. Finish</p>
            <p className="text-white font-bold">
              {lbsRemaining > 0 ? `${Math.ceil(lbsRemaining / 1.5)} weeks` : "Complete"}
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-2 text-center">
            <p className="text-commander-muted text-xs">Weekly Strain</p>
            <p className="text-white font-bold">{metrics?.weekly_strain_avg?.toFixed(1) || "—"}</p>
          </div>
        </div>
      </div>

      {/* Protein & Carb Cycling */}
      <div className="grid grid-cols-2 gap-3">
        {/* Protein */}
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-2">
          <p className="text-vellera-blue font-bold text-sm flex items-center gap-1">
            <Flame className="w-4 h-4" /> PROTEIN CEILING
          </p>
          <p className="text-white text-2xl font-black">{metrics?.protein_intake_g || 0}g</p>
          <p className="text-commander-muted text-xs">Target: {metrics?.protein_target_g || 260}g (1.2g/lb)</p>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div className="bg-vellera-blue h-2 rounded-full" style={{ width: `${Math.min(100, proteinCompliance)}%` }} />
          </div>
          <p className="text-xs text-vellera-blue font-bold">{proteinCompliance}% compliance</p>
        </div>

        {/* Carb Cycling */}
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-2">
          <p className="text-vellera-green font-bold text-sm flex items-center gap-1">
            <Zap className="w-4 h-4" /> CARB TIMING
          </p>
          <p className="text-white font-black capitalize">{carbTiming || "—"}</p>
          <p className="text-commander-muted text-xs">
            {carbTiming === "targeted"
              ? "50g complex carbs 90m pre-PM BJJ/MMA"
              : carbTiming === "low_carb"
              ? "Fats + Proteins (Rest days)"
              : "—"}
          </p>
        </div>
      </div>

      {/* Weight Loss Chart */}
      {weeklyMetrics.length > 0 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-4">
          <h2 className="text-white font-bold flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-vellera-green" /> 30-Day Recomposition Arc
          </h2>
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" fontSize={10} />
                <YAxis stroke="#888" domain={[220, 265]} />
                <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} />
                <Line type="monotone" dataKey="weight" stroke="#CCFF00" name="Weight (lbs)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Whoop Triggers */}
      <div className="space-y-2">
        {metrics?.fat_loss_trigger_applied && (
          <div className="bg-green-900/30 border border-green-700 rounded-xl p-3">
            <p className="text-green-300 text-sm font-bold">🔥 FAT LOSS TRIGGER ACTIVE</p>
            <p className="text-green-200 text-xs mt-1">Weekly loss &lt;1.5 lbs + Green recovery. +10m Impi finisher engaged.</p>
          </div>
        )}

        {metrics?.preservation_trigger_applied && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-3">
            <p className="text-red-300 text-sm font-bold">🛑 PRESERVATION TRIGGER ACTIVE</p>
            <p className="text-red-200 text-xs mt-1">Recovery &lt;34%. +300kcal (Protein/Fats) to prevent metabolic crash.</p>
          </div>
        )}

        {!metrics?.fat_loss_trigger_applied && !metrics?.preservation_trigger_applied && (
          <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-3">
            <p className="text-blue-300 text-sm font-bold">⚡ STANDARD PROTOCOL ACTIVE</p>
            <p className="text-blue-200 text-xs mt-1">260g Protein. AM Heavy + 15m Zone 2. PM HIIT BJJ/MMA. Carb cycling engaged.</p>
          </div>
        )}
      </div>

      {/* Weekly Schedule (Shred Split) */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
        <h2 className="text-white font-bold">Zulu Shred Split (This Week)</h2>
        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-2">
            <span className="text-vellera-blue font-bold">MON:</span>
            <span className="text-gray-300">Shield (Heavy Upper) + 15m Zone 2 → BJJ Fund (HIIT)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-vellera-blue font-bold">TUE:</span>
            <span className="text-gray-300">Charge (Heavy Lower) + 15m Zone 2 → MMA Striking (HIIT)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-vellera-blue font-bold">WED:</span>
            <span className="text-gray-300">Mobility Flow → Technical BJJ (Low Strain)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-vellera-blue font-bold">THU:</span>
            <span className="text-gray-300">Density (Heavy Posterior) + 15m Zone 2 → Live Rolling (HIIT)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-vellera-blue font-bold">FRI:</span>
            <span className="text-gray-300">Impi (Heavy Push) + 15m Zone 2 → MMA Sparring (HIIT)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-vellera-blue font-bold">SAT:</span>
            <span className="text-gray-300">Speed Sprints + 10m Zone 2 → Open Mat Comp Prep</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-vellera-blue font-bold">SUN:</span>
            <span className="text-gray-300">Complete Reset: Mobility + Rest</span>
          </div>
        </div>
      </div>

      {/* Fasting Window */}
      <div className="bg-purple-900/20 border border-purple-700 rounded-xl p-3">
        <p className="text-purple-300 text-sm font-bold">🕐 16:8 INTERMITTENT FASTING</p>
        <p className="text-purple-200 text-xs mt-1">12 PM – 8 PM eating window. Simplifies CEO/PhD schedule. Caloric control + hormonal optimization.</p>
      </div>
    </div>
  );
}