import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { RefreshCw, Zap, Moon, Heart, Activity, AlertTriangle, TrendingUp } from "lucide-react";

// ── Training intensity config based on recovery score ──────────────────────
const INTENSITY_ZONES = [
  {
    min: 0,  max: 33,
    label: "Rest / Recovery Only",
    sub: "CNS is fatigued. Mobility & breathwork only — no mat work or lifting today.",
    icon: "🛑",
    color: "text-red-400",
    border: "border-red-800",
    bg: "bg-red-950/30",
    barColor: "bg-red-500",
    allowed: ["Home Mobility", "Light Walk", "Foam Rolling"],
    avoid: ["Sparring", "Lifting", "Zone 2 Cardio"],
  },
  {
    min: 34, max: 50,
    label: "Technique Only",
    sub: "Low-intensity drilling acceptable. No live sparring. Consider passive recovery first.",
    icon: "🟡",
    color: "text-yellow-400",
    border: "border-yellow-800",
    bg: "bg-yellow-950/30",
    barColor: "bg-yellow-500",
    allowed: ["Light Drilling", "Film Study", "Zone 2 @ 60%"],
    avoid: ["Hard Sparring", "Max Lifts", "Back-to-back sessions"],
  },
  {
    min: 51, max: 67,
    label: "Moderate Training",
    sub: "Controlled training session OK. Manage intensity. Watch gas level — stop at 8/10.",
    icon: "🟢",
    color: "text-green-400",
    border: "border-green-800",
    bg: "bg-green-950/30",
    barColor: "bg-green-500",
    allowed: ["BJJ Drilling", "Moderate Sparring", "S&C Strength"],
    avoid: ["High-volume back-to-back", "Full gas sparring > 3 rounds"],
  },
  {
    min: 68, max: 84,
    label: "Full Training Green",
    sub: "You're primed. Hit the mat hard — optimal window for technique retention and gains.",
    icon: "⚡",
    color: "text-blue-400",
    border: "border-blue-800",
    bg: "bg-blue-950/30",
    barColor: "bg-blue-500",
    allowed: ["Full BJJ Class", "Hard Sparring", "S&C + Mat Combo"],
    avoid: [],
  },
  {
    min: 85, max: 100,
    label: "Peak Performance Day",
    sub: "Elite recovery window. If you have competition or a hard session — today is the day.",
    icon: "🏆",
    color: "text-vellera-blue",
    border: "border-[#00E5FF50]",
    bg: "bg-[#00E5FF08]",
    barColor: "bg-[#00E5FF]",
    allowed: ["Full Competition Simulation", "A-Game Sparring", "PR Lifts"],
    avoid: [],
  },
];

function getZone(score) {
  return INTENSITY_ZONES.find(z => score >= z.min && score <= z.max) || INTENSITY_ZONES[0];
}

function MetricTile({ icon: Icon, label, value, unit, color, sub }) {
  return (
    <div className="bg-commander-surface/80 border border-commander-border rounded-xl p-3 text-center">
      <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
      <p className={`font-black text-xl leading-none ${color}`}>
        {value ?? "—"}<span className="text-xs font-normal text-commander-muted ml-0.5">{unit}</span>
      </p>
      <p className="text-commander-muted text-xs mt-0.5">{label}</p>
      {sub && <p className={`text-xs font-medium mt-0.5 ${color}`}>{sub}</p>}
    </div>
  );
}

