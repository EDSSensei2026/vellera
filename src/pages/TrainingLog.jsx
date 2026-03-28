import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Save, Plus } from "lucide-react";

const ESCAPE_OPTIONS = ["Trap & Roll (Bridge)", "Shrimping to Guard", "Elbow Escape (Mount)", "Posturing in Closed Guard", "Knee-Shield (Z-Guard)", "Wall Walk (MMA)", "Technical Stand-up"];
const INJURY_AREAS = ["Lower Back", "Neck", "Fingers/Grips", "Knees", "Shoulders", "Hips", "Ribs"];
const SESSION_TYPES = ["BJJ Foundations", "MMA Wrestling", "No-Gi", "Masters Class", "S&C Strength", "S&C Zone2", "Home Mobility", "Open Mat"];
const LOCATIONS = ["The Lab", "Work Gym", "Crunch Fitness", "Home"];

// --- Biometric Entry ---
function BiometricEntry({ onSaved }) {
  const [form, setForm] = useState({ recovery_pct: "", hrv: "", rhr: "", sleep_performance: "", body_battery: "", weight_lbs: "", caloric_intake: "" });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    const data = { date: today };
    Object.entries(form).forEach(([k, v]) => { if (v !== "") data[k] = Number(v); });
    await base44.entities.BiometricLog.create(data);
    toast.success("Morning metrics saved!");
    onSaved();
    setSaving(false);
  };

  const field = (label, key, placeholder) => (
    <div>
      <label className="text-xs text-commander-muted block mb-1">{label}</label>
      <input
        type="number"
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-commander-red"
      />
    </div>
  );

  return (
    <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
      <h3 className="text-white font-bold mb-3">Morning Biometrics</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {field("Whoop Recovery (%)", "recovery_pct", "e.g. 72")}
        {field("HRV (ms)", "hrv", "e.g. 55")}
        {field("Resting HR (bpm)", "rhr", "e.g. 58")}
        {field("Sleep Performance (%)", "sleep_performance", "e.g. 80")}
        {field("Garmin Body Battery", "body_battery", "e.g. 45")}
        {field("Weight (lbs)", "weight_lbs", "e.g. 249")}
      </div>
      <button onClick={save} disabled={saving} className="w-full bg-commander-red text-white rounded-lg py-2 text-sm font-bold hover:bg-red-700 transition-all disabled:opacity-50">
        {saving ? "Saving..." : "Save Morning Metrics"}
      </button>
    </div>
  );
}

