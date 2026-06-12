import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, CalendarCheck, Loader2, ExternalLink, Check, AlertCircle, Shield, Zap, Battery, Flame, Save, Download } from "lucide-react";
import { toast } from "sonner";

const DRILL_PRESETS = [
  // ── Martial Arts ──────────────────────────────────────────────────
  { label: "BJJ — Guard Passing", duration: 60, description: "Guard passing drills: knee slice, torreando, leg weave.", category: "bjj" },
  { label: "BJJ — Submissions", duration: 75, description: "Submission chains from dominant positions.", category: "bjj" },
  { label: "Striking — Heavy Bag", duration: 45, description: "Combo work on the heavy bag: jab-cross-hook, body shots, footwork.", category: "bjj" },
  { label: "Takedown Drilling", duration: 60, description: "Shoot / sprawl takedown entries and finishes.", category: "bjj" },
  { label: "Positional Sparring", duration: 90, description: "Positional rounds focused on guard retention and escapes.", category: "bjj" },
  { label: "Strength & Conditioning", duration: 60, description: "Combat S&C: explosive movements, carries, and conditioning circuits.", category: "fitness" },
  // ── Executive Protection / Tactical ───────────────────────────────
  { label: "EP — Pistol Draw & Presentation", duration: 30, description: "Holster draw drills: compressed ready, high guard, one-hand draw. 50 reps from concealment. Focus on sight alignment and trigger reset.", category: "ep" },
  { label: "EP — Pack & Gear Carry Conditioning", duration: 45, description: "Rucking intervals with loaded pack (45–65 lbs): 400m fast walk + 100m jog x 6. Builds load-bearing endurance for EP movements.", category: "ep" },
  { label: "EP — Threat Identification & 360° Scan", duration: 30, description: "Situational awareness circuit: scan drill (target identification in <2 sec), interview stance practice, verbal challenge scenarios. 10 reps each scenario.", category: "ep" },
  { label: "EP — VIP Extraction Footwork", duration: 45, description: "Protective formation movement: L-shape extraction, vehicle stack, building entry/exit under stress. Practice with partner or solo shadow drill.", category: "ep" },
  { label: "EP — Combatives: Control & Restraint", duration: 60, description: "EP ground control: standing wrist lock, arm bar escort, rear choke escape, weapon retention. 5x 3-min rounds with partner.", category: "ep" },
  { label: "EP — Vehicle Ambush Drill", duration: 30, description: "Immediate action on vehicle contact: dismount, react to contact, cover positions, secure principal. Dry run x 10, timed.", category: "ep" },
  { label: "EP — Low-Light / Night Movement", duration: 30, description: "Flashlight techniques (FBI hold, Rogers hold), movement through structures, clearing corners at night. Builds confidence for low-vis details.", category: "ep" },
  { label: "EP — Stress Inoculation Circuit", duration: 45, description: "5 rounds: 10 burpees → draw & fire (dry), 100m sprint → threat scan, 20 push-ups → radio communication drill. Simulate elevated HR decision-making.", category: "ep" },
  { label: "EP — Close Protection Movement", duration: 30, description: "Overwatch positions, principal escort formations (box, diamond, wedge), door-to-vehicle transitions. Shadow drill, 15 min technique + 15 min timed run.", category: "ep" },
  { label: "EP — Defensive Driving Scenarios", duration: 30, description: "Mental reps + physical conditioning: J-turn footwork, evasive reaction drills, route planning simulation. Pair with core stability work.", category: "ep" },
  // ── Custom ────────────────────────────────────────────────────────
  { label: "Custom", duration: 60, description: "", category: "custom" },
];

