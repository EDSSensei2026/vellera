import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Plus, ArrowLeft } from "lucide-react";
import { FormError, SubmitButton, RequiredField } from "../components/FormValidation";
import SelectDrawer from "../components/SelectDrawer";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { useTabStack } from "../hooks/useTabStack";

const ESCAPE_OPTIONS = ["Trap & Roll (Bridge)", "Shrimping to Guard", "Elbow Escape (Mount)", "Posturing in Closed Guard", "Knee-Shield (Z-Guard)", "Wall Walk (MMA)", "Technical Stand-up"];
const INJURY_AREAS = ["Lower Back", "Neck", "Fingers/Grips", "Knees", "Shoulders", "Hips", "Ribs"];
const SESSION_TYPES = ["BJJ Foundations", "MMA Wrestling", "No-Gi", "Masters Class", "S&C Strength", "S&C Zone2", "Home Mobility", "Open Mat"];
const LOCATIONS = ["The Lab", "Work Gym", "Crunch Fitness", "Home"];

// --- Biometric Entry ---
function BiometricEntry({ onSaved }) {
  const [form, setForm] = useState({ recovery_pct: "", hrv: "", rhr: "", sleep_performance: "", body_battery: "", weight_lbs: "", caloric_intake: "" });
  const [errors, setErrors] = useState({});

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.BiometricLog.create(data);
    },
    onMutate: async (data) => {
      const today = new Date().toISOString().split("T")[0];
      // Update today's biometric cache
      queryClient.setQueryData(["biometrics", "today"], data);
      // Update week's biometric cache
      queryClient.setQueryData(["biometrics", "week"], (old) => old ? [data, ...old.slice(0, 6)] : [data]);
      return { data };
    },
    onSuccess: (data, variables, context) => {
      toast.success("Morning metrics saved!");
      setForm({ recovery_pct: "", hrv: "", rhr: "", sleep_performance: "", body_battery: "", weight_lbs: "", caloric_intake: "" });
      onSaved();
    },
    onError: (error, variables, context) => {
      toast.error("Failed to save metrics");
      // Rollback on error
      queryClient.refetchQueries({ queryKey: ["biometrics"] });
    },
  });

  const validate = () => {
    const newErrors = {};
    if (!form.recovery_pct && !form.hrv && !form.rhr) {
      newErrors.general = "Please enter at least one biometric measurement";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    const today = new Date().toISOString().split("T")[0];
    const data = { date: today };
    Object.entries(form).forEach(([k, v]) => { if (v !== "") data[k] = Number(v); });
    mutation.mutate(data);
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
      {errors.general && <FormError message={errors.general} />}
      <div className="grid grid-cols-2 gap-3 mb-4 max-h-[300px] overflow-y-auto">
        {field("Whoop Recovery (%)", "recovery_pct", "e.g. 72")}
        {field("HRV (ms)", "hrv", "e.g. 55")}
        {field("Resting HR (bpm)", "rhr", "e.g. 58")}
        {field("Sleep Performance (%)", "sleep_performance", "e.g. 80")}
        {field("Garmin Body Battery", "body_battery", "e.g. 45")}
        {field("Weight (lbs)", "weight_lbs", "e.g. 249")}
      </div>
      <SubmitButton onClick={save} disabled={false} loading={mutation.isPending} label="Save Morning Metrics" />
    </div>
  );
}

