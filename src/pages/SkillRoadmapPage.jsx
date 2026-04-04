import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Plus, ChevronDown, ChevronRight, RefreshCw, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Default BJJ syllabus seeded on first load
const DEFAULT_SYLLABUS = [
  // Guard Retention
  { technique_name: "Hip Escape (Shrimp)", category: "Guard Retention", belt_level: "White" },
  { technique_name: "Granby Roll", category: "Guard Retention", belt_level: "White" },
  { technique_name: "Knee Shield Recovery", category: "Guard Retention", belt_level: "Blue" },
  { technique_name: "De La Riva Guard Entry", category: "Guard Retention", belt_level: "Blue" },
  { technique_name: "Spider Guard Framing", category: "Guard Retention", belt_level: "Purple" },
  // Sweeps
  { technique_name: "Scissor Sweep", category: "Sweeps", belt_level: "White" },
  { technique_name: "Hip Bump Sweep", category: "Sweeps", belt_level: "White" },
  { technique_name: "Flower Sweep", category: "Sweeps", belt_level: "Blue" },
  { technique_name: "Butterfly Sweep", category: "Sweeps", belt_level: "Blue" },
  { technique_name: "X-Guard Sweep", category: "Sweeps", belt_level: "Purple" },
  // Submissions
  { technique_name: "Rear Naked Choke", category: "Submissions", belt_level: "White" },
  { technique_name: "Armbar from Guard", category: "Submissions", belt_level: "White" },
  { technique_name: "Triangle Choke", category: "Submissions", belt_level: "White" },
  { technique_name: "Kimura", category: "Submissions", belt_level: "Blue" },
  { technique_name: "Guillotine", category: "Submissions", belt_level: "Blue" },
  { technique_name: "Heel Hook (Outside)", category: "Submissions", belt_level: "Purple" },
  { technique_name: "D'arce Choke", category: "Submissions", belt_level: "Purple" },
  // Escapes
  { technique_name: "Bridge and Roll (Upa)", category: "Escapes", belt_level: "White" },
  { technique_name: "Elbow-Knee Escape", category: "Escapes", belt_level: "White" },
  { technique_name: "Turtle Escape", category: "Escapes", belt_level: "Blue" },
  { technique_name: "Back Escape (Seatbelt)", category: "Escapes", belt_level: "Blue" },
  // Positional Control
  { technique_name: "Side Control Maintenance", category: "Positional Control", belt_level: "White" },
  { technique_name: "Mount Control", category: "Positional Control", belt_level: "White" },
  { technique_name: "Back Control (Hooks)", category: "Positional Control", belt_level: "Blue" },
  { technique_name: "Knee On Belly", category: "Positional Control", belt_level: "Blue" },
  // Defense
  { technique_name: "Posture in Guard", category: "Defense", belt_level: "White" },
  { technique_name: "Armbar Defense", category: "Defense", belt_level: "Blue" },
  { technique_name: "Triangle Defense", category: "Defense", belt_level: "Blue" },
];

const STATUS_CONFIG = {
  "Not Started": { color: "bg-gray-700", text: "text-gray-400", label: "Not Started", order: 0 },
  "Introduced": { color: "bg-blue-900", text: "text-blue-300", label: "Introduced", order: 1 },
  "Drilling": { color: "bg-yellow-900", text: "text-yellow-300", label: "Drilling", order: 2 },
  "Sparring": { color: "bg-orange-900", text: "text-orange-300", label: "Sparring", order: 3 },
  "Mastered": { color: "bg-green-900", text: "text-vellera-green", label: "Mastered", order: 4 },
};

const STATUS_ORDER = ["Not Started", "Introduced", "Drilling", "Sparring", "Mastered"];

const CATEGORY_ICONS = {
  "Guard Retention": "🛡️",
  "Sweeps": "🌀",
  "Submissions": "🔒",
  "Escapes": "💨",
  "Positional Control": "⚔️",
  "Footwork": "👣",
  "Defense": "🧱",
};

const BELT_COLORS = {
  White: "bg-gray-100 text-gray-900",
  Blue: "bg-blue-600 text-white",
  Purple: "bg-purple-700 text-white",
  Brown: "bg-amber-800 text-white",
  Black: "bg-gray-900 text-white border border-gray-600",
};

function statusFromCount(count) {
  if (count === 0) return "Not Started";
  if (count <= 2) return "Introduced";
  if (count <= 6) return "Drilling";
  if (count <= 14) return "Sparring";
  return "Mastered";
}

