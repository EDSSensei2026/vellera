import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar, Plus } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

function CountdownDisplay({ timestamp, onComplete }) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isFinished, setIsFinished] = useState(false);
  const confettiTriggered = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(timestamp).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsFinished(true);
        if (!confettiTriggered.current) {
          confettiTriggered.current = true;
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
          onComplete?.();
        }
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTime({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [timestamp, onComplete]);

  if (isFinished) {
    return (
      <div className="text-center">
        <p className="text-3xl font-black text-transparent bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text">
          Event Started!
        </p>
        <p className="text-xs text-green-300 mt-1 font-semibold">🎉 Goal Deadline Reached!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 text-center">
      {[
        { label: "Days", value: time.days },
        { label: "Hours", value: time.hours },
        { label: "Minutes", value: time.minutes },
        { label: "Seconds", value: time.seconds },
      ].map(({ label, value }) => (
        <div key={label} className="backdrop-blur-md bg-white/10 rounded-lg p-2 border border-white/20">
          <p className="text-white font-black text-2xl tabular-nums">{String(value).padStart(2, "0")}</p>
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">{label}</p>
        </div>
      ))}
    </div>
  );
}

function CountdownCard({ countdown, onRemove }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 border border-white/20 backdrop-blur-xl"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
      }}
    >
      {/* Glasmorphism accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-purple-600/10 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 space-y-4">
        <h3 className="text-white font-black text-xl">{countdown.event_title}</h3>
        {countdown.description && (
          <p className="text-white/70 text-sm">{countdown.description}</p>
        )}
        <CountdownDisplay timestamp={countdown.target_timestamp} onComplete={() => onRemove(countdown.id)} />
        <button
          onClick={() => onRemove(countdown.id)}
          className="text-xs text-white/40 hover:text-red-400 transition-all font-semibold"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export default function CompetitionsEvents() {
  const [countdowns, setCountdowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    event_title: "",
    target_timestamp: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
    loadCountdowns();
  }, []);

  const loadCountdowns = async () => {
    const data = await base44.entities.Temporal_Countdowns.list("-created_date", 100);
    // Filter to future events only
    const now = new Date().getTime();
    const active = data.filter((c) => new Date(c.target_timestamp).getTime() > now);
    setCountdowns(active);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.event_title || !form.target_timestamp) {
      toast.error("Fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      await base44.entities.Temporal_Countdowns.create(form);
      toast.success("Countdown created!");
      setForm({ event_title: "", target_timestamp: "", description: "" });
      setShowForm(false);
      loadCountdowns();
    } catch (error) {
      toast.error("Failed to create countdown");
    }
    setSaving(false);
  };

  const handleRemove = async (id) => {
    await base44.entities.Temporal_Countdowns.delete(id);
    setCountdowns((prev) => prev.filter((c) => c.id !== id));
    toast.success("Countdown removed");
  };

  return (
    <div className="p-4 space-y-6 max-w-6xl mx-auto pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-2xl font-black tracking-tight">Competitions & Events</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-commander-red text-white rounded-lg p-2 hover:bg-red-700 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Countdown
        </button>
      </div>

      {/* Creation Form */}
      {showForm && (
        <div className="bg-commander-surface border border-commander-border rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-bold text-lg">Create New Countdown</h2>

          <div>
            <label className="text-xs text-commander-muted block mb-2 font-semibold">Event Title *</label>
            <input
              type="text"
              value={form.event_title}
              onChange={(e) => setForm((p) => ({ ...p, event_title: e.target.value }))}
              placeholder="e.g. IBJJF Worlds 2026"
              className="w-full bg-gray-800 border border-commander-border rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-commander-red"
            />
          </div>

          <div>
            <label className="text-xs text-commander-muted block mb-2 font-semibold">Target Date & Time *</label>
            <input
              type="datetime-local"
              value={form.target_timestamp}
              onChange={(e) => setForm((p) => ({ ...p, target_timestamp: e.target.value }))}
              className="w-full bg-gray-800 border border-commander-border rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-commander-red"
            />
          </div>

          <div>
            <label className="text-xs text-commander-muted block mb-2 font-semibold">Description (optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Add event details..."
              rows={3}
              className="w-full bg-gray-800 border border-commander-border rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-commander-red resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex-1 bg-commander-red text-white rounded-lg py-3 font-bold hover:bg-red-700 transition-all disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Countdown"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 bg-gray-700 text-white rounded-lg py-3 font-bold hover:bg-gray-600 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Countdowns Grid */}
      <div>
        <p className="text-xs text-commander-muted uppercase tracking-widest font-bold mb-4">Active Countdowns</p>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 rounded-2xl border border-white/20 backdrop-blur-xl animate-pulse"
              />
            ))}
          </div>
        ) : countdowns.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-commander-muted mx-auto mb-4 opacity-50" />
            <p className="text-commander-muted text-sm">No active countdowns. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {countdowns.map((countdown) => (
              <CountdownCard
                key={countdown.id}
                countdown={countdown}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}