// Intensity level → recommended drill labels (in priority order)
const INTENSITY_DRILL_MAP = {
  low: {
    label: "Low",
    color: "text-green-400",
    border: "border-green-700/50",
    bg: "bg-green-900/20",
    activeBg: "bg-green-800/40",
    icon: Battery,
    description: "Recovery pace — technique over sweat",
    drills: [
      "EP — Pistol Draw & Presentation",
      "EP — Threat Identification & 360° Scan",
      "EP — Close Protection Movement",
      "EP — Low-Light / Night Movement",
      "EP — Defensive Driving Scenarios",
    ],
  },
  moderate: {
    label: "Moderate",
    color: "text-amber-400",
    border: "border-amber-700/50",
    bg: "bg-amber-900/20",
    activeBg: "bg-amber-800/40",
    icon: Zap,
    description: "Steady work — skill + conditioning blend",
    drills: [
      "EP — Pack & Gear Carry Conditioning",
      "EP — VIP Extraction Footwork",
      "EP — Combatives: Control & Restraint",
      "EP — Pistol Draw & Presentation",
      "EP — Threat Identification & 360° Scan",
    ],
  },
  high: {
    label: "High",
    color: "text-red-400",
    border: "border-red-700/50",
    bg: "bg-red-900/20",
    activeBg: "bg-red-800/40",
    icon: Flame,
    description: "Full output — stress inoculation & load",
    drills: [
      "EP — Stress Inoculation Circuit",
      "EP — Pack & Gear Carry Conditioning",
      "EP — Vehicle Ambush Drill",
      "EP — Combatives: Control & Restraint",
      "EP — VIP Extraction Footwork",
    ],
  },
};

function getDefaultDatetime(daysFromNow, hour = 18) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}

function addMinutes(datetimeLocal, mins) {
  const d = new Date(datetimeLocal);
  d.setMinutes(d.getMinutes() + mins);
  return d.toISOString().slice(0, 16);
}