function TechniqueRow({ tech, onStatusChange }) {
  const cfg = STATUS_CONFIG[tech.status];
  return (
    <div className="flex items-center gap-3 py-2 border-b border-commander-border/40 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{tech.technique_name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${BELT_COLORS[tech.belt_level]}`}>{tech.belt_level}</span>
          {tech.session_count > 0 && (
            <span className="text-commander-muted text-xs">{tech.session_count}× practiced</span>
          )}
        </div>
      </div>
      <select
        value={tech.status}
        onChange={e => onStatusChange(tech.id, e.target.value)}
        className={`text-xs font-bold px-2 py-1 rounded-lg border-0 cursor-pointer ${cfg.color} ${cfg.text} min-w-[100px]`}
      >
        {STATUS_ORDER.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}

function CategorySection({ category, techniques, onStatusChange, journalMap }) {
  const [open, setOpen] = useState(true);
  const mastered = techniques.filter(t => t.status === "Mastered").length;
  const pct = techniques.length > 0 ? Math.round((mastered / techniques.length) * 100) : 0;

  return (
    <div className="bg-commander-surface border border-commander-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-800/30 transition-all"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{CATEGORY_ICONS[category] || "📌"}</span>
          <div className="text-left">
            <p className="text-white font-bold text-sm">{category}</p>
            <p className="text-commander-muted text-xs">{mastered}/{techniques.length} mastered</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Mini progress arc */}
          <div className="relative w-10 h-10">
            <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#1e1e2e" strokeWidth="4" />
              <circle
                cx="18" cy="18" r="14" fill="none"
                stroke={pct === 100 ? "#CCFF00" : "#00E5FF"} strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 87.96} 87.96`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-white">{pct}%</span>
          </div>
          {open ? <ChevronDown className="w-4 h-4 text-commander-muted" /> : <ChevronRight className="w-4 h-4 text-commander-muted" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-3">
          {techniques.map(tech => (
            <TechniqueRow key={tech.id} tech={tech} onStatusChange={onStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SkillRoadmapPage() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filterBelt, setFilterBelt] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTech, setNewTech] = useState({ technique_name: "", category: "Submissions", belt_level: "White" });

  const loadSkills = async () => {
    setLoading(true);
    try {
      let existing = await base44.entities.SkillRoadmap.list("-created_date", 200);

      // Seed default syllabus if empty
      if (existing.length === 0) {
        const seeded = await base44.entities.SkillRoadmap.bulkCreate(
          DEFAULT_SYLLABUS.map(t => ({ ...t, status: "Not Started", session_count: 0, is_custom: false }))
        );
        existing = seeded;
      }

      setSkills(existing);
    } catch (err) {
      console.error("Load skills error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Sync session counts from BJJTacticalJournal
  const syncFromJournal = async () => {
    setSyncing(true);
    try {
      const journals = await base44.entities.BJJTacticalJournal.list("-session_date", 200);

      // Build a map: technique_name (lowercase) → count + last_practiced
      const techMap = {};
      journals.forEach(session => {
        session.techniques_practiced?.forEach(tp => {
          const key = tp.name?.toLowerCase().trim();
          if (!key) return;
          techMap[key] = techMap[key] || { count: 0, last: session.session_date };
          techMap[key].count += 1;
          if (session.session_date > techMap[key].last) techMap[key].last = session.session_date;
        });
      });

      // Update skills whose session counts differ
      const updates = skills.map(async skill => {
        const key = skill.technique_name.toLowerCase().trim();
        const journalData = techMap[key];
        const newCount = journalData?.count || 0;
        const newStatus = statusFromCount(newCount);

        if (newCount !== skill.session_count || newStatus !== skill.status) {
          const updated = await base44.entities.SkillRoadmap.update(skill.id, {
            session_count: newCount,
            status: newStatus,
            last_practiced: journalData?.last || skill.last_practiced,
          });
          return { ...skill, ...updated };
        }
        return skill;
      });

      const updatedSkills = await Promise.all(updates);
      setSkills(updatedSkills);
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => { loadSkills(); }, []);

  const handleStatusChange = async (id, newStatus) => {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
    await base44.entities.SkillRoadmap.update(id, { status: newStatus });
  };

  const handleAddTechnique = async () => {
    if (!newTech.technique_name.trim()) return;
    const created = await base44.entities.SkillRoadmap.create({
      ...newTech,
      status: "Not Started",
      session_count: 0,
      is_custom: true,
    });
    setSkills(prev => [created, ...prev]);
    setNewTech({ technique_name: "", category: "Submissions", belt_level: "White" });
    setShowAddForm(false);
  };

  const filtered = filterBelt === "All" ? skills : skills.filter(s => s.belt_level === filterBelt);
  const byCategory = {};
  filtered.forEach(s => {
    if (!byCategory[s.category]) byCategory[s.category] = [];
    byCategory[s.category].push(s);
  });

  const totalMastered = skills.filter(s => s.status === "Mastered").length;
  const overallPct = skills.length > 0 ? Math.round((totalMastered / skills.length) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-commander-dark flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-vellera-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto pb-24 safe-area-top">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="text-commander-muted hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white text-xl font-black">BJJ Skill Roadmap</h1>
            <p className="text-commander-muted text-xs">{skills.length} techniques · auto-syncs from journal</p>
          </div>
        </div>
        <button
          onClick={syncFromJournal}
          disabled={syncing}
          className="bg-vellera-blue/20 border border-vellera-blue text-vellera-blue p-2 rounded-lg hover:bg-vellera-blue/40 transition-all"
          title="Sync from BJJ Journal"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Overall Progress */}
      <div className="bg-gradient-to-r from-vellera-blue/10 to-vellera-green/10 border border-vellera-blue/30 rounded-xl p-4">
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-20 h-20 -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#1e1e2e" strokeWidth="12" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={overallPct === 100 ? "#CCFF00" : "#00E5FF"} strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(overallPct / 100) * 263.9} 263.9`}
                style={{ transition: "stroke-dasharray 0.6s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-white text-lg font-black">{overallPct}%</p>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-white font-black text-lg">Overall Mastery</p>
            <p className="text-commander-muted text-sm">{totalMastered} of {skills.length} techniques mastered</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {STATUS_ORDER.map(s => {
                const count = skills.filter(sk => sk.status === s).length;
                if (count === 0) return null;
                return (
                  <span key={s} className={`text-xs px-2 py-0.5 rounded-full font-bold ${STATUS_CONFIG[s].color} ${STATUS_CONFIG[s].text}`}>
                    {count} {s}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Sync notice */}
      <div className="bg-gray-900/50 border border-commander-border rounded-lg px-3 py-2 flex items-center gap-2">
        <Target className="w-4 h-4 text-vellera-green flex-shrink-0" />
        <p className="text-commander-muted text-xs">Tap <span className="text-vellera-blue font-bold">↻</span> to auto-update statuses from your BJJ Tactical Journal sessions.</p>
      </div>

      {/* Belt Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["All", "White", "Blue", "Purple", "Brown", "Black"].map(belt => (
          <button
            key={belt}
            onClick={() => setFilterBelt(belt)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
              filterBelt === belt
                ? "border-vellera-blue bg-vellera-blue/20 text-vellera-blue"
                : "border-commander-border text-commander-muted hover:border-gray-500"
            }`}
          >
            {belt}
          </button>
        ))}
      </div>

      {/* Category Sections */}
      <div className="space-y-3">
        {Object.entries(byCategory).map(([cat, techs]) => (
          <CategorySection
            key={cat}
            category={cat}
            techniques={techs}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>

      {/* Add Custom Technique */}
      {showAddForm ? (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
          <p className="text-white font-bold text-sm">Add Custom Technique</p>
          <input
            type="text"
            placeholder="Technique name"
            value={newTech.technique_name}
            onChange={e => setNewTech(f => ({ ...f, technique_name: e.target.value }))}
            className="w-full bg-gray-900 border border-commander-border rounded-lg px-3 py-2 text-white text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <select value={newTech.category} onChange={e => setNewTech(f => ({ ...f, category: e.target.value }))}
              className="bg-gray-900 border border-commander-border rounded-lg px-3 py-2 text-white text-sm">
              {["Guard Retention","Sweeps","Submissions","Escapes","Positional Control","Footwork","Defense"].map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={newTech.belt_level} onChange={e => setNewTech(f => ({ ...f, belt_level: e.target.value }))}
              className="bg-gray-900 border border-commander-border rounded-lg px-3 py-2 text-white text-sm">
              {["White","Blue","Purple","Brown","Black"].map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddTechnique} className="flex-1 bg-vellera-green text-commander-dark font-bold py-2 rounded-lg hover:bg-vellera-blue transition-all">
              Add
            </button>
            <button onClick={() => setShowAddForm(false)} className="flex-1 bg-gray-800 text-white font-bold py-2 rounded-lg">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full bg-commander-surface border border-dashed border-commander-border rounded-xl py-3 flex items-center justify-center gap-2 text-commander-muted hover:text-white hover:border-vellera-blue transition-all text-sm"
        >
          <Plus className="w-4 h-4" /> Add Custom Technique
        </button>
      )}
    </div>
  );
}