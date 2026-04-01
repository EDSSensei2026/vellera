import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Plus, Pill, Trash2, CheckCircle, XCircle } from "lucide-react";
import BackButton from "../components/BackButton";

const TYPES = ["Supplement", "Medication", "Vitamin", "Herb/Adaptogen", "Protein/Fuel", "Other"];
const TIMINGS = ["Pre-Workout", "Post-Workout", "Morning", "Evening", "With Meals", "As Needed"];

const TYPE_COLORS = {
  "Supplement":     { text: "text-blue-400",   bg: "bg-blue-950/40 border-blue-800" },
  "Medication":     { text: "text-red-400",     bg: "bg-red-950/40 border-red-800" },
  "Vitamin":        { text: "text-yellow-400",  bg: "bg-yellow-950/40 border-yellow-800" },
  "Herb/Adaptogen": { text: "text-green-400",   bg: "bg-green-950/40 border-green-800" },
  "Protein/Fuel":   { text: "text-orange-400",  bg: "bg-orange-950/40 border-orange-800" },
  "Other":          { text: "text-gray-400",    bg: "bg-gray-800/40 border-gray-700" },
};

const TIMING_ORDER = ["Morning", "Pre-Workout", "With Meals", "Post-Workout", "Evening", "As Needed"];

const SUGGESTED = [
  { name: "Creatine Monohydrate", type: "Supplement", dose: "5g", timing: "Post-Workout", purpose: "Strength + recovery for grappling" },
  { name: "Magnesium Glycinate", type: "Supplement", dose: "400mg", timing: "Evening", purpose: "Sleep quality + muscle recovery at 43yo" },
  { name: "Omega-3 Fish Oil", type: "Supplement", dose: "2–3g EPA/DHA", timing: "With Meals", purpose: "Joint inflammation reduction — critical for 250lb frame" },
  { name: "Vitamin D3 + K2", type: "Vitamin", dose: "5000 IU D3 / 100mcg K2", timing: "Morning", purpose: "Bone density + immune function" },
  { name: "Whey Protein", type: "Protein/Fuel", dose: "30–40g", timing: "Post-Workout", purpose: "Hit 250g/day protein target for muscle retention" },
  { name: "Electrolytes", type: "Supplement", dose: "1 serving", timing: "Pre-Workout", purpose: "Hydration for 2-hour mat sessions" },
];

const EMPTY_FORM = { name: "", type: "Supplement", dose: "", timing: "Morning", purpose: "", active: true, date_started: new Date().toISOString().split("T")[0] };

