import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import BackButton from "../components/BackButton";
import { toast } from "sonner";
import { Star, Plus } from "lucide-react";

const COMP_DATE = new Date("2026-07-18");

const JUNIOR_TECHNIQUES = [
  { name: "Bear Crawl", category: "Junior - Movement", description: "Coordination & core strength", notes: "Animal crawl series" },
  { name: "Gorilla Walk", category: "Junior - Movement", description: "Upper body strength & coordination", notes: "Animal crawl series" },
  { name: "Technical Stand-up", category: "Junior - Movement", description: "Self-defense basics — get to feet safely", notes: "" },
  { name: "Breakfalls (Forward/Back)", category: "Junior - Movement", description: "Safety in takedowns", notes: "Safety first" },
  { name: "The Backpack (Back Control)", category: "Junior - BJJ Basics", description: "Staying attached to partner's back", notes: "Fun position" },
  { name: "Bullfighter Guard Pass", category: "Junior - BJJ Basics", description: "Agility and passing the legs", notes: "" },
  { name: "Bulldog Choke Defense", category: "Junior - BJJ Basics", description: "Protecting the head and neck", notes: "Head safety" },
];

const BADGES = [
  { id: "7day", label: "7-Day Warrior", icon: "🗡️", desc: "7 consecutive class days" },
  { id: "escape", label: "Escape Artist", icon: "🔓", desc: "3 successful escapes logged" },
  { id: "animal", label: "Animal Kingdom", icon: "🐻", desc: "All animal crawls mastered" },
  { id: "consistent", label: "Mat Monster", icon: "👾", desc: "10 total sessions" },
];

