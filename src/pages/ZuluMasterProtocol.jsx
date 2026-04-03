import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Zap, Heart, Shield, Flame, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MovementGuide from "../components/MovementGuide";

export default function ZuluMasterProtocol() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [recovery, setRecovery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [movements, setMovements] = useState([]);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [movementLoading, setMovementLoading] = useState(false);

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser) {
          navigate("/auth");
          return;
        }
        setUser(currentUser);

        const profiles = await base44.entities.UserProfile.filter({
          created_by: currentUser.email,
        });

        if (profiles.length > 0) {
          setProfile(profiles[0]);
        }
      } catch (err) {
        console.error("Failed to load master protocol data:", err);
      } finally {
        setLoading(false);
      }
    };

    const loadMovementLibrary = async () => {
      try {
        setMovementLoading(true);
        const response = await base44.functions.invoke("getMovementLibrary", { category: null });
        if (response.data?.exercises) {
          setMovements(response.data.exercises);
        }
      } catch (err) {
        console.error("Failed to load movement library:", err);
      } finally {
        setMovementLoading(false);
      }
    };

    loadMasterData();
    loadMovementLibrary();
  }, [navigate]);

  const dayOfWeek = new Date().getDay();
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const today = dayNames[dayOfWeek];

  const weeklySchedule = {
    MON: { am: "THE LAB w/ Colin Eaton (05:00-06:30)", pm: "BJJ Fundamentals (18:00)", lab: true },
    TUE: { am: "THE LAB w/ Colin Eaton (05:00-06:30)", pm: "MMA Striking (18:00)", lab: true },
    WED: { am: "Shield Recovery (Mobility/90-90 Flow)", pm: "Technical BJJ (18:00)", lab: false },
    THU: { am: "THE LAB w/ Colin Eaton (05:00-06:30)", pm: "BJJ Live Rolling (18:00)", lab: true },
    FRI: { am: "The Impi (Dips, Landmine, Leg Raises)", pm: "MMA Sparring (18:00)", lab: false },
    SAT: { am: "The Charge (Sprints + Heavy Bag)", pm: "Open Mat / Comp Prep", lab: false },
    SUN: { am: "System Reset", pm: "Family / Garden / PhD Research", lab: false },
  };

  const todaySchedule = weeklySchedule[today] || {};

  if (loading) {
    return (
      <div className="min-h-screen bg-commander-dark flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentWeight = profile?.zulu_current_weight_lbs || 260;
  const targetWeight = profile?.zulu_target_weight_lbs || 225;
  const progress = Math.round(((260 - currentWeight) / (260 - targetWeight)) * 100);

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-24 safe-area-top">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="text-commander-muted hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white text-2xl font-black">Zulu Warrior v5.1</h1>
        <span className="text-vellera-green text-xs font-bold">Master Protocol</span>
      </div>

      {/* Warrior Identity */}
      <div className="bg-gradient-to-r from-vellera-blue/20 to-vellera-green/20 border border-vellera-blue/50 rounded-xl p-4">
        <p className="text-vellera-blue font-black text-sm">⚔️ WARRIOR IDENTITY</p>
        <p className="text-white font-bold mt-2">Asaad Morman | 43 | CEO | CISO | BJJ Competitor</p>
        <p className="text-gray-300 text-xs mt-1">Transformation: 260 lbs → 215-225 lbs (Lean Warrior Aesthetic)</p>
        <p className="text-gray-300 text-xs">Coach: Colin Eaton | Integration: Whoop 5.0 | Protocol Start: April 6, 2026</p>
      </div>

      {/* Today's Protocol */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
        <p className="text-commander-muted text-xs uppercase font-bold">TODAY ({today})</p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-vellera-blue font-bold flex-1">AM:</span>
            <span className="text-gray-300">{todaySchedule.am}</span>
            {todaySchedule.lab && <span className="text-vellera-green text-xs font-bold">🏋️ LAB</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-vellera-blue font-bold flex-1">PM:</span>
            <span className="text-gray-300">{todaySchedule.pm}</span>
          </div>
        </div>
      </div>

      {/* Transformation Progress */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
        <p className="text-commander-muted text-xs uppercase font-bold">Shred Progress</p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-white text-3xl font-black">{currentWeight} lbs</p>
            <p className="text-vellera-green text-sm">Target: {targetWeight} lbs</p>
          </div>
          <div className="text-right">
            <p className="text-vellera-green text-xl font-bold">↓ {260 - currentWeight} lbs</p>
            <p className="text-commander-muted text-xs">{260 - currentWeight > 0 ? targetWeight - currentWeight : 0} lbs remaining</p>
          </div>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-3">
          <div className="bg-gradient-to-r from-vellera-green to-vellera-blue h-3 rounded-full transition-all" style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
        <p className="text-xs text-commander-muted">{progress}% complete</p>
      </div>

      {/* Whoop Bio-Logic */}
      <div className="space-y-2">
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
          <p className="text-green-300 text-sm font-bold flex items-center gap-2">
            <Heart className="w-4 h-4" /> GREEN RECOVERY (&gt;67%)
          </p>
          <p className="text-green-200 text-xs mt-1">Progress Load +2.5%. Clear for High-Intensity PM Combat. Attack.</p>
        </div>
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3">
          <p className="text-yellow-300 text-sm font-bold flex items-center gap-2">
            <Zap className="w-4 h-4" /> YELLOW RECOVERY (34-66%)
          </p>
          <p className="text-yellow-200 text-xs mt-1">Maintenance Load. PM Combat = Drills Only. No Failure Sets.</p>
        </div>
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
          <p className="text-red-300 text-sm font-bold flex items-center gap-2">
            <Shield className="w-4 h-4" /> RED RECOVERY (&lt;34%)
          </p>
          <p className="text-red-200 text-xs mt-1">Cancel AM Lift → 15m Specialized Stretch. PM = Absolute Rest.</p>
        </div>
      </div>

      {/* Nutritional Parameters */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
        <p className="text-vellera-green font-bold text-sm flex items-center gap-2">
          <Flame className="w-4 h-4" /> NUTRITIONAL SHRED
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-800/50 rounded-lg p-2">
            <p className="text-commander-muted text-xs">Daily Protein</p>
            <p className="text-white font-bold">{profile?.daily_protein_target_g || 260}g</p>
            <p className="text-gray-400 text-xs">Muscle preservation</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-2">
            <p className="text-commander-muted text-xs">Pre-PM Carbs</p>
            <p className="text-white font-bold">{profile?.carb_timing_pre_pm_g || 50}g</p>
            <p className="text-gray-400 text-xs">90m before session</p>
          </div>
        </div>
        <p className="text-xs text-gray-300 mt-2">16:8 Fasting Window optional for CEO/PhD focus. High electrolytes for recovery + BJJ fluid loss.</p>
      </div>

      {/* Visual Movement Guide */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
        <p className="text-commander-muted text-xs uppercase font-bold flex items-center gap-2">
          <Eye className="w-4 h-4" /> Visual Movement Library
        </p>
        {movementLoading ? (
          <p className="text-commander-muted text-xs">Loading exercises...</p>
        ) : movements.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {movements.map((move) => (
              <button
                key={move.id}
                onClick={() => setSelectedMovement(move)}
                className={`rounded-lg p-2 text-left transition-all ${
                  move.category === "Forge"
                    ? "bg-blue-900/30 hover:bg-blue-900/50 border border-blue-700 text-blue-300"
                    : move.category === "Charge"
                    ? "bg-green-900/30 hover:bg-green-900/50 border border-green-700 text-green-300"
                    : move.category === "Combat"
                    ? "bg-red-900/30 hover:bg-red-900/50 border border-red-700 text-red-300"
                    : "bg-purple-900/30 hover:bg-purple-900/50 border border-purple-700 text-purple-300"
                }`}
              >
                <p className="font-bold">{move.exercise_name}</p>
                <p className="text-xs opacity-75">{move.category}</p>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-commander-muted text-xs">No exercises loaded yet.</p>
        )}
      </div>

      {/* Weekly Master Schedule */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
        <p className="text-commander-muted text-xs uppercase font-bold">Master Schedule</p>
        <div className="space-y-2 text-xs">
          {Object.entries(weeklySchedule).map(([day, schedule]) => (
            <div
              key={day}
              className={`rounded-lg p-2 ${day === today ? "bg-vellera-blue/20 border border-vellera-blue" : "bg-gray-800/50"}`}
            >
              <p className="text-white font-bold">{day}</p>
              <p className="text-gray-300 text-xs mt-0.5">{schedule.am}</p>
              <p className="text-gray-300 text-xs">{schedule.pm}</p>
              {schedule.lab && <p className="text-vellera-blue text-xs font-bold mt-1">🏋️ Lab w/ Colin</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Warrior Credo */}
      <div className="space-y-2">
        <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-3">
          <p className="text-purple-300 text-sm font-bold">🛡️ PROTECTOR</p>
          <p className="text-purple-200 text-xs mt-1">"Your strength is the shield for Shauntze and your son. Lead by example."</p>
        </div>
        <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-3">
          <p className="text-orange-300 text-sm font-bold">🗿 PROVIDER</p>
          <p className="text-orange-200 text-xs mt-1">"260 is the stone; 225 is the statue. Carve the man in the picture every single rep."</p>
        </div>
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
          <p className="text-blue-300 text-sm font-bold">🧠 WISDOM</p>
          <p className="text-blue-200 text-xs mt-1">"A broken protector cannot defend. Respect the Red Recovery; attack the Green."</p>
        </div>
      </div>

      {/* 17:00 Daily Trigger */}
      <div className="bg-vellera-green/10 border border-vellera-green/50 rounded-xl p-3">
        <p className="text-vellera-green text-sm font-bold">⏰ 17:00 DAILY TRIGGER</p>
        <p className="text-gray-300 text-xs mt-2">
          Sync AM Strain + Whoop Recovery to determine PM Intensity Level. Auto-decision: High-Intensity Combat vs. Drills Only vs. Absolute Rest.
        </p>
      </div>

      {/* Start Info */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 text-center">
        <p className="text-white text-sm font-bold">Execution Start</p>
        <p className="text-vellera-green text-xs font-bold mt-1">Monday, April 6, 2026 | 05:00 AM | The Lab w/ Colin Eaton</p>
      </div>

      {/* Movement Guide Modal */}
      {selectedMovement && (
        <MovementGuide exercise={selectedMovement} onClose={() => setSelectedMovement(null)} />
      )}
    </div>
  );
}