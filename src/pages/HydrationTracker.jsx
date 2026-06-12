import { useState, useEffect, useRef } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { ArrowLeft, Droplets, Plus, Bell, BellOff, Thermometer, Zap, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Calculate target oz based on strain, training minutes, and temperature
function calcTarget(strainScore, trainingMin, tempF) {
  const baseOz = 80; // baseline for sedentary day
  const strainBonus = strainScore ? Math.round((strainScore / 21) * 40) : 0; // up to +40 oz for max strain
  const trainingBonus = trainingMin ? Math.round((trainingMin / 60) * 16) : 0; // +16 oz per hour of training
  const heatBonus = tempF && tempF > 75 ? Math.round((tempF - 75) * 0.8) : 0; // +0.8 oz per °F above 75
  return baseOz + strainBonus + trainingBonus + heatBonus;
}

const QUICK_AMOUNTS = [8, 12, 16, 20, 32];

export default function HydrationTracker() {
  const navigate = useNavigate();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingOz, setAddingOz] = useState(16);
  const [customOz, setCustomOz] = useState("");
  const [remindersOn, setRemindersOn] = useState(false);
  const [reminderInterval, setReminderInterval] = useState(60); // minutes
  const [nextReminder, setNextReminder] = useState(null);
  const [weather, setWeather] = useState(null);
  const reminderRef = useRef(null);
  const today = new Date().toISOString().split("T")[0];

  // Load or create today's log + fetch context data
  useEffect(() => {
    const init = async () => {
      try {
        // Fetch context data in parallel
        const [logs, shredToday, sessions] = await Promise.all([
          base44.entities.HydrationLog.filter({ date: today }),
          base44.entities.ZuluShredMetrics.filter({ date: today }),
          base44.entities.TrainingSession.list("-date", 1),
        ]);

        const strainScore = shredToday[0]?.weekly_strain_avg || null;
        const recentSession = sessions[0]?.date === today ? sessions[0] : null;
        const trainingMin = recentSession?.duration_minutes || 0;

        // Try to get local temperature via Open-Meteo (no API key needed)
        let tempF = null;
        try {
          const geoRes = await fetch("https://ipapi.co/json/");
          if (geoRes.ok) {
            const geo = await geoRes.json();
            const wxRes = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&current_weather=true&temperature_unit=fahrenheit`
            );
            if (wxRes.ok) {
              const wx = await wxRes.json();
              tempF = Math.round(wx.current_weather?.temperature || null);
              setWeather({ temp: tempF, city: geo.city });
            }
          }
        } catch (_) {}

        const target = calcTarget(strainScore, trainingMin, tempF);

        if (logs.length > 0) {
          // Update target if context changed
          const existing = logs[0];
          if (existing.target_oz !== target) {
            const updated = await base44.entities.HydrationLog.update(existing.id, {
              target_oz: target,
              whoop_strain: strainScore,
              training_minutes: trainingMin,
              temp_f: tempF,
            });
            setLog({ ...existing, ...updated });
          } else {
            setLog(existing);
          }
        } else {
          const created = await base44.entities.HydrationLog.create({
            date: today,
            target_oz: target,
            consumed_oz: 0,
            whoop_strain: strainScore,
            training_minutes: trainingMin,
            temp_f: tempF,
            logs: [],
          });
          setLog(created);
        }
      } catch (err) {
        console.error("HydrationTracker init error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // In-app reminder interval
  useEffect(() => {
    if (reminderRef.current) clearInterval(reminderRef.current);
    if (!remindersOn) { setNextReminder(null); return; }

    const next = new Date(Date.now() + reminderInterval * 60 * 1000);
    setNextReminder(next);

    reminderRef.current = setInterval(() => {
      const next2 = new Date(Date.now() + reminderInterval * 60 * 1000);
      setNextReminder(next2);
      // Show browser notification if permitted
      if (Notification.permission === "granted") {
        new Notification("💧 Hydration Reminder", {
          body: `You've had ${log?.consumed_oz || 0} oz. Goal: ${log?.target_oz || 80} oz. Drink up, Warrior!`,
          icon: "/favicon.ico",
        });
      }
    }, reminderInterval * 60 * 1000);

    return () => clearInterval(reminderRef.current);
  }, [remindersOn, reminderInterval, log?.consumed_oz]);

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const perm = await Notification.requestPermission();
      if (perm === "granted") setRemindersOn(true);
      else setRemindersOn(true); // Still show in-app reminders
    } else {
      setRemindersOn(true);
    }
  };

  const logIntake = async (oz) => {
    if (!log || oz <= 0) return;
    const newConsumed = (log.consumed_oz || 0) + oz;
    const entry = {
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      amount_oz: oz,
      note: "",
    };
    const newLogs = [...(log.logs || []), entry];

    try {
      const updated = await base44.entities.HydrationLog.update(log.id, {
        consumed_oz: newConsumed,
        logs: newLogs,
      });
      setLog({ ...log, consumed_oz: newConsumed, logs: newLogs });
    } catch (err) {
      console.error("Log intake error:", err);
    }
    setCustomOz("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-commander-dark flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-vellera-blue rounded-full animate-spin" />
      </div>
    );
  }

  const consumed = log?.consumed_oz || 0;
  const target = log?.target_oz || 80;
  const pct = Math.min(100, Math.round((consumed / target) * 100));
  const remaining = Math.max(0, target - consumed);

  const statusColor =
    pct >= 100 ? "text-vellera-green" : pct >= 60 ? "text-vellera-blue" : pct >= 30 ? "text-yellow-400" : "text-red-400";
  const ringColor =
    pct >= 100 ? "#CCFF00" : pct >= 60 ? "#00E5FF" : pct >= 30 ? "#facc15" : "#ef4444";

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto pb-24 safe-area-top">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="text-commander-muted hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white text-xl font-black">Hydration Tracker</h1>
            <p className="text-commander-muted text-xs">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
          </div>
        </div>
        <button
          onClick={() => remindersOn ? setRemindersOn(false) : requestNotificationPermission()}
          className={`p-2 rounded-lg border transition-all ${remindersOn ? "border-vellera-blue text-vellera-blue bg-vellera-blue/10" : "border-commander-border text-commander-muted"}`}
        >
          {remindersOn ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
        </button>
      </div>

      {/* Reminder Banner */}
      {remindersOn && nextReminder && (
        <div className="bg-vellera-blue/10 border border-vellera-blue/40 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-vellera-blue text-sm">
            <Clock className="w-4 h-4" />
            <span>Next reminder: {nextReminder.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <select
            value={reminderInterval}
            onChange={e => setReminderInterval(Number(e.target.value))}
            className="bg-transparent text-vellera-blue text-xs border border-vellera-blue/40 rounded px-2 py-1"
          >
            <option value={30}>30 min</option>
            <option value={45}>45 min</option>
            <option value={60}>60 min</option>
            <option value={90}>90 min</option>
          </select>
        </div>
      )}

      {/* Context Factors */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Zap, label: "Strain", value: log?.whoop_strain ? `${log.whoop_strain}/21` : "—", color: "text-yellow-400" },
          { icon: Clock, label: "Training", value: log?.training_minutes ? `${log.training_minutes} min` : "—", color: "text-vellera-green" },
          { icon: Thermometer, label: "Temp", value: weather?.temp ? `${weather.temp}°F` : "—", color: "text-orange-400" },
        ].map((item, i) => (
          <div key={i} className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center">
            <item.icon className={`w-4 h-4 mx-auto mb-1 ${item.color}`} />
            <p className={`text-sm font-black ${item.color}`}>{item.value}</p>
            <p className="text-commander-muted text-xs">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Main Ring */}
      <div className="bg-commander-surface border border-commander-border rounded-2xl p-6 flex flex-col items-center space-y-4">
        <div className="relative w-44 h-44">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#1e1e2e" strokeWidth="10" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke={ringColor} strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 263.9} 263.9`}
              style={{ transition: "stroke-dasharray 0.5s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Droplets className={`w-6 h-6 mb-1 ${statusColor}`} />
            <p className={`text-3xl font-black ${statusColor}`}>{consumed}</p>
            <p className="text-commander-muted text-xs">/ {target} oz</p>
            <p className={`text-sm font-bold ${statusColor}`}>{pct}%</p>
          </div>
        </div>

        <div className="text-center">
          {pct >= 100 ? (
            <p className="text-vellera-green font-black">🏆 Goal Crushed! Stay topped off.</p>
          ) : (
            <p className="text-white text-sm">
              <span className={`font-black ${statusColor}`}>{remaining} oz</span> remaining to hit your goal
            </p>
          )}
          {weather?.city && (
            <p className="text-commander-muted text-xs mt-1">📍 {weather.city} — {weather.temp}°F</p>
          )}
        </div>
      </div>

      {/* Quick Add */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
        <p className="text-white font-bold text-sm">Log Intake</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map(oz => (
            <button
              key={oz}
              onClick={() => logIntake(oz)}
              className="bg-vellera-blue/20 border border-vellera-blue text-vellera-blue font-bold text-sm px-3 py-2 rounded-lg hover:bg-vellera-blue/40 transition-all"
            >
              +{oz} oz
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Custom oz"
            value={customOz}
            onChange={e => setCustomOz(e.target.value)}
            className="flex-1 bg-gray-900 border border-commander-border rounded-lg px-3 py-2 text-white text-sm"
            min="1" max="64"
          />
          <button
            onClick={() => logIntake(parseInt(customOz) || 0)}
            disabled={!customOz || parseInt(customOz) <= 0}
            className="bg-vellera-green text-commander-dark font-bold px-4 py-2 rounded-lg hover:bg-vellera-blue transition-all disabled:opacity-40 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Intake Log */}
      {log?.logs?.length > 0 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-2">
          <p className="text-white font-bold text-sm">Today's Log</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {[...log.logs].reverse().map((entry, i) => (
              <div key={i} className="flex items-center justify-between text-sm text-gray-300 py-1 border-b border-commander-border/50 last:border-0">
                <span className="text-commander-muted text-xs">{entry.time}</span>
                <span className="font-bold text-vellera-blue">+{entry.amount_oz} oz</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Target Breakdown */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-2">
        <p className="text-white font-bold text-sm">Target Breakdown</p>
        {[
          { label: "Base intake", value: 80 },
          { label: "Whoop strain bonus", value: log?.whoop_strain ? Math.round((log.whoop_strain / 21) * 40) : 0 },
          { label: "Training duration bonus", value: log?.training_minutes ? Math.round((log.training_minutes / 60) * 16) : 0 },
          { label: "Heat adjustment", value: log?.temp_f && log.temp_f > 75 ? Math.round((log.temp_f - 75) * 0.8) : 0 },
        ].map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-commander-muted">{item.label}</span>
            <span className={`font-bold ${item.value > 0 ? "text-vellera-blue" : "text-gray-600"}`}>
              {item.value > 0 ? `+${item.value}` : item.value} oz
            </span>
          </div>
        ))}
        <div className="flex justify-between text-sm border-t border-commander-border pt-2 mt-1">
          <span className="text-white font-bold">Daily Target</span>
          <span className="text-vellera-green font-black">{target} oz</span>
        </div>
      </div>
    </div>
  );
}