import { useState, useEffect, useRef } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { Play, Pause, RotateCcw, Timer, X, Check } from "lucide-react";
import { toast } from "sonner";

const PRESETS = [
  { label: "3 min", seconds: 180 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "20 min", seconds: 1200 },
];

export default function DrillTimer() {
  const [open, setOpen] = useState(false);
  const [total, setTotal] = useState(300);
  const [remaining, setRemaining] = useState(300);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [drillName, setDrillName] = useState("");
  const [logging, setLogging] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setFinished(true);
            toast.success("⏱️ Drill complete!");
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const start = () => { setFinished(false); setRunning(true); };
  const pause = () => { setRunning(false); clearInterval(intervalRef.current); };
  const reset = () => { pause(); setRemaining(total); setFinished(false); };

  const setPreset = (secs) => {
    pause();
    setTotal(secs);
    setRemaining(secs);
    setFinished(false);
  };

  const logDrill = async () => {
    setLogging(true);
    const durationMins = Math.round(total / 60);
    await base44.entities.TrainingSession.create({
      date: new Date().toISOString().split("T")[0],
      session_type: "BJJ Foundations",
      duration_minutes: durationMins,
      session_notes: drillName ? `Drill: ${drillName}` : `Timed drill — ${durationMins} min`,
    });
    toast.success(`Logged ${durationMins} min drill! 🥋`);
    setLogging(false);
    setFinished(false);
    setRemaining(total);
    setDrillName("");
  };

  const mins = String(Math.floor(remaining / 60)).padStart(2, "0");
  const secs = String(remaining % 60).padStart(2, "0");
  const pct = total > 0 ? ((total - remaining) / total) * 100 : 0;
  const circumference = 2 * Math.PI * 28;

  return (
    <>
      {/* Floating trigger */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className={`fixed bottom-20 left-3 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg border transition-all ${
            running
              ? "bg-commander-red border-red-500 animate-pulse"
              : "bg-commander-surface border-commander-border hover:border-commander-red"
          }`}
          title="Drill Timer"
        >
          <Timer className="w-5 h-5 text-white" />
          {running && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-xs text-white flex items-center justify-center font-mono">
              {Math.ceil(remaining / 60)}
            </span>
          )}
        </button>
      )}

      {/* Timer Panel */}
      {open && (
        <div className="fixed bottom-20 left-3 z-50 w-64 bg-commander-surface border border-commander-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-commander-border">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-commander-red" />
              <span className="text-white text-sm font-bold">Drill Timer</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-commander-muted hover:text-white transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Drill name */}
            <input
              value={drillName}
              onChange={e => setDrillName(e.target.value)}
              placeholder="Drill name (optional)"
              className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-commander-red"
            />

            {/* Presets */}
            <div className="grid grid-cols-4 gap-1">
              {PRESETS.map(p => (
                <button key={p.label} onClick={() => setPreset(p.seconds)}
                  className={`text-xs py-1 rounded-lg border transition-all ${total === p.seconds ? "bg-red-950 border-commander-red text-white" : "border-commander-border text-commander-muted hover:text-white"}`}>
                  {p.label}
                </button>
              ))}
            </div>

            {/* Circular Timer */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#1f2937" strokeWidth="4" />
                  <circle cx="32" cy="32" r="28" fill="none"
                    stroke={finished ? "#22c55e" : running ? "#ef4444" : "#6b7280"}
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (circumference * pct) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`font-mono font-black text-lg ${finished ? "text-green-400" : "text-white"}`}>
                    {finished ? "✓" : `${mins}:${secs}`}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-2">
                {!running && !finished && (
                  <button onClick={start} className="bg-commander-red text-white rounded-lg px-4 py-2 text-sm font-bold flex items-center gap-1 hover:bg-red-700 transition-all">
                    <Play className="w-3 h-3" /> Start
                  </button>
                )}
                {running && (
                  <button onClick={pause} className="bg-yellow-700 text-white rounded-lg px-4 py-2 text-sm font-bold flex items-center gap-1 hover:bg-yellow-600 transition-all">
                    <Pause className="w-3 h-3" /> Pause
                  </button>
                )}
                <button onClick={reset} className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm hover:bg-gray-600 transition-all">
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Auto-log prompt on finish */}
            {finished && (
              <div className="bg-green-950 border border-green-700 rounded-xl p-3 text-center space-y-2">
                <p className="text-green-300 text-xs font-bold">Drill complete! Log it?</p>
                <button onClick={logDrill} disabled={logging}
                  className="w-full bg-green-700 text-white rounded-lg py-2 text-xs font-bold flex items-center justify-center gap-1 hover:bg-green-600 disabled:opacity-50 transition-all">
                  <Check className="w-3 h-3" />
                  {logging ? "Logging..." : `Log ${Math.round(total / 60)} min to Training Log`}
                </button>
                <button onClick={() => { setFinished(false); setRemaining(total); }}
                  className="w-full text-xs text-commander-muted hover:text-white transition-all">
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}