export default function JuniorTracker() {
  const [sessions, setSessions] = useState([]);
  const [techniques, setTechniques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], techniques_practiced: [], attitude_score: 5, coach_feedback: "", notes: "" });

  const today = new Date();
  const daysLeft = Math.max(0, Math.ceil((COMP_DATE - today) / 86400000));

  const seedJuniorTechs = async (techs) => {
    const existing = techs.map(t => t.name);
    const toSeed = JUNIOR_TECHNIQUES.filter(t => !existing.includes(t.name));
    if (toSeed.length > 0) {
      await base44.entities.Technique.bulkCreate(toSeed.map(t => ({ ...t, is_junior: true, xp: 0, mastery_level: 0 })));
    }
  };

  const load = () => {
    Promise.all([
      base44.entities.JuniorSession.list("-date", 50),
      base44.entities.Technique.filter({ is_junior: true }),
    ]).then(([sl, tl]) => {
      setSessions(sl);
      setTechniques(tl);
      setLoading(false);
      seedJuniorTechs(tl);
    });
  };

  useEffect(() => { load(); }, []);

  const toggle = (tech) => setForm(f => ({
    ...f,
    techniques_practiced: f.techniques_practiced.includes(tech)
      ? f.techniques_practiced.filter(x => x !== tech)
      : [...f.techniques_practiced, tech],
  }));

  const save = async () => {
    await base44.entities.JuniorSession.create(form);
    // Award XP to junior techniques
    for (const techName of form.techniques_practiced) {
      const t = techniques.find(t => t.name === techName);
      if (t) {
        const newXp = (t.xp || 0) + 5;
        await base44.entities.Technique.update(t.id, { xp: newXp, mastery_level: Math.min(5, Math.floor(newXp / 20)), last_drilled: form.date });
      }
    }
    toast.success("Son's session logged! 🥋 Great job, champ!");
    setShowLog(false);
    setForm({ date: new Date().toISOString().split("T")[0], techniques_practiced: [], attitude_score: 5, coach_feedback: "", notes: "" });
    load();
  };

  const streak = sessions.length;
  const earnedBadges = BADGES.filter(b => {
    if (b.id === "7day") return streak >= 7;
    if (b.id === "consistent") return streak >= 10;
    if (b.id === "escape") return sessions.some(s => s.techniques_practiced?.some(t => t.includes("Escape") || t.includes("Roll")));
    if (b.id === "animal") return techniques.filter(t => t.name.includes("Crawl") || t.name.includes("Walk")).every(t => t.mastery_level >= 3);
    return false;
  });

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24 safe-area-top">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton to="/" />
          <div>
            <h1 className="text-white text-xl font-black tracking-tight">Junior Tracker</h1>
            <p className="text-commander-muted text-xs">Kids BJJ · 5:15 PM @ The Lab</p>
          </div>
        </div>
        <button onClick={() => setShowLog(s => !s)} className="bg-commander-red text-white rounded-lg p-2 hover:bg-red-700 transition-all">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Shared Countdown */}
      <div className="bg-gradient-to-r from-blue-950 to-purple-950 border border-purple-700 rounded-xl p-4">
        <p className="text-purple-300 text-xs uppercase tracking-widest mb-1">Shared Father & Son Countdown</p>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-white font-black text-4xl font-mono">{daysLeft}</span>
            <span className="text-purple-300 text-lg ml-2">days</span>
          </div>
          <div className="text-right">
            <p className="text-purple-300 text-xs">July 18, 2026</p>
            <p className="text-white text-xs font-bold mt-0.5">Competition Day 🥋</p>
          </div>
        </div>
        <p className="text-purple-400 text-xs mt-2">💡 Sunday morning: Watch session clips together. Log progress as a team.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { val: sessions.length, label: "Sessions" },
          { val: earnedBadges.length, label: "Badges" },
          { val: Math.max(0, streak), label: "Streak" },
        ].map(({ val, label }) => (
          <div key={label} className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center">
            <p className="text-white font-black text-xl">{val}</p>
            <p className="text-commander-muted text-xs">{label}</p>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
        <p className="text-xs text-commander-muted uppercase tracking-widest mb-3">Achievement Badges</p>
        <div className="grid grid-cols-2 gap-2">
          {BADGES.map(b => {
            const earned = earnedBadges.find(e => e.id === b.id);
            return (
              <div key={b.id} className={`rounded-xl p-3 border transition-all ${earned ? "border-yellow-600 bg-yellow-950/30" : "border-commander-border opacity-40"}`}>
                <p className="text-2xl">{b.icon}</p>
                <p className={`text-xs font-bold mt-1 ${earned ? "text-yellow-300" : "text-gray-500"}`}>{b.label}</p>
                <p className="text-xs text-gray-500">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Log Form */}
      {showLog && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-4">
          <h3 className="text-white font-bold">Log Son's Class</h3>
          <div>
            <label className="text-xs text-commander-muted block mb-1">Date</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="text-xs text-commander-muted block mb-2">Techniques Practiced</label>
            <div className="flex flex-wrap gap-2">
              {techniques.map(t => (
                <button key={t.id} onClick={() => toggle(t.name)}
                  className={`text-xs px-2 py-1 rounded-full border transition-all ${form.techniques_practiced.includes(t.name) ? "border-blue-500 bg-blue-950 text-blue-300" : "border-commander-border text-commander-muted"}`}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-commander-muted block mb-1">Attitude & Effort: <span className="text-yellow-400 font-bold">{form.attitude_score}/5</span></label>
            <input type="range" min={1} max={5} value={form.attitude_score} onChange={e => setForm(f => ({ ...f, attitude_score: Number(e.target.value) }))}
              className="w-full accent-yellow-500" />
          </div>
          <div>
            <label className="text-xs text-commander-muted block mb-1">Coach Feedback / Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2} placeholder="What did he work on? Any highlights?"
              className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm resize-none" />
          </div>
          <button onClick={save} className="w-full bg-blue-700 text-white rounded-xl py-3 font-bold hover:bg-blue-600 transition-all">
            Save Junior Session 🥋
          </button>
        </div>
      )}

      {/* Junior Skill Matrix */}
      {techniques.length > 0 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
          <p className="text-xs text-commander-muted uppercase tracking-widest mb-3">Junior Skill Progress</p>
          <div className="space-y-3">
            {techniques.map(t => (
              <div key={t.id}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-white text-sm">{t.name}</p>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={`w-3 h-3 ${i <= (t.mastery_level || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-700"}`} />
                    ))}
                  </div>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5">
                  <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${((t.xp || 0) / 100) * 100}%` }} />
                </div>
                {t.description && <p className="text-xs text-commander-muted mt-0.5">{t.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
          <p className="text-xs text-commander-muted uppercase tracking-widest mb-3">Recent Classes</p>
          <div className="space-y-2">
            {sessions.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">{s.date}</p>
                  {s.techniques_practiced?.length > 0 && (
                    <p className="text-commander-muted text-xs">{s.techniques_practiced.slice(0, 2).join(", ")}</p>
                  )}
                </div>
                {s.attitude_score && (
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={`w-3 h-3 ${i <= s.attitude_score ? "text-yellow-400 fill-yellow-400" : "text-gray-700"}`} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}