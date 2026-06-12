import { useState, useEffect, useRef } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { ArrowLeft, RefreshCw, Play, Pause, CheckCircle, Zap, Heart, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const INTENSITY_CONFIG = {
  High: {
    icon: Zap,
    color: "text-yellow-400",
    border: "border-yellow-600",
    bg: "bg-yellow-900/20",
    label: "High Intensity Day",
    desc: "Recovery ≥ 67% — Dynamic activation & explosive prep",
  },
  Moderate: {
    icon: Heart,
    color: "text-vellera-blue",
    border: "border-blue-600",
    bg: "bg-blue-900/20",
    label: "Moderate Day",
    desc: "Recovery 34–66% — Balanced flow & joint prep",
  },
  Low: {
    icon: Shield,
    color: "text-purple-400",
    border: "border-purple-600",
    bg: "bg-purple-900/20",
    label: "Recovery Day",
    desc: "Recovery < 34% — Deep tissue restore & nervous system reset",
  },
};

function TimerBar({ seconds, total }) {
  const pct = total > 0 ? ((total - seconds) / total) * 100 : 0;
  return (
    <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
      <div
        className="h-2 rounded-full bg-vellera-blue transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function ExerciseCard({ ex, index, isActive, isDone }) {
  return (
    <div className={`border rounded-xl p-4 transition-all ${
      isDone ? "border-vellera-green/40 bg-vellera-green/5 opacity-60" :
      isActive ? "border-vellera-blue bg-vellera-blue/10" :
      "border-commander-border bg-commander-surface"
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-commander-muted text-xs font-bold">{index + 1}.</span>
            <p className="text-white font-bold text-sm">{ex.name}</p>
            {isDone && <CheckCircle className="w-4 h-4 text-vellera-green" />}
          </div>
          <p className="text-commander-muted text-xs mt-1">
            {ex.sets > 1 ? `${ex.sets} × ` : ""}{ex.duration_seconds}s
          </p>
          <p className="text-gray-300 text-xs mt-1">{ex.cue}</p>
        </div>
      </div>
      {ex.bjj_benefit && (
        <p className="text-vellera-blue text-xs mt-2">🥋 {ex.bjj_benefit}</p>
      )}
    </div>
  );
}

export default function MobilityRoutinePage() {
  const navigate = useNavigate();
  const [intensity, setIntensity] = useState("Moderate");
  const [detecting, setDetecting] = useState(true);
  const [recoveryScore, setRecoveryScore] = useState(null);
  const [routine, setRoutine] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Timer state
  const [running, setRunning] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [doneIndices, setDoneIndices] = useState([]);
  const timerRef = useRef(null);
  const today = new Date().toISOString().split("T")[0];

  // Auto-detect intensity from Whoop
  useEffect(() => {
    const detect = async () => {
      try {
        const [shred, biometrics] = await Promise.all([
          base44.entities.ZuluShredMetrics.filter({ date: today }),
          base44.entities.BiometricLog.filter({ date: today }),
        ]);
        const recovery = shred[0]?.recovery_score ?? biometrics[0]?.recovery_score ?? null;
        if (recovery !== null) {
          setRecoveryScore(recovery);
          if (recovery >= 67) setIntensity("High");
          else if (recovery >= 34) setIntensity("Moderate");
          else setIntensity("Low");
        } else {
          // Day-of-week fallback: Mon/Tue/Thu = High, Wed/Fri = Moderate, Sat/Sun = Low
          const dow = new Date().getDay();
          if ([1, 2, 4].includes(dow)) setIntensity("High");
          else if ([3, 5].includes(dow)) setIntensity("Moderate");
          else setIntensity("Low");
        }
        // Check if routine already generated today
        const existing = await base44.entities.MobilityRoutine.filter({ date: today });
        if (existing.length > 0) setRoutine(existing[0]);
      } catch (err) {
        console.warn("Detection error:", err.message);
      } finally {
        setDetecting(false);
      }
    };
    detect();
  }, []);

  // Timer tick
  useEffect(() => {
    if (!running || !routine?.exercises?.length) return;
    const exercise = routine.exercises[activeIdx];
    if (!exercise) { setRunning(false); return; }

    if (timeLeft === 0) setTimeLeft(exercise.duration_seconds);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          const nextIdx = activeIdx + 1;
          setDoneIndices(d => [...d, activeIdx]);
          if (nextIdx < routine.exercises.length) {
            setActiveIdx(nextIdx);
            setTimeLeft(routine.exercises[nextIdx].duration_seconds);
          } else {
            setRunning(false);
            // Mark complete
            base44.entities.MobilityRoutine.update(routine.id, { completed: true })
              .then(updated => setRoutine(r => ({ ...r, completed: true })))
              .catch(console.error);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [running, activeIdx]);

  const startTimer = () => {
    if (!routine?.exercises?.length) return;
    setDoneIndices([]);
    setActiveIdx(0);
    setTimeLeft(routine.exercises[0].duration_seconds);
    setRunning(true);
  };

  const togglePause = () => setRunning(r => !r);

  const generateRoutine = async () => {
    setGenerating(true);
    setError(null);
    setRoutine(null);
    setRunning(false);
    setDoneIndices([]);
    setActiveIdx(0);

    try {
      const cfg = INTENSITY_CONFIG[intensity];
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an elite BJJ mobility coach. Generate a 10-minute BJJ-specific mobility flow for a "${intensity}" training day (${cfg.desc}).

RULES:
- Exactly 6–8 exercises totaling ~600 seconds (10 minutes)
- Tailor to BJJ: hips, thoracic spine, shoulders, ankles, and guard retention muscles
- ${intensity === "High" ? "Dynamic activation: explosive hip openers, band pull-aparts, explosive cossack squats — prime for intense rolling" : ""}
- ${intensity === "Moderate" ? "Balanced: deep hip flexor stretches, 90/90 flow, cat-cow, thoracic rotations — maintain and restore" : ""}
- ${intensity === "Low" ? "Parasympathetic: long holds (45–60s), breath work, progressive relaxation, passive stretching — full recovery" : ""}
- Each exercise must have a concrete BJJ benefit (guard retention, hip escape, submission defense, etc.)

Return JSON:
{
  "exercises": [
    {
      "name": string,
      "duration_seconds": number,
      "sets": number,
      "cue": string (1–2 sentence coaching cue),
      "bjj_benefit": string (specific BJJ carryover)
    }
  ],
  "focus_areas": string[],
  "total_minutes": number,
  "warrior_note": string
}`,
        response_json_schema: {
          type: "object",
          properties: {
            exercises: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  duration_seconds: { type: "number" },
                  sets: { type: "number" },
                  cue: { type: "string" },
                  bjj_benefit: { type: "string" },
                },
              },
            },
            focus_areas: { type: "array", items: { type: "string" } },
            total_minutes: { type: "number" },
            warrior_note: { type: "string" },
          },
        },
      });

      // Save to entity
      const saved = await base44.entities.MobilityRoutine.create({
        date: today,
        intensity,
        recovery_score: recoveryScore,
        exercises: result.exercises,
        focus_areas: result.focus_areas,
        total_minutes: result.total_minutes || 10,
        warrior_note: result.warrior_note,
        completed: false,
      });

      setRoutine(saved);
    } catch (err) {
      setError("Failed to generate routine. Try again.");
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const cfg = INTENSITY_CONFIG[intensity];
  const Icon = cfg.icon;
  const totalDuration = routine?.exercises?.reduce((s, e) => s + e.duration_seconds, 0) || 0;
  const activeExercise = routine?.exercises?.[activeIdx];

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto pb-24 safe-area-top">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="text-commander-muted hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-white text-xl font-black">BJJ Mobility Flow</h1>
          <p className="text-commander-muted text-xs">10-min personalized flow · Whoop-adaptive</p>
        </div>
      </div>

      {/* Intensity Selector */}
      <div className={`border rounded-xl p-4 space-y-3 ${cfg.border} ${cfg.bg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${cfg.color}`} />
            <p className={`font-black text-sm ${cfg.color}`}>{cfg.label}</p>
          </div>
          {detecting && <span className="text-xs text-vellera-blue animate-pulse">Auto-detecting…</span>}
          {recoveryScore !== null && (
            <span className="text-xs text-commander-muted">Recovery: {recoveryScore}%</span>
          )}
        </div>
        <p className="text-gray-400 text-xs">{cfg.desc}</p>

        <div className="grid grid-cols-3 gap-2">
          {Object.entries(INTENSITY_CONFIG).map(([key, val]) => {
            const I = val.icon;
            return (
              <button
                key={key}
                onClick={() => setIntensity(key)}
                className={`rounded-xl p-3 border text-center transition-all ${
                  intensity === key ? `${val.border} ${val.bg}` : "border-commander-border hover:border-gray-600"
                }`}
              >
                <I className={`w-4 h-4 mx-auto mb-1 ${intensity === key ? val.color : "text-commander-muted"}`} />
                <p className={`text-xs font-bold ${intensity === key ? val.color : "text-commander-muted"}`}>{key}</p>
              </button>
            );
          })}
        </div>

        <button
          onClick={generateRoutine}
          disabled={generating}
          className="w-full bg-vellera-green text-commander-dark font-black py-3 rounded-xl hover:bg-vellera-blue transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {generating ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> Generating Flow…</>
          ) : (
            <><Zap className="w-4 h-4" /> Generate 10-Min Flow</>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm">{error}</div>
      )}

      {/* Generated Routine */}
      {routine && (
        <div className="space-y-4">
          {/* Warrior Note */}
          {routine.warrior_note && (
            <div className="bg-vellera-blue/10 border border-vellera-blue/30 rounded-xl p-4">
              <p className="text-vellera-blue font-bold text-xs uppercase mb-1">⚔️ Warrior Note</p>
              <p className="text-gray-300 text-sm">{routine.warrior_note}</p>
            </div>
          )}

          {/* Focus Areas */}
          {routine.focus_areas?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {routine.focus_areas.map((area, i) => (
                <span key={i} className="text-xs bg-gray-800 text-gray-300 border border-commander-border px-3 py-1 rounded-full">
                  {area}
                </span>
              ))}
            </div>
          )}

          {/* Timer Controls */}
          {!routine.completed ? (
            <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
              {running && activeExercise ? (
                <div className="text-center">
                  <p className="text-commander-muted text-xs uppercase tracking-widest">NOW</p>
                  <p className="text-white text-xl font-black mt-1">{activeExercise.name}</p>
                  <p className="text-vellera-green text-4xl font-black mt-2">{timeLeft}s</p>
                  <TimerBar seconds={timeLeft} total={activeExercise.duration_seconds} />
                  {activeIdx + 1 < routine.exercises.length && (
                    <p className="text-commander-muted text-xs mt-2">
                      Next: {routine.exercises[activeIdx + 1]?.name}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-white font-bold">{Math.round(totalDuration / 60)} min flow · {routine.exercises.length} exercises</p>
                </div>
              )}
              <div className="flex gap-2">
                {!running && doneIndices.length === 0 && (
                  <button onClick={startTimer} className="flex-1 bg-vellera-green text-commander-dark font-black py-3 rounded-xl flex items-center justify-center gap-2">
                    <Play className="w-5 h-5" /> Start Flow
                  </button>
                )}
                {running && (
                  <button onClick={togglePause} className="flex-1 bg-yellow-600 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2">
                    <Pause className="w-5 h-5" /> Pause
                  </button>
                )}
                {!running && doneIndices.length > 0 && !routine.completed && (
                  <button onClick={() => setRunning(true)} className="flex-1 bg-vellera-blue text-commander-dark font-black py-3 rounded-xl flex items-center justify-center gap-2">
                    <Play className="w-5 h-5" /> Resume
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-vellera-green/10 border border-vellera-green rounded-xl p-4 text-center">
              <CheckCircle className="w-8 h-8 text-vellera-green mx-auto mb-2" />
              <p className="text-vellera-green font-black">Flow Complete! 🏆</p>
              <p className="text-gray-400 text-xs mt-1">Mobility session logged for {today}</p>
            </div>
          )}

          {/* Exercise List */}
          <div className="space-y-2">
            <p className="text-white font-bold text-sm">Exercise Sequence</p>
            {routine.exercises?.map((ex, i) => (
              <ExerciseCard
                key={i}
                ex={ex}
                index={i}
                isActive={running && i === activeIdx}
                isDone={doneIndices.includes(i)}
              />
            ))}
          </div>

          {/* Regenerate */}
          <button
            onClick={generateRoutine}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Regenerate Flow
          </button>
        </div>
      )}
    </div>
  );
}