export default function ScheduleDrills() {
  const navigate = useNavigate();
  const location = useLocation();
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [sessions, setSessions] = useState([
    {
      id: 1,
      preset: DRILL_PRESETS[0].label,
      title: DRILL_PRESETS[0].label,
      description: DRILL_PRESETS[0].description,
      startDateTime: getDefaultDatetime(1),
      duration: DRILL_PRESETS[0].duration,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [intensityMode, setIntensityMode] = useState(null); // "low" | "moderate" | "high" | null

  // Load templates on mount & check for template from navigation state
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const tmpl = await base44.entities.DrillTemplate.list("-is_favorite", 20);
        setTemplates(tmpl);

        // If navigated with a template, load it
        if (location.state?.template) {
          handleLoadTemplate(location.state.template);
        }
      } catch {
        // Silently fail if templates can't load
      } finally {
        setLoadingTemplates(false);
      }
    };
    loadTemplates();
  }, [location.state]);

  const addSession = () => {
    const id = Date.now();
    setSessions(prev => [
      ...prev,
      {
        id,
        preset: DRILL_PRESETS[0].label,
        title: DRILL_PRESETS[0].label,
        description: DRILL_PRESETS[0].description,
        startDateTime: getDefaultDatetime(prev.length + 1),
        duration: DRILL_PRESETS[0].duration,
      },
    ]);
  };

  const removeSession = (id) => setSessions(prev => prev.filter(s => s.id !== id));

  const updateSession = (id, field, value) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s, [field]: value };
      if (field === "preset") {
        const found = DRILL_PRESETS.find(p => p.label === value);
        if (found) {
          updated.title = found.label === "Custom" ? "" : found.label;
          updated.description = found.description;
          updated.duration = found.duration;
        }
      }
      return updated;
    }));
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Enter a template name");
      return;
    }
    try {
      const drills = sessions.map(s => ({
        title: s.title || s.preset,
        description: s.description,
        duration: s.duration,
      }));
      await base44.entities.DrillTemplate.create({
        template_name: templateName,
        drills,
        is_favorite: false,
      });
      toast.success(`Template "${templateName}" saved!`);
      setTemplateName("");
      setShowSaveModal(false);
      // Reload templates
      const tmpl = await base44.entities.DrillTemplate.list("-is_favorite", 20);
      setTemplates(tmpl);
    } catch (err) {
      toast.error("Failed to save template: " + err.message);
    }
  };

  const handleLoadTemplate = (template) => {
    // Map template drills to session format
    const newSessions = template.drills.map((d, i) => ({
      id: Date.now() + i,
      preset: DRILL_PRESETS.find(p => p.label === d.title)?.label || "Custom",
      title: d.title,
      description: d.description,
      startDateTime: getDefaultDatetime(i + 1),
      duration: d.duration,
    }));
    setSessions(newSessions);
    toast.success(`Loaded template: ${template.template_name}`);
  };

  const handleSchedule = async () => {
    const payload = sessions.map(s => ({
      title: s.title || s.preset,
      description: s.description,
      startDateTime: new Date(s.startDateTime).toISOString(),
      endDateTime: new Date(addMinutes(s.startDateTime, s.duration)).toISOString(),
    }));

    setLoading(true);
    setResults(null);
    try {
      const res = await base44.functions.invoke("scheduleDrillSessions", { sessions: payload });
      setResults(res.data.results);
      const ok = res.data.results.filter(r => r.success).length;
      toast.success(`${ok} session${ok !== 1 ? "s" : ""} added to Google Calendar!`);
    } catch (err) {
      toast.error("Failed to schedule: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-commander-dark p-4 pb-24">
      <div className="max-w-lg mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3 pt-2">
          <button onClick={() => navigate(-1)} className="text-commander-muted hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white text-xl font-black">Schedule Drill Sessions</h1>
            <p className="text-commander-muted text-xs">Martial arts, EP & tactical drills → Google Calendar</p>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => navigate("/drill-templates")}
              className="flex items-center gap-1 text-xs bg-vellera-green/20 border border-vellera-green/50 text-vellera-green font-bold px-3 py-1.5 rounded-lg hover:bg-vellera-green/30 transition-all"
            >
              📋 Templates
            </button>
            <button
              onClick={() => navigate("/ep-tactical")}
              className="flex items-center gap-1 text-xs bg-amber-900/40 border border-amber-700/50 text-amber-400 font-bold px-3 py-1.5 rounded-lg hover:bg-amber-800/50 transition-all"
            >
              <Shield className="w-3.5 h-3.5" /> Mastery
            </button>
          </div>
        </div>

        {/* Sessions */}
        {sessions.map((s, idx) => (
          <div key={s.id} className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-white font-bold text-sm">Session {idx + 1}</p>
                {DRILL_PRESETS.find(p => p.label === s.preset)?.category === "ep" && (
                  <span className="flex items-center gap-1 text-xs bg-amber-900/40 border border-amber-700/50 text-amber-400 font-bold px-2 py-0.5 rounded-full">
                    <Shield className="w-3 h-3" /> EP
                  </span>
                )}
              </div>
              {sessions.length > 1 && (
                <button onClick={() => removeSession(s.id)} className="text-commander-muted hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Preset picker */}
            <div>
              <label className="text-commander-muted text-xs block mb-1">Drill Type</label>
              <select
                value={s.preset}
                onChange={e => updateSession(s.id, "preset", e.target.value)}
                className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm"
              >
                <optgroup label="── Martial Arts">
                  {DRILL_PRESETS.filter(p => p.category === "bjj").map(p => (
                    <option key={p.label} value={p.label}>{p.label} ({p.duration} min)</option>
                  ))}
                </optgroup>
                <optgroup label="── Fitness">
                  {DRILL_PRESETS.filter(p => p.category === "fitness").map(p => (
                    <option key={p.label} value={p.label}>{p.label} ({p.duration} min)</option>
                  ))}
                </optgroup>
                <optgroup label="🛡️ Executive Protection / Tactical">
                  {DRILL_PRESETS.filter(p => p.category === "ep").map(p => (
                    <option key={p.label} value={p.label}>{p.label} ({p.duration} min)</option>
                  ))}
                </optgroup>
                <optgroup label="── Other">
                  {DRILL_PRESETS.filter(p => p.category === "custom").map(p => (
                    <option key={p.label} value={p.label}>{p.label}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Custom title (shown when preset is Custom) */}
            {s.preset === "Custom" && (
              <div>
                <label className="text-commander-muted text-xs block mb-1">Custom Title</label>
                <input
                  type="text"
                  value={s.title}
                  onChange={e => updateSession(s.id, "title", e.target.value)}
                  placeholder="e.g. Wrestling Takedowns"
                  className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
            )}

            {/* Description */}
            <div>
              <label className="text-commander-muted text-xs block mb-1">Notes / Description</label>
              <textarea
                value={s.description}
                onChange={e => updateSession(s.id, "description", e.target.value)}
                rows={2}
                className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm resize-none"
              />
            </div>

            {/* Date/time + duration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-commander-muted text-xs block mb-1">Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={s.startDateTime}
                  onChange={e => updateSession(s.id, "startDateTime", e.target.value)}
                  className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-commander-muted text-xs block mb-1">Duration (min)</label>
                <input
                  type="number"
                  value={s.duration}
                  min={15}
                  max={240}
                  step={15}
                  onChange={e => updateSession(s.id, "duration", parseInt(e.target.value))}
                  className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
            </div>
          </div>
        ))}

        {/* Load Template */}
        {templates.length > 0 && (
          <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
            <p className="text-xs text-commander-muted uppercase tracking-widest">Load Template</p>
            <div className="space-y-2">
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleLoadTemplate(t)}
                  className="w-full text-left p-3 bg-gray-800 border border-gray-700 rounded-lg hover:border-vellera-blue transition-all flex items-center justify-between"
                >
                  <div>
                    <p className="text-white text-sm font-bold">{t.template_name}</p>
                    <p className="text-commander-muted text-xs">{t.drills.length} drill{t.drills.length !== 1 ? "s" : ""}</p>
                  </div>
                  <Download className="w-4 h-4 text-vellera-blue" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add session */}
        <button
          onClick={addSession}
          className="w-full border border-dashed border-commander-border rounded-xl py-3 text-commander-muted hover:text-white hover:border-vellera-blue transition-all flex items-center justify-center gap-2 text-sm font-bold"
        >
          <Plus className="w-4 h-4" /> Add Another Session
        </button>

        {/* Save Template Modal */}
        {showSaveModal && (
          <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
            <p className="text-white font-bold text-sm">Save Current Sessions as Template</p>
            <input
              type="text"
              placeholder="e.g. Lab Morning Routine"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-vellera-blue min-h-[44px]"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowSaveModal(false); setTemplateName(""); }}
                className="flex-1 py-2 px-3 bg-gray-800 border border-commander-border text-white rounded-lg text-sm font-bold hover:bg-gray-700 transition-all min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                className="flex-1 py-2 px-3 bg-vellera-green text-black rounded-lg text-sm font-bold hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Save className="w-4 h-4" /> Save Template
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowSaveModal(true)}
            className="flex-1 py-3 bg-amber-900/40 border border-amber-700/50 text-amber-400 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-amber-800/40 transition-all text-sm min-h-[44px]"
            title="Save current sessions as a reusable template"
          >
            <Save className="w-4 h-4" /> Save as Template
          </button>
          <button
            onClick={handleSchedule}
            disabled={loading}
            className="flex-1 py-3 bg-gradient-to-r from-vellera-blue to-vellera-green text-black font-black rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all text-sm min-h-[44px]"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Scheduling...</>
            ) : (
              <><CalendarCheck className="w-4 h-4" /> Schedule</>
            )}
          </button>
        </div>

        {/* Results */}
        {results && (
          <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-2">
            <p className="text-white font-black text-sm mb-3">Results</p>
            {results.map((r, i) => (
              <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${r.success ? "bg-green-900/30 border border-green-700" : "bg-red-900/30 border border-red-700"}`}>
                <div className="flex items-center gap-2">
                  {r.success
                    ? <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    : <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                  <span className={r.success ? "text-green-200" : "text-red-200"}>{r.title}</span>
                </div>
                {r.success && r.htmlLink && (
                  <a href={r.htmlLink} target="_blank" rel="noopener noreferrer" className="text-vellera-blue hover:text-vellera-green flex items-center gap-1">
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {!r.success && <span className="text-red-400">{r.error}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}