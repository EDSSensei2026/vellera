import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import BackButton from "../components/BackButton";
import { toast } from "sonner";
import { Plus, Users, ChevronLeft, Dumbbell, Calendar } from "lucide-react";
import SelectDrawer from "../components/SelectDrawer";

const BELT_COLORS = {
  White: "bg-gray-200 text-gray-800",
  Blue: "bg-blue-600 text-white",
  Purple: "bg-purple-600 text-white",
  Brown: "bg-amber-800 text-white",
  Black: "bg-gray-900 text-white border border-gray-600",
};

function PartnerProfile({ partner, onBack }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.TrainingSession.filter({ sparring_partner_id: partner.id }).then(s => {
      setSessions(s.sort((a, b) => b.date.localeCompare(a.date)));
      setLoading(false);
    });
  }, [partner.id]);

  // Aggregate common techniques from all sessions
  const techCount = {};
  sessions.forEach(s => {
    (s.techniques_drilled || []).forEach(t => {
      techCount[t] = (techCount[t] || 0) + 1;
    });
    (s.successful_escapes || []).forEach(t => {
      techCount[t] = (techCount[t] || 0) + 1;
    });
  });
  const topTechs = Object.entries(techCount).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const totalMinutes = sessions.reduce((s, r) => s + (r.duration_minutes || 0), 0);

  return (
    <div className="space-y-4">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1 text-commander-muted hover:text-white text-sm transition-all">
        <ChevronLeft className="w-4 h-4" /> All Partners
      </button>

      {/* Profile Header */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-commander-red rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0">
            {partner.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-white font-black text-lg">{partner.name}</p>
              {partner.nickname && <p className="text-commander-muted text-sm">"{partner.nickname}"</p>}
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              {partner.belt_level && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${BELT_COLORS[partner.belt_level] || "bg-gray-700 text-white"}`}>
                  {partner.belt_level} Belt
                </span>
              )}
              {partner.weight_class && <span className="text-xs text-commander-muted">{partner.weight_class} lbs</span>}
              {partner.gym && <span className="text-xs text-commander-muted">@ {partner.gym}</span>}
            </div>
            {partner.notes && <p className="text-commander-muted text-xs mt-2 italic">{partner.notes}</p>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center">
          <p className="text-white font-black text-xl">{sessions.length}</p>
          <p className="text-commander-muted text-xs">Sessions</p>
        </div>
        <div className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center">
          <p className="text-red-400 font-black text-xl">{Math.round(totalMinutes / 60)}h</p>
          <p className="text-commander-muted text-xs">Mat Time</p>
        </div>
        <div className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center">
          <p className="text-yellow-400 font-black text-xl">{topTechs.length}</p>
          <p className="text-commander-muted text-xs">Techniques</p>
        </div>
      </div>

      {/* Common Techniques */}
      {topTechs.length > 0 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell className="w-4 h-4 text-commander-red" />
            <p className="text-xs text-commander-muted uppercase tracking-widest">Common Techniques Drilled</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {topTechs.map(([tech, count]) => (
              <div key={tech} className="flex items-center gap-1 bg-gray-800 border border-commander-border rounded-full px-3 py-1">
                <span className="text-white text-xs">{tech}</span>
                <span className="text-commander-red text-xs font-bold">×{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Roll History */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-commander-red" />
          <p className="text-xs text-commander-muted uppercase tracking-widest">Roll History</p>
        </div>
        {loading ? (
          <div className="h-20 animate-pulse bg-gray-800 rounded-lg" />
        ) : sessions.length === 0 ? (
          <p className="text-commander-muted text-sm text-center py-4">No sessions logged yet with {partner.name}.</p>
        ) : (
          <div className="space-y-2">
            {sessions.map(s => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-commander-border last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">{s.session_type}</p>
                  <p className="text-commander-muted text-xs">{s.date}{s.location ? ` · ${s.location}` : ""}</p>
                </div>
                <div className="text-right">
                  {s.duration_minutes && <p className="text-white text-xs">{s.duration_minutes} min</p>}
                  {s.intensity && (
                    <p className={`text-xs font-bold ${s.intensity >= 8 ? "text-red-400" : s.intensity >= 5 ? "text-yellow-400" : "text-green-400"}`}>
                      Intensity {s.intensity}/10
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SparringPartners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", nickname: "", gym: "The Lab", belt_level: "White", weight_class: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const load = () => base44.entities.SparringPartner.list("-created_date", 100).then(p => { setPartners(p); setLoading(false); });
  useEffect(() => { load(); }, []);

  const addPartner = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await base44.entities.SparringPartner.create(form);
    toast.success(`${form.name} added to your roster!`);
    setForm({ name: "", nickname: "", gym: "The Lab", belt_level: "White", weight_class: "", notes: "" });
    setShowAdd(false);
    load();
    setSaving(false);
  };

  if (selected) return (
    <div className="p-4 max-w-lg mx-auto pb-24">
      <PartnerProfile partner={selected} onBack={() => setSelected(null)} />
    </div>
  );

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24 safe-area-top">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton to="/" />
          <Users className="w-5 h-5 text-commander-red" />
          <h1 className="text-white text-xl font-black tracking-tight">Sparring Partners</h1>
        </div>
        <button onClick={() => setShowAdd(s => !s)} className="bg-commander-red text-white rounded-lg p-2 hover:bg-red-700 transition-all">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
          <p className="text-white font-bold text-sm">Add Training Partner</p>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name *"
              className="col-span-2 w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm" />
            <input value={form.nickname} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))} placeholder="Nickname"
              className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm" />
            <input value={form.weight_class} onChange={e => setForm(f => ({ ...f, weight_class: e.target.value }))} placeholder="Weight (lbs)"
              className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SelectDrawer
              label="Belt Level"
              value={form.belt_level}
              options={["White", "Blue", "Purple", "Brown", "Black"]}
              onChange={(val) => setForm(f => ({ ...f, belt_level: val }))}
            />
            <input value={form.gym} onChange={e => setForm(f => ({ ...f, gym: e.target.value }))} placeholder="Home gym"
              className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={2} placeholder="Style notes, tendencies, game plan..."
            className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm resize-none" />
          <button onClick={addPartner} disabled={saving || !form.name.trim()}
            className="w-full bg-commander-red text-white rounded-lg py-2 text-sm font-bold hover:bg-red-700 transition-all disabled:opacity-50">
            {saving ? "Adding..." : "Add Partner"}
          </button>
        </div>
      )}

      {/* Partner list */}
      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-commander-surface border border-commander-border rounded-xl animate-pulse" />)}</div>
      ) : partners.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-10 h-10 text-commander-muted mx-auto mb-3" />
          <p className="text-commander-muted text-sm">No partners yet. Add your first training partner.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {partners.map(p => (
            <button key={p.id} onClick={() => setSelected(p)}
              className="w-full bg-commander-surface border border-commander-border rounded-xl p-3 flex items-center gap-3 hover:border-commander-red transition-all text-left">
              <div className="w-10 h-10 bg-commander-red rounded-xl flex items-center justify-center text-white font-black text-base flex-shrink-0">
                {p.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">{p.name}{p.nickname ? ` "${p.nickname}"` : ""}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {p.belt_level && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${BELT_COLORS[p.belt_level] || "bg-gray-700 text-white"}`}>
                      {p.belt_level}
                    </span>
                  )}
                  {p.gym && <span className="text-xs text-commander-muted">{p.gym}</span>}
                  {p.weight_class && <span className="text-xs text-commander-muted">{p.weight_class} lbs</span>}
                </div>
              </div>
              <ChevronLeft className="w-4 h-4 text-commander-muted rotate-180 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}