// --- Session Journal ---
function SessionJournal() {
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    session_type: "BJJ Foundations",
    location: "The Lab",
    duration_minutes: "",
    gas_level: 5,
    gas_remaining_pct: 60,
    pressure_effectiveness: "Partial (Transitioned often)",
    successful_escapes: [],
    injury_notes: [],
    mma_striking_accuracy: "",
    mma_taken_down: false,
    wall_work_rounds: "",
    xp_awarded_technique: "",
    xp_amount: 5,
    session_notes: "",
  });
  const [saving, setSaving] = useState(false);

  const toggle = (field, val) => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(val) ? f[field].filter(x => x !== val) : [...f[field], val],
    }));
  };

  const save = async () => {
    setSaving(true);
    await base44.entities.TrainingSession.create(form);
    // Award XP to technique
    if (form.xp_awarded_technique) {
      const techs = await base44.entities.Technique.filter({ name: form.xp_awarded_technique });
      if (techs[0]) {
        const newXp = (techs[0].xp || 0) + (form.xp_amount || 5);
        const level = Math.min(5, Math.floor(newXp / 20));
        await base44.entities.Technique.update(techs[0].id, { xp: newXp, mastery_level: level, last_drilled: form.date });
      }
    }
    // 43yo rule: check 3 consecutive high-gas days
    toast.success("Session logged. Stay hydrated, Commander. 🥋");
    setForm(f => ({ ...f, session_notes: "", injury_notes: [], successful_escapes: [] }));
    setSaving(false);
  };

  const isMMA = form.session_type === "MMA Wrestling";

  return (
    <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-4">
      <h3 className="text-white font-bold">Post-Lab Session Journal</h3>

      {/* Date & Type */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-commander-muted block mb-1">Date</label>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm" />
        </div>
        <div>
          <label className="text-xs text-commander-muted block mb-1">Duration (mins)</label>
          <input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
            placeholder="60" className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-commander-muted block mb-1">Session Type</label>
          <select value={form.session_type} onChange={e => setForm(f => ({ ...f, session_type: e.target.value }))}
            className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm">
            {SESSION_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-commander-muted block mb-1">Location</label>
          <select value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm">
            {LOCATIONS.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* Gas Level */}
      <div>
        <label className="text-xs text-commander-muted block mb-1">Gas Level Used (1=fresh, 10=gassed out): <span className="text-commander-red font-bold">{form.gas_level}</span></label>
        <input type="range" min={1} max={10} value={form.gas_level} onChange={e => setForm(f => ({ ...f, gas_level: Number(e.target.value) }))}
          className="w-full accent-red-600" />
        {form.gas_level >= 8 && <p className="text-red-400 text-xs mt-1">⚠️ 43yo Rule: 3 consecutive high-gas days triggers mandatory Mobility Day.</p>}
      </div>

      {/* Pressure */}
      <div>
        <label className="text-xs text-commander-muted block mb-2">Did you cook your opponent?</label>
        <div className="space-y-1">
          {["No (They moved too much)", "Partial (Transitioned often)", "Yes (Heavy Top Pressure)"].map(opt => (
            <button key={opt} onClick={() => setForm(f => ({ ...f, pressure_effectiveness: opt }))}
              className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-all ${form.pressure_effectiveness === opt ? "border-commander-red bg-red-950 text-white" : "border-commander-border text-commander-muted"}`}>
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Escapes */}
      <div>
        <label className="text-xs text-commander-muted block mb-2">Successful Escapes Today</label>
        <div className="flex flex-wrap gap-2">
          {ESCAPE_OPTIONS.map(e => (
            <button key={e} onClick={() => toggle("successful_escapes", e)}
              className={`text-xs px-2 py-1 rounded-full border transition-all ${form.successful_escapes.includes(e) ? "border-green-500 bg-green-950 text-green-300" : "border-commander-border text-commander-muted"}`}>
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* MMA specific */}
      {isMMA && (
        <div className="border border-yellow-800 bg-yellow-950/20 rounded-xl p-3 space-y-3">
          <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider">MMA Drill Metrics</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-commander-muted block mb-1">Striking Accuracy (1-5)</label>
              <input type="number" min={1} max={5} value={form.mma_striking_accuracy} onChange={e => setForm(f => ({ ...f, mma_striking_accuracy: e.target.value }))}
                className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="text-xs text-commander-muted block mb-1">Wall Work Rounds</label>
              <input type="number" value={form.wall_work_rounds} onChange={e => setForm(f => ({ ...f, wall_work_rounds: e.target.value }))}
                className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.mma_taken_down} onChange={e => setForm(f => ({ ...f, mma_taken_down: e.target.checked }))} className="accent-red-600" />
            <span className="text-sm text-white">Got taken down?</span>
          </label>
        </div>
      )}

      {/* XP Award */}
      <div>
        <label className="text-xs text-commander-muted block mb-1">Award XP to Technique</label>
        <div className="flex gap-2">
          <input type="text" value={form.xp_awarded_technique} onChange={e => setForm(f => ({ ...f, xp_awarded_technique: e.target.value }))}
            placeholder="e.g. Trap and Roll (Bridge)" className="flex-1 bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm" />
          <input type="number" value={form.xp_amount} onChange={e => setForm(f => ({ ...f, xp_amount: Number(e.target.value) }))}
            className="w-16 bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm text-center" />
        </div>
      </div>

      {/* Injury Check */}
      <div>
        <label className="text-xs text-commander-muted block mb-2">Pain Points (43yo Pre-Injury Check)</label>
        <div className="flex flex-wrap gap-2">
          {INJURY_AREAS.map(a => (
            <button key={a} onClick={() => toggle("injury_notes", a)}
              className={`text-xs px-2 py-1 rounded-full border transition-all ${form.injury_notes.includes(a) ? "border-red-500 bg-red-950 text-red-300" : "border-commander-border text-commander-muted"}`}>
              {a}
            </button>
          ))}
        </div>
        {form.injury_notes.includes("Fingers/Grips") && <p className="text-yellow-400 text-xs mt-1">⚠️ Grip fatigue: 2 logs this week may swap Gi session for No-Gi.</p>}
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs text-commander-muted block mb-1">Session Notes</label>
        <textarea value={form.session_notes} onChange={e => setForm(f => ({ ...f, session_notes: e.target.value }))}
          rows={3} placeholder="What worked? What didn't? Coach feedback..."
          className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm resize-none" />
      </div>

      <button onClick={save} disabled={saving} className="w-full bg-commander-red text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all disabled:opacity-50">
        <Save className="w-4 h-4" />
        {saving ? "Saving..." : "Save to Mat-Commander DB"}
      </button>
    </div>
  );
}

export default function TrainingLog() {
  const [tab, setTab] = useState("session");
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
      <h1 className="text-white text-xl font-black tracking-tight">Training Log</h1>

      <div className="flex bg-commander-surface border border-commander-border rounded-xl overflow-hidden">
        {[["session", "Session Log"], ["biometrics", "Morning Metrics"]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} className={`flex-1 py-2 text-sm font-medium transition-all ${tab === v ? "bg-commander-red text-white" : "text-commander-muted"}`}>{l}</button>
        ))}
      </div>

      {tab === "biometrics" ? (
        <BiometricEntry onSaved={() => setRefreshKey(k => k + 1)} />
      ) : (
        <SessionJournal key={refreshKey} />
      )}
    </div>
  );
}