// --- Session Journal ---
function SessionJournal() {
  const [partners, setPartners] = useState([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    session_type: "BJJ Foundations",
    location: "The Lab",
    duration_minutes: "",
    intensity: 5,
    gas_level: 5,
    gas_remaining_pct: 60,
    pressure_effectiveness: "Partial (Transitioned often)",
    successful_escapes: [],
    injury_notes: [],
    mma_striking_accuracy: "",
    mma_taken_down: false,
    wall_work_rounds: "",
    lifting_exercises: "",
    xp_awarded_technique: "",
    xp_amount: 5,
    sparring_partner_id: "",
    sparring_partner_name: "",
    wins: "",
    lessons: "",
    session_notes: "",
  });

  useEffect(() => {
    base44.entities.SparringPartner.list("-created_date", 100).then(setPartners);
  }, []);

  const toggle = (field, val) => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(val) ? f[field].filter(x => x !== val) : [...f[field], val],
    }));
  };

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (sessionData) => {
      await base44.entities.TrainingSession.create(sessionData);
      // Award XP to technique
      if (sessionData.xp_awarded_technique) {
        const techs = await base44.entities.Technique.filter({ name: sessionData.xp_awarded_technique });
        if (techs[0]) {
          const newXp = (techs[0].xp || 0) + (sessionData.xp_amount || 5);
          const level = Math.min(5, Math.floor(newXp / 20));
          await base44.entities.Technique.update(techs[0].id, { xp: newXp, mastery_level: level, last_drilled: sessionData.date });
        }
      }
    },
    onMutate: async (sessionData) => {
      // Optimistic update - add to recent sessions
      queryClient.setQueryData(["sessions", "recent"], (old) => old ? [sessionData, ...old.slice(0, 4)] : [sessionData]);
      return { sessionData };
    },
    onSuccess: (data, variables, context) => {
      toast.success("Session logged. Stay hydrated, Commander. 🥋");
      setForm(f => ({ ...f, session_notes: "", injury_notes: [], successful_escapes: [], wins: "", lessons: "", lifting_exercises: "" }));
    },
    onError: (error, variables, context) => {
      toast.error("Failed to log session");
      // Rollback on error
      queryClient.refetchQueries({ queryKey: ["sessions", "recent"] });
    },
  });

  const save = async () => {
    const sessionData = { ...form };
    if (form.sparring_partner_id) {
      const p = partners.find(x => x.id === form.sparring_partner_id);
      if (p) sessionData.sparring_partner_name = p.name;
    }
    mutation.mutate(sessionData);
  };

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!form.date) newErrors.date = "Date is required";
    if (!form.duration_minutes || Number(form.duration_minutes) <= 0) newErrors.duration = "Duration must be greater than 0";
    if (!form.session_type) newErrors.session_type = "Session type is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isMMA = form.session_type === "MMA Wrestling";
  const isLifting = form.session_type === "S&C Strength";

  return (
    <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-4 max-h-[70vh] overflow-y-auto">
      <h3 className="text-white font-bold">Post-Lab Session Journal</h3>

      {/* Date & Type */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <RequiredField>
            <label className="text-xs text-commander-muted block mb-1">Date</label>
          </RequiredField>
          <input type="date" value={form.date} onChange={e => { setForm(f => ({ ...f, date: e.target.value })); setErrors(e => ({ ...e, date: "" })); }}
            className={`w-full bg-gray-800 border rounded-lg px-3 py-2 text-white text-sm focus:outline-none min-h-[44px] ${errors.date ? "border-red-700" : "border-commander-border focus:border-commander-red"}`} />
          {errors.date && <FormError message={errors.date} />}
        </div>
        <div>
          <RequiredField>
            <label className="text-xs text-commander-muted block mb-1">Duration (mins)</label>
          </RequiredField>
          <input type="number" value={form.duration_minutes} onChange={e => { setForm(f => ({ ...f, duration_minutes: e.target.value })); setErrors(e => ({ ...e, duration: "" })); }}
            placeholder="60" className={`w-full bg-gray-800 border rounded-lg px-3 py-2 text-white text-sm focus:outline-none min-h-[44px] ${errors.duration ? "border-red-700" : "border-commander-border focus:border-commander-red"}`} />
          {errors.duration && <FormError message={errors.duration} />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SelectDrawer
          label="Session Type"
          value={form.session_type}
          options={SESSION_TYPES}
          onChange={(val) => setForm((f) => ({ ...f, session_type: val }))}
          required
        />
        <SelectDrawer
          label="Location"
          value={form.location}
          options={LOCATIONS}
          onChange={(val) => setForm((f) => ({ ...f, location: val }))}
          required
        />
      </div>

      {/* Intensity */}
      <div>
        <label className="text-xs text-commander-muted block mb-1">Intensity (1=easy, 10=max effort): <span className="text-blue-400 font-bold">{form.intensity}</span></label>
        <input type="range" min={1} max={10} value={form.intensity} onChange={e => setForm(f => ({ ...f, intensity: Number(e.target.value) }))}
          className="w-full accent-blue-600" />
      </div>

      {/* Gas Level (BJJ only) */}
      {!isLifting && (
      <div>
        <label className="text-xs text-commander-muted block mb-1">Gas Level Used (1=fresh, 10=gassed out): <span className="text-commander-red font-bold">{form.gas_level}</span></label>
        <input type="range" min={1} max={10} value={form.gas_level} onChange={e => setForm(f => ({ ...f, gas_level: Number(e.target.value) }))}
          className="w-full accent-red-600" />
        {form.gas_level >= 8 && <p className="text-red-400 text-xs mt-1">⚠️ 43yo Rule: 3 consecutive high-gas days triggers mandatory Mobility Day.</p>}
      </div>
      )}

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

      {/* Techniques Drilled (BJJ/MMA) */}
      {!isLifting && (
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
      )}

      {/* Lifting Exercises */}
      {isLifting && (
      <div>
        <label className="text-xs text-commander-muted block mb-1">Exercises & Sets × Reps</label>
        <textarea value={form.lifting_exercises} onChange={e => setForm(f => ({ ...f, lifting_exercises: e.target.value }))}
          rows={4} placeholder={"e.g.\nDeadlift: 3×5 @ 315lbs\nBench: 4×8 @ 185lbs\nDB Row: 3×10 @ 80lbs"}
          className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm font-mono resize-none" />
      </div>
      )}

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

      {/* Sparring Partner */}
      {!isLifting && (
        <SelectDrawer
          label="Sparring Partner (optional)"
          value={form.sparring_partner_id ? partners.find(p => p.id === form.sparring_partner_id)?.name || "" : ""}
          options={["", ...partners.map(p => `${p.name}${p.nickname ? ` "${p.nickname}"` : ""}`)]}
          onChange={(val) => {
            const p = partners.find(x => `${x.name}${x.nickname ? ` "${x.nickname}"` : ""}` === val);
            setForm((f) => ({ ...f, sparring_partner_id: p?.id || "" }));
          }}
        />
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

      {/* Wins & Lessons */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-bold text-green-400 block mb-1">🏆 Wins — What worked today?</label>
          <textarea value={form.wins} onChange={e => setForm(f => ({ ...f, wins: e.target.value }))}
            rows={2} placeholder="e.g. Finally hit the elbow escape clean 3x, stayed composed under pressure..."
            className="w-full bg-green-950/20 border border-green-800 rounded-lg px-3 py-2 text-white text-sm resize-none placeholder:text-green-900" />
        </div>
        <div>
          <label className="text-xs font-bold text-yellow-400 block mb-1">📚 Lessons — What to improve?</label>
          <textarea value={form.lessons} onChange={e => setForm(f => ({ ...f, lessons: e.target.value }))}
            rows={2} placeholder="e.g. Need to tuck elbows tighter in guard, hips too high on top pressure..."
            className="w-full bg-yellow-950/20 border border-yellow-800 rounded-lg px-3 py-2 text-white text-sm resize-none placeholder:text-yellow-900" />
        </div>
        <div>
          <label className="text-xs text-commander-muted block mb-1">Additional Notes</label>
          <textarea value={form.session_notes} onChange={e => setForm(f => ({ ...f, session_notes: e.target.value }))}
            rows={2} placeholder="Coach feedback, injuries, anything else..."
            className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm resize-none" />
        </div>
      </div>

      <SubmitButton onClick={() => { if (validate()) save(); }} disabled={false} loading={mutation.isPending} label="Save to Mat-Commander DB" />
    </div>
  );
}

export default function TrainingLog() {
  const containerRef = useRef(null);
  const [tab, setTab] = useState("session");
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const isDeepLinked = window.location.pathname === "/training";

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      setRefreshKey(k => k + 1);
      // Data will auto-refetch via component re-render
    } finally {
      setRefreshing(false);
    }
  };

  const pullRef = usePullToRefresh(handleRefresh);
  useTabStack(containerRef);

  return (
    <div ref={containerRef} className="p-4 space-y-4 max-w-lg mx-auto pb-24 safe-area-top overflow-auto h-screen">
      {refreshing && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-commander-surface border border-commander-border rounded-full px-4 py-2 flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-commander-red border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-white font-semibold">Refreshing...</span>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 mb-2">
        {isDeepLinked && (
          <a href="/" className="text-commander-muted hover:text-white transition-all touch-target-min" title="Go back">
            <ArrowLeft className="w-5 h-5" />
          </a>
        )}
        <h1 className="text-white text-xl font-black tracking-tight">Training Log</h1>
      </div>

      <div className="flex bg-commander-surface border border-commander-border rounded-xl overflow-hidden">
        {[["session", "Session Log"], ["biometrics", "Morning Metrics"]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} className={`flex-1 py-2 px-2 text-xs sm:text-sm font-medium transition-all min-h-[44px] flex items-center justify-center ${tab === v ? "bg-commander-red text-white" : "text-commander-muted"}`}>{l}</button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === "biometrics" ? (
          <BiometricEntry onSaved={() => setRefreshKey(k => k + 1)} />
        ) : (
          <SessionJournal key={refreshKey} />
        )}
      </div>
    </div>
  );
}