export default function SupplementLog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSuggested, setShowSuggested] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");

  const load = () => base44.entities.SupplementLog.list("-created_date", 100).then(d => { setItems(d); setLoading(false); });

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name.trim()) { toast.error("Name required"); return; }
    setSaving(true);
    await base44.entities.SupplementLog.create(form);
    toast.success(`${form.name} added!`);
    setForm(EMPTY_FORM);
    setShowForm(false);
    setSaving(false);
    load();
  };

  const addSuggested = async (s) => {
    await base44.entities.SupplementLog.create({ ...s, active: true, date_started: new Date().toISOString().split("T")[0] });
    toast.success(`${s.name} added to your stack!`);
    load();
  };

  const toggleActive = async (item) => {
    await base44.entities.SupplementLog.update(item.id, { active: !item.active });
    load();
  };

  const remove = async (id) => {
    await base44.entities.SupplementLog.delete(id);
    toast.success("Removed");
    load();
  };

  const filtered = activeFilter === "All" ? items : activeFilter === "Active" ? items.filter(i => i.active) : items.filter(i => i.type === activeFilter);

  // Group active items by timing
  const grouped = TIMING_ORDER.reduce((acc, timing) => {
    const group = filtered.filter(i => i.timing === timing && i.active);
    if (group.length > 0) acc[timing] = group;
    return acc;
  }, {});

  const inactive = filtered.filter(i => !i.active);

  const activeCount = items.filter(i => i.active).length;
  const preCount = items.filter(i => i.active && i.timing === "Pre-Workout").length;

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24 safe-area-top overflow-auto h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton to="/" />
          <div>
            <h1 className="text-white text-xl font-black tracking-tight">Supplement Stack</h1>
            <p className="text-commander-muted text-xs">Supplements · Medications · Vitamins</p>
          </div>
        </div>
        <button onClick={() => setShowForm(f => !f)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center bg-commander-red text-white rounded-lg hover:bg-red-700 transition-all">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center">
          <p className="text-white font-black text-2xl">{activeCount}</p>
          <p className="text-commander-muted text-xs">Active</p>
        </div>
        <div className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center">
          <p className="text-yellow-400 font-black text-2xl">{preCount}</p>
          <p className="text-commander-muted text-xs">Pre-Workout</p>
        </div>
        <div className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center">
          <p className="text-blue-400 font-black text-2xl">{items.length}</p>
          <p className="text-commander-muted text-xs">Total</p>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
          <p className="text-white font-bold text-sm">Add Supplement / Medication</p>

          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Name (e.g. Creatine, Ibuprofen, Vitamin D)"
            className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-commander-red min-h-[44px]" />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-commander-muted block mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm min-h-[44px]">
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-commander-muted block mb-1">Timing</label>
              <select value={form.timing} onChange={e => setForm(f => ({ ...f, timing: e.target.value }))}
                className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm min-h-[44px]">
                {TIMINGS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <input value={form.dose} onChange={e => setForm(f => ({ ...f, dose: e.target.value }))}
            placeholder="Dose (e.g. 500mg, 2 capsules, 1 scoop)"
            className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm min-h-[44px]" />

          <textarea value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
            placeholder="Purpose / notes (e.g. joint support, sleep quality, prescribed for...)"
            rows={2}
            className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm resize-none" />

          <input type="date" value={form.date_started} onChange={e => setForm(f => ({ ...f, date_started: e.target.value }))}
            className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm min-h-[44px]" />

          <button onClick={save} disabled={saving}
            className="w-full bg-commander-red text-white rounded-xl py-3 font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-60 min-h-[44px]">
            {saving ? "Saving…" : "Add to Stack"}
          </button>
        </div>
      )}

      {/* Suggested Stack */}
      <button onClick={() => setShowSuggested(s => !s)}
        className="w-full bg-blue-950/30 border border-blue-800 rounded-xl px-4 py-3 flex items-center justify-between text-left">
        <div>
          <p className="text-blue-300 font-bold text-sm">💊 43yo Athlete Suggested Stack</p>
          <p className="text-blue-600 text-xs">Evidence-based supplements for BJJ recovery</p>
        </div>
        {showSuggested ? <span className="text-blue-400 text-xs">Hide ▲</span> : <span className="text-blue-400 text-xs">View ▼</span>}
      </button>

      {showSuggested && (
        <div className="space-y-2">
          {SUGGESTED.map(s => {
            const alreadyAdded = items.some(i => i.name.toLowerCase() === s.name.toLowerCase());
            const colors = TYPE_COLORS[s.type] || TYPE_COLORS.Other;
            return (
              <div key={s.name} className={`border rounded-xl p-3 flex items-start gap-3 ${colors.bg}`}>
                <Pill className={`w-4 h-4 flex-shrink-0 mt-0.5 ${colors.text}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-bold">{s.name}</p>
                  <p className="text-commander-muted text-xs">{s.dose} · {s.timing}</p>
                  <p className="text-commander-muted text-xs mt-0.5 italic">{s.purpose}</p>
                </div>
                {alreadyAdded ? (
                  <span className="text-green-400 text-xs font-bold flex-shrink-0">✓ Added</span>
                ) : (
                  <button onClick={() => addSuggested(s)}
                    className="text-xs bg-blue-700 hover:bg-blue-600 text-white px-2 py-1 rounded-lg font-bold flex-shrink-0 min-h-[36px] flex items-center">
                    + Add
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Filter */}
      {items.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {["All", "Active", ...TYPES].map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all min-h-[36px] ${activeFilter === f ? "bg-commander-red border-commander-red text-white" : "border-commander-border text-commander-muted"}`}>
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Grouped by timing */}
      {Object.entries(grouped).map(([timing, group]) => (
        <div key={timing}>
          <p className="text-xs text-commander-muted uppercase tracking-wider mb-2">{timing}</p>
          <div className="space-y-2">
            {group.map(item => {
              const colors = TYPE_COLORS[item.type] || TYPE_COLORS.Other;
              return (
                <div key={item.id} className={`border rounded-xl p-3 flex items-start gap-3 ${colors.bg}`}>
                  <Pill className={`w-4 h-4 flex-shrink-0 mt-0.5 ${colors.text}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white text-sm font-bold">{item.name}</p>
                      <span className={`text-xs font-medium ${colors.text}`}>{item.type}</span>
                    </div>
                    {item.dose && <p className="text-commander-muted text-xs mt-0.5">{item.dose}</p>}
                    {item.purpose && <p className="text-commander-muted text-xs italic">{item.purpose}</p>}
                    {item.date_started && <p className="text-gray-600 text-xs mt-0.5">Since {item.date_started}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => toggleActive(item)} title="Toggle active" className="min-h-[36px] min-w-[36px] flex items-center justify-center">
                      {item.active ? <CheckCircle className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-gray-600" />}
                    </button>
                    <button onClick={() => remove(item.id)} className="min-h-[36px] min-w-[36px] flex items-center justify-center hover:text-red-400 transition-all text-gray-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Inactive */}
      {inactive.length > 0 && activeFilter !== "Active" && (
        <div>
          <p className="text-xs text-commander-muted uppercase tracking-wider mb-2">Inactive / Paused</p>
          <div className="space-y-2 opacity-50">
            {inactive.map(item => {
              const colors = TYPE_COLORS[item.type] || TYPE_COLORS.Other;
              return (
                <div key={item.id} className="border border-gray-800 rounded-xl p-3 flex items-center gap-3">
                  <Pill className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-gray-500 text-sm line-through">{item.name}</p>
                    <p className="text-gray-600 text-xs">{item.dose} · {item.timing}</p>
                  </div>
                  <button onClick={() => toggleActive(item)} className="text-xs text-blue-400 hover:text-blue-300 min-h-[36px] px-2 flex items-center">
                    Restore
                  </button>
                  <button onClick={() => remove(item.id)} className="min-h-[36px] min-w-[36px] flex items-center justify-center text-gray-600 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-8 text-center">
          <Pill className="w-8 h-8 text-commander-muted mx-auto mb-2" />
          <p className="text-commander-muted text-sm">No supplements logged yet.</p>
          <p className="text-commander-muted text-xs mt-1">Start with the 43yo Suggested Stack above ↑</p>
        </div>
      )}
    </div>
  );
}