export default function RecoveryCommandCenter() {
  const [log, setLog] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [connectedProviders, setConnectedProviders] = useState([]);
  const [lastSynced, setLastSynced] = useState(null);
  const today = new Date().toISOString().split("T")[0];

  const loadTodayLog = useCallback(async () => {
    const logs = await base44.entities.BiometricLog.filter({ date: today });
    setLog(logs[0] || null);
  }, [today]);

  const detectProviders = useCallback(async () => {
    const [whoopTokens, wearableTokens] = await Promise.all([
      base44.entities.WhoopToken.filter({}).catch(() => []),
      base44.entities.WearableToken.filter({}).catch(() => []),
    ]);
    const providers = [];
    if (whoopTokens.length > 0) providers.push({ name: "whoop", fn: "whoopSync", token: whoopTokens[0] });
    const fitbitToken = wearableTokens.find(t => t.provider === "fitbit");
    if (fitbitToken) providers.push({ name: "fitbit", fn: "fitbitSync", token: fitbitToken });
    setConnectedProviders(providers);
    return providers;
  }, []);

  const autoSync = useCallback(async (providers) => {
    if (!providers.length) return;
    setSyncing(true);
    try {
      await Promise.all(providers.map(p => base44.functions.invoke(p.fn, {})));
      setLastSynced(new Date());
      await loadTodayLog();
    } catch {
      // silent — user can manually trigger
    } finally {
      setSyncing(false);
    }
  }, [loadTodayLog]);

  const manualSync = async () => {
    if (!connectedProviders.length) {
      toast.error("No wearables connected. Connect Whoop or Fitbit in Wearables Hub.");
      return;
    }
    setSyncing(true);
    try {
      await Promise.all(connectedProviders.map(p => base44.functions.invoke(p.fn, {})));
      setLastSynced(new Date());
      await loadTodayLog();
      toast.success("Biometrics synced!");
    } catch (e) {
      toast.error("Sync failed: " + e.message);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const [, providers] = await Promise.all([loadTodayLog(), detectProviders()]);
      // Auto-sync only if no log exists yet today or it was synced more than 1 hour ago
      const existing = await base44.entities.BiometricLog.filter({ date: today });
      const needsSync = existing.length === 0 || (existing[0]?.updated_date && Date.now() - new Date(existing[0].updated_date) > 3600000);
      if (needsSync && providers.length) {
        await autoSync(providers);
      }
    };
    init();
  }, []);

  const recovery = log?.recovery_pct ?? null;
  const zone = recovery !== null ? getZone(recovery) : null;

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-bold text-sm">Recovery Command</p>
          {lastSynced && (
            <p className="text-commander-muted text-xs">
              Synced {lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {connectedProviders.map(p => ` · ${p.name}`)}
            </p>
          )}
          {!lastSynced && log && (
            <p className="text-commander-muted text-xs">
              {log.source ? `via ${log.source}` : "manual entry"} · {log.date}
            </p>
          )}
        </div>
        <button
          onClick={manualSync}
          disabled={syncing}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all min-h-[36px] ${
            syncing
              ? "border-commander-border text-commander-muted"
              : connectedProviders.length
                ? "border-green-700 text-green-400 hover:bg-green-950/30"
                : "border-commander-border text-commander-muted"
          }`}
        >
          <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing…" : "Sync"}
        </button>
      </div>

      {/* No wearable connected */}
      {connectedProviders.length === 0 && !log && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white text-xs font-bold">No wearable connected</p>
            <p className="text-commander-muted text-xs mt-0.5">Connect Whoop or Fitbit in <span className="text-[#00E5FF]">Wearables Hub</span> to auto-pull sleep & HRV daily.</p>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {syncing && !log && (
        <div className="h-28 bg-commander-surface border border-commander-border rounded-xl animate-pulse" />
      )}

      {/* Recovery score + intensity zone */}
      {recovery !== null && zone && (
        <div className={`border rounded-xl overflow-hidden ${zone.border} ${zone.bg}`}>
          {/* Score bar */}
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className={`text-3xl font-black ${zone.color}`}>{recovery}<span className="text-base font-normal text-commander-muted">%</span></p>
                <p className="text-commander-muted text-xs">Recovery Score</p>
              </div>
              <div className="text-right">
                <p className="text-2xl">{zone.icon}</p>
                <p className={`text-sm font-black ${zone.color}`}>{zone.label}</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-gray-800 rounded-full h-2.5 mb-1">
              <div className={`h-2.5 rounded-full transition-all duration-700 ${zone.barColor}`} style={{ width: `${recovery}%` }} />
            </div>
            {/* Zone markers */}
            <div className="flex justify-between text-xs text-gray-600 font-mono">
              <span>0</span><span>33</span><span>50</span><span>67</span><span>84</span><span>100</span>
            </div>
          </div>

          {/* Recommendation */}
          <div className="px-4 pb-3">
            <p className="text-white text-xs leading-relaxed mt-1">{zone.sub}</p>

            {/* Allowed / Avoid */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              {zone.allowed.length > 0 && (
                <div>
                  <p className="text-green-400 text-xs font-bold mb-1">✓ Green-lit</p>
                  {zone.allowed.map(a => <p key={a} className="text-gray-300 text-xs">· {a}</p>)}
                </div>
              )}
              {zone.avoid.length > 0 && (
                <div>
                  <p className="text-red-400 text-xs font-bold mb-1">✗ Avoid</p>
                  {zone.avoid.map(a => <p key={a} className="text-gray-400 text-xs">· {a}</p>)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Metric tiles */}
      {log && (
        <div className="grid grid-cols-4 gap-2">
          <MetricTile
            icon={Heart}
            label="HRV"
            value={log.hrv}
            unit="ms"
            color={log.hrv >= 60 ? "text-green-400" : log.hrv >= 40 ? "text-yellow-400" : "text-red-400"}
          />
          <MetricTile
            icon={Activity}
            label="RHR"
            value={log.resting_hr}
            unit="bpm"
            color={log.resting_hr <= 55 ? "text-green-400" : log.resting_hr <= 70 ? "text-yellow-400" : "text-red-400"}
          />
          <MetricTile
            icon={Moon}
            label="Sleep"
            value={log.sleep_performance}
            unit="%"
            color={log.sleep_performance >= 80 ? "text-purple-400" : log.sleep_performance >= 65 ? "text-yellow-400" : "text-red-400"}
          />
          <MetricTile
            icon={Zap}
            label="Battery"
            value={log.body_battery}
            unit=""
            color={log.body_battery >= 70 ? "text-blue-400" : log.body_battery >= 40 ? "text-yellow-400" : "text-red-400"}
          />
        </div>
      )}

      {/* 43yo recovery note */}
      {recovery !== null && recovery < 67 && (
        <div className="bg-orange-950/30 border border-orange-800 rounded-xl px-3 py-2 flex gap-2 items-start">
          <TrendingUp className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" />
          <p className="text-orange-300 text-xs">
            <span className="font-bold">43yo Protocol:</span> Low recovery means your tendons, not just muscles, need repair time. Forcing a session risks weeks of injury.
          </p>
        </div>
      )}
    </div>
  );
}