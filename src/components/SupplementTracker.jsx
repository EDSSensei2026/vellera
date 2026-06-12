import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { toast } from "sonner";
import { Plus, Check, Trash2, Pill } from "lucide-react";
import SelectDrawer from "./SelectDrawer";

const TIMINGS = ["Morning", "Pre-Workout", "Post-Workout", "With Meal", "Bedtime", "As Needed"];
const CATEGORIES = ["Supplement", "Medication", "Vitamin/Mineral", "Herb/Adaptogen", "Protein/Amino", "Recovery"];

const CATEGORY_COLORS = {
  "Medication": "text-red-400 border-red-800 bg-red-950/30",
  "Supplement": "text-blue-400 border-blue-800 bg-blue-950/30",
  "Vitamin/Mineral": "text-yellow-400 border-yellow-800 bg-yellow-950/30",
  "Herb/Adaptogen": "text-green-400 border-green-800 bg-green-950/30",
  "Protein/Amino": "text-orange-400 border-orange-800 bg-orange-950/30",
  "Recovery": "text-purple-400 border-purple-800 bg-purple-950/30",
};

const TIMING_ORDER = ["Morning", "Pre-Workout", "With Meal", "Post-Workout", "Bedtime", "As Needed"];

const SUGGESTED_STACK = [
  { name: "Creatine Monohydrate", dosage: "5g", timing: "Post-Workout", category: "Supplement", notes: "Load phase: 20g/day × 5 days, then 5g/day maintenance" },
  { name: "Omega-3 Fish Oil", dosage: "2g", timing: "Morning", category: "Supplement", notes: "Anti-inflammatory — critical for joint health at 43yo" },
  { name: "Magnesium Glycinate", dosage: "400mg", timing: "Bedtime", category: "Vitamin/Mineral", notes: "Improves sleep quality and muscle recovery" },
  { name: "Vitamin D3 + K2", dosage: "5000 IU / 100mcg", timing: "Morning", category: "Vitamin/Mineral", notes: "Bone density and immune support" },
  { name: "Collagen Peptides", dosage: "10g", timing: "Pre-Workout", category: "Supplement", notes: "With Vitamin C 30 min pre-workout — joint tissue repair" },
  { name: "Ashwagandha (KSM-66)", dosage: "600mg", timing: "Bedtime", category: "Herb/Adaptogen", notes: "Cortisol reduction, testosterone support" },
];

