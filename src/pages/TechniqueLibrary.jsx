import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Star } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["Escapes & Survival", "Guard Retention", "Passing & Pressure", "Submissions", "Wrestling & Takedowns", "MMA Fundamentals"];

const BLUE_BELT_BLUEPRINT = [
  { name: "Trap and Roll (Bridge)", category: "Escapes & Survival", description: "Exit mount against equal weight", notes: "Essential for 250lb frame" },
  { name: "Shrimping to Guard", category: "Escapes & Survival", description: "Recover Half-Guard from Side Control", notes: "Hip mobility focus" },
  { name: "Elbow Escape (Mount)", category: "Escapes & Survival", description: "Core survival technique", notes: "Core survival" },
  { name: "Posturing in Closed Guard", category: "Guard Retention", description: "Neutralize pull-down for 2 mins", notes: "Shoulder health" },
  { name: "Knee-Shield (Z-Guard)", category: "Guard Retention", description: "Keep weight off chest", notes: "Keep weight off chest" },
  { name: "Over-Under Pass", category: "Passing & Pressure", description: "Utilize 250lb pressure", notes: "Utilize 250lb pressure" },
  { name: "Cross-Face Pressure", category: "Passing & Pressure", description: "Control opponent's head in Side Mount", notes: "Cooking the opponent" },
  { name: "Straight Armbar", category: "Submissions", description: "Finish from Mount and Guard", notes: "" },
  { name: "Kimura System", category: "Submissions", description: "Use as a control grip and a finish", notes: "" },
  { name: "Double Leg (Blast)", category: "Wrestling & Takedowns", description: "Effective entry for 250lb frame", notes: "Protecting the hips" },
  { name: "Sprawl & Circle", category: "Wrestling & Takedowns", description: "Use weight to stop shots", notes: "Bury with your chest" },
  { name: "Wall Walk", category: "MMA Fundamentals", description: "Getting back to feet using cage/wall", notes: "MMA Wrestling at The Lab" },
  { name: "Takedown Defense (Sprawl)", category: "MMA Fundamentals", description: "Protecting the hips on the feet", notes: "" },
];

function XPBar({ xp, level }) {
  const xpInLevel = xp % 20;
  const pct = (xpInLevel / 20) * 100;
  const colors = ["bg-gray-600", "bg-blue-600", "bg-teal-600", "bg-yellow-600", "bg-orange-600", "bg-commander-red"];
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} className={`w-3 h-3 ${i <= level ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`} />
        ))}
      </div>
      <div className="flex-1 bg-gray-800 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all ${colors[level]}`} style={{ width: `${level >= 5 ? 100 : pct}%` }} />
      </div>
      <span className="text-xs text-commander-muted font-mono">{xp}xp</span>
    </div>
  );
}

export default function TechniqueLibrary() {
  const [techniques, setTechniques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [newTech, setNewTech] = useState({ name: "", category: CATEGORIES[0], description: "", notes: "" });

  const load = () => base44.entities.Technique.list("-xp", 100).then(t => { setTechniques(t); setLoading(false); });

  const seedBlueprintIfEmpty = async (techs) => {
    if (techs.length === 0) {
      await base44.entities.Technique.bulkCreate(BLUE_BELT_BLUEPRINT.map(t => ({ ...t, xp: 0, mastery_level: 0 })));
      load();
      toast.success("Blue Belt Blueprint loaded! 🥋");
    }
  };

  useEffect(() => {
    base44.entities.Technique.list("-xp", 100).then(t => {
      setTechniques(t);
      setLoading(false);
      seedBlueprintIfEmpty(t);
    });
  }, []);

  const filtered = selectedCat === "All" ? techniques : techniques.filter(t => t.category === selectedCat);
  const blueBeltTechs = techniques.filter(t => !t.is_junior);
  const avgMastery = blueBeltTechs.length ? blueBeltTechs.reduce((s, t) => s + (t.mastery_level || 0), 0) / blueBeltTechs.length : 0;
  const promotionPct = Math.round((avgMastery / 5) * 100);

  const addTechnique = async () => {
    await base44.entities.Technique.create({ ...newTech, xp: 0, mastery_level: 0 });
    toast.success("Technique added");
    setShowAdd(false);
    load();
  };

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-xl font-black tracking-tight">Skill Matrix</h1>
        <button onClick={() => setShowAdd(s => !s)} className="bg-commander-red text-white rounded-lg p-2 hover:bg-red-700 transition-all">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Blue Belt Progress */}
      <div className="bg-gradient-to-r from-blue-950 to-commander-surface border border-blue-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-blue-300 text-xs font-bold uppercase tracking-widest">Blue Belt Promotion Score</p>
          <span className="text-white font-black text-xl">{promotionPct}%</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-3 mb-1">
          <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${promotionPct}%` }} />
        </div>
        <p className="text-blue-400 text-xs">Avg mastery: {avgMastery.toFixed(1)}/5 across {blueBeltTechs.length} core techniques</p>
      </div>

      {/* Add new */}
      {showAdd && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
          <input value={newTech.name} onChange={e => setNewTech(f => ({ ...f, name: e.target.value }))} placeholder="Technique name"
            className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm" />
          <select value={newTech.category} onChange={e => setNewTech(f => ({ ...f, category: e.target.value }))}
            className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <input value={newTech.description} onChange={e => setNewTech(f => ({ ...f, description: e.target.value }))} placeholder="Mastery criteria"
            className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm" />
          <button onClick={addTechnique} className="w-full bg-commander-red text-white rounded-lg py-2 text-sm font-bold">Add Technique</button>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {["All", ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setSelectedCat(c)}
            className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full border transition-all flex-shrink-0 ${selectedCat === c ? "border-commander-red bg-red-950 text-white" : "border-commander-border text-commander-muted"}`}>
            {c.split(" & ")[0]}
          </button>
        ))}
      </div>

      {/* Techniques */}
      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-commander-surface rounded-xl animate-pulse border border-commander-border" />)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(tech => (
            <div key={tech.id} className={`bg-commander-surface border rounded-xl p-4 transition-all ${tech.mastery_level >= 5 ? "border-yellow-700" : "border-commander-border"}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{tech.name}</p>
                  {tech.description && <p className="text-commander-muted text-xs mt-0.5">{tech.description}</p>}
                  {tech.notes && <p className="text-yellow-600 text-xs mt-0.5 italic">{tech.notes}</p>}
                </div>
                {tech.mastery_level >= 5 && <span className="text-xs bg-yellow-800 text-yellow-300 px-2 py-0.5 rounded-full ml-2">MASTERED</span>}
              </div>
              <XPBar xp={tech.xp || 0} level={tech.mastery_level || 0} />
              {tech.last_drilled && <p className="text-xs text-commander-muted mt-1">Last drilled: {tech.last_drilled}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}