export default function SupplementTracker() {
  const today = new Date().toISOString().split("T")[0];
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showSuggested, setShowSuggested] = useState(false);
  const [form, setForm] = useState({ name: "", dosage: "", timing: "Morning", category: "Supplement", notes: "" });

  const load = () => {
    base44.entities.SupplementLog.list("-date", 100).then(l => {
      setLogs(l);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const todayLogs = logs.filter(l => l.date === today);
  const groupedToday = TIMING_ORDER.reduce((acc, timing) => {
    const items = todayLogs.filter(l => l.timing === timing);
    if (items.length > 0) acc[timing] = items;
    return acc;
  }, {});

  const pastLogs = logs.filter(l => l.date !== today);
  const uniquePast = [...new Map(pastLogs.map(l => [l.name, l])).values()];

  const handleAdd = async () => {
    if (!form.name) { toast.error("Enter a supplement name"); return; }
    await base44.entities.SupplementLog.create({ ...form, date: today, taken: false });
    toast.success(`${form.name} added to today's stack`);
    setForm({ name: "", dosage: "", timing: "Morning", category: "Supplement", notes: "" });
    setShowAdd(false);
    load();
  };

  const toggleTaken = async (log) => {
    await base44.entities.SupplementLog.update(log.id, { taken: !log.taken });
    setLogs(prev => prev.map(l => l.id === log.id ? { ...l, taken: !l.taken } : l));
  };

  const handleDelete = async (id) => {
    await base44.entities.SupplementLog.delete(id);
    setLogs(prev => prev.filter(l => l.id !== id));
    toast.success("Removed");
  };

  const addFromSuggested = async (item) => {
    await base44.entities.SupplementLog.create({ ...item, date: today, taken: false });
    toast.success(`${item.name} added`);
    load();
  };

  const takenCount = todayLogs.filter(l => l.taken).length;

  return (
    <div className="space-y-4">
      {/* Today's Progress */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-commander-muted uppercase tracking-wider">Today's Stack</p>
          <span className="text-xs font-bold text-white">{takenCount}/{todayLogs.length} taken</span>
        </div>
        {todayLogs.length > 0 && (
          <div className="w-full bg-gray-800 rounded-full h-2 mb-3">
            <div className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${todayLogs.length > 0 ? (takenCount / todayLogs.length) * 100 : 0}%` }} />
          </div>
        )}
        {todayLogs.length === 0 && (
          <p className="text-commander-muted text-xs">No supplements logged for today yet.</p>
        )}
      </div>

      {/* Today grouped by timing */}
      {Object.entries(groupedToday).map(([timing, items]) => (
        <div key={timing} className="bg-commander-surface border border-commander-border rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-commander-border bg-black/20">
            <p className="text-xs text-commander-muted font-bold uppercase tracking-wider">{timing}</p>
          </div>
          <div className="divide-y divide-commander-border">
            {items.map(log => {
              const catStyle = CATEGORY_COLORS[log.category] || "text-gray-400 border-gray-700 bg-gray-900";
              return (
                <div key={log.id} className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => toggleTaken(log)}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${log.taken ? "bg-green-600 border-green-600" : "border-gray-600 hover:border-green-500"}`}>
                    {log.taken && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-semibold ${log.taken ? "line-through text-gray-500" : "text-white"}`}>{log.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${catStyle}`}>{log.category}</span>
                    </div>
                    <p className="text-commander-muted text-xs">{log.dosage}{log.notes ? ` · ${log.notes}` : ""}</p>
                  </div>
                  <button onClick={() => handleDelete(log.id)} className="p-2 text-gray-600 hover:text-red-400 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Add new */}
      <button onClick={() => setShowAdd(s => !s)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-commander-border text-commander-muted hover:border-commander-red hover:text-white transition-all min-h-[44px]">
        <Plus className="w-4 h-4" />
        <span className="text-sm font-medium">Add Supplement / Medication</span>
      </button>

      {showAdd && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Name (e.g. Creatine, Metformin, Vitamin D)" autoFocus
            className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-commander-red min-h-[44px]" />
          <input value={form.dosage} onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))}
            placeholder="Dosage (e.g. 5g, 500mg, 2 capsules)"
            className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-commander-red min-h-[44px]" />
          <div className="grid grid-cols-2 gap-2">
            <SelectDrawer label="Timing" value={form.timing} options={TIMINGS} onChange={v => setForm(f => ({ ...f, timing: v }))} />
            <SelectDrawer label="Category" value={form.category} options={CATEGORIES} onChange={v => setForm(f => ({ ...f, category: v }))} />
          </div>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes / side effects / instructions (optional)" rows={2}
            className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-commander-red" />
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-lg border border-commander-border text-commander-muted text-sm font-medium hover:text-white transition-all">Cancel</button>
            <button onClick={handleAdd} className="flex-1 py-2.5 rounded-lg bg-commander-red text-white text-sm font-bold hover:bg-red-700 transition-all">Add to Stack</button>
          </div>
        </div>
      )}

      {/* Suggested stack */}
      <div className="bg-commander-surface border border-[#00E5FF30] rounded-xl overflow-hidden">
        <button onClick={() => setShowSuggested(s => !s)}
          className="w-full flex items-center justify-between px-4 py-3 min-h-[44px]">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-[#00E5FF]" />
            <p className="text-[#00E5FF] text-sm font-bold">43yo Athlete Suggested Stack</p>
          </div>
          <span className="text-xs text-commander-muted">{showSuggested ? "▲" : "▼"}</span>
        </button>
        {showSuggested && (
          <div className="border-t border-commander-border divide-y divide-commander-border">
            {SUGGESTED_STACK.map(item => (
              <div key={item.name} className="flex items-start gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold">{item.name}</p>
                  <p className="text-commander-muted text-xs">{item.dosage} · {item.timing}</p>
                  <p className="text-gray-500 text-xs mt-0.5 italic">{item.notes}</p>
                </div>
                <button onClick={() => addFromSuggested(item)}
                  className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg border border-[#00E5FF40] text-[#00E5FF] hover:bg-[#00E5FF20] transition-all min-h-[36px]">
                  + Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History: unique supplements logged before */}
      {uniquePast.length > 0 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
          <p className="text-xs text-commander-muted uppercase tracking-wider mb-3">Previously Logged</p>
          <div className="flex flex-wrap gap-2">
            {uniquePast.map(log => (
              <button key={log.id}
                onClick={() => addFromSuggested({ name: log.name, dosage: log.dosage, timing: log.timing, category: log.category, notes: log.notes || "" })}
                className="text-xs bg-gray-800 border border-gray-700 text-gray-300 px-3 py-1.5 rounded-full hover:border-commander-red hover:text-white transition-all">
                + {log.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}