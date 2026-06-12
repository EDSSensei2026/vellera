import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { toast } from "sonner";
import { Save, Trash2, Zap, Mic, CheckCircle, Loader2 } from "lucide-react";
import BackButton from "../components/BackButton";

const VOICE_OPTIONS = [
  { id: "deep_male",         label: "Deep Male",           desc: "Commanding, authoritative",     emoji: "🗣️" },
  { id: "gritty_male",       label: "Gritty Male",         desc: "Rough, street-level intensity", emoji: "🥊" },
  { id: "energetic_female",  label: "Energetic Female",    desc: "High-energy, explosive hype",   emoji: "⚡" },
  { id: "hype_female",       label: "Hype Female",         desc: "Loud, relentless motivation",   emoji: "🔥" },
  { id: "calm_androgynous",  label: "Calm & Focused",      desc: "Measured, precise, zen",        emoji: "🧘" },
];

const PERSONA_PRESETS = [
  {
    label: "The Drill Sergeant",
    prompt: "You are a relentless military drill sergeant. You use short, aggressive commands. No excuses, no softness. Every phrase is a direct order designed to push past mental barriers.",
  },
  {
    label: "The Corner Man",
    prompt: "You are a gritty, experienced boxing corner man. You speak in short, punchy sentences. You've seen thousands of fights and you know exactly what an athlete needs to hear between rounds.",
  },
  {
    label: "The Zen Sensei",
    prompt: "You are a calm, wise martial arts sensei. Your words are measured and meaningful. You focus on breathing, presence, and controlled aggression. Every phrase carries weight.",
  },
  {
    label: "The Hype Coach",
    prompt: "You are an explosive, high-energy hype coach. Maximum enthusiasm. You believe in this athlete unconditionally. Your energy is contagious and relentless.",
  },
];

export default function AgentForge() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [form, setForm] = useState({
    name: "",
    system_prompt: "",
    voice_id: "deep_male",
    is_active: true,
    trigger_on_start: true,
    trigger_on_halfway: true,
    trigger_on_rest: true,
  });
  const [editingId, setEditingId] = useState(null);

  const load = () => {
    base44.entities.UserAgent.filter({}).then(a => {
      setAgents(a);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.name.trim() || !form.system_prompt.trim()) {
      toast.error("Name and persona are required.");
      return;
    }
    setSaving(true);
    try {
      // Deactivate all others if setting active
      if (form.is_active) {
        for (const a of agents) {
          if (a.id !== editingId && a.is_active) {
            await base44.entities.UserAgent.update(a.id, { is_active: false });
          }
        }
      }
      if (editingId) {
        await base44.entities.UserAgent.update(editingId, form);
        toast.success("Agent updated.");
      } else {
        await base44.entities.UserAgent.create(form);
        toast.success(`${form.name} forged and ready.`);
      }
      setForm({ name: "", system_prompt: "", voice_id: "deep_male", is_active: true, trigger_on_start: true, trigger_on_halfway: true, trigger_on_rest: true });
      setEditingId(null);
      setTestResult(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await base44.entities.UserAgent.delete(id);
    toast.success("Agent removed.");
    load();
  };

  const handleEdit = (agent) => {
    setForm({
      name: agent.name,
      system_prompt: agent.system_prompt,
      voice_id: agent.voice_id || "deep_male",
      is_active: agent.is_active ?? true,
      trigger_on_start: agent.trigger_on_start ?? true,
      trigger_on_halfway: agent.trigger_on_halfway ?? true,
      trigger_on_rest: agent.trigger_on_rest ?? true,
    });
    setEditingId(agent.id);
    setTestResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSetActive = async (agent) => {
    for (const a of agents) {
      await base44.entities.UserAgent.update(a.id, { is_active: a.id === agent.id });
    }
    toast.success(`${agent.name} is now your active coach.`);
    load();
  };

  const handleTest = async () => {
    if (!form.system_prompt.trim()) { toast.error("Add a persona first."); return; }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await base44.functions.invoke("generateAgentResponse", {
        agent: { name: form.name || "Coach", system_prompt: form.system_prompt, voice_id: form.voice_id },
        context: { trigger: "start", exercise_name: "Heavy Bag Round", time_elapsed_seconds: 0, time_remaining_seconds: 180, current_round: 1, total_rounds: 3, streak_days: 5, recovery_pct: 74 },
      });
      setTestResult(res.data?.text || "No response.");
    } catch (e) {
      toast.error("Test failed: " + e.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto pb-24 safe-area-top overflow-auto h-screen">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BackButton to="/" />
        <div>
          <h1 className="text-white text-xl font-black tracking-tight">The Forge</h1>
          <p className="text-gray-500 text-xs">Build your custom AI coach</p>
        </div>
      </div>

      {/* ── Form ── */}
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 space-y-4">
        <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#00E5FF" }}>
          {editingId ? "Edit Agent" : "New Agent"}
        </p>

        {/* Name */}
        <div>
          <label className="text-xs text-gray-400 block mb-1.5 font-semibold">Agent Name</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder='e.g. "Sergeant Ramos"'
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00E5FF] min-h-[44px] placeholder-gray-600"
          />
        </div>

        {/* Preset pickers */}
        <div>
          <label className="text-xs text-gray-400 block mb-2 font-semibold">Persona Presets</label>
          <div className="grid grid-cols-2 gap-2">
            {PERSONA_PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => setForm(f => ({ ...f, system_prompt: p.prompt }))}
                className="text-left p-2.5 rounded-lg border border-gray-700 hover:border-gray-500 bg-gray-900 transition-all min-h-[44px]"
              >
                <p className="text-white text-xs font-semibold">{p.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* System Prompt */}
        <div>
          <label className="text-xs text-gray-400 block mb-1.5 font-semibold">Agent Persona / System Prompt</label>
          <textarea
            value={form.system_prompt}
            onChange={e => setForm(f => ({ ...f, system_prompt: e.target.value }))}
            placeholder="Describe your coach's personality, tone, and style..."
            rows={4}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00E5FF] resize-none placeholder-gray-600"
          />
        </div>

        {/* Voice Selection */}
        <div>
          <label className="text-xs text-gray-400 block mb-2 font-semibold">Voice</label>
          <div className="space-y-2">
            {VOICE_OPTIONS.map(v => (
              <button
                key={v.id}
                onClick={() => setForm(f => ({ ...f, voice_id: v.id }))}
                className="w-full flex items-center gap-3 p-3 rounded-lg border transition-all min-h-[44px]"
                style={form.voice_id === v.id
                  ? { borderColor: "#00E5FF", backgroundColor: "#00E5FF15" }
                  : { borderColor: "#2a2a2a", backgroundColor: "#111" }
                }
              >
                <span className="text-lg">{v.emoji}</span>
                <div className="text-left flex-1">
                  <p className="text-white text-sm font-semibold">{v.label}</p>
                  <p className="text-gray-500 text-xs">{v.desc}</p>
                </div>
                {form.voice_id === v.id && <Mic className="w-4 h-4" style={{ color: "#00E5FF" }} />}
              </button>
            ))}
          </div>
        </div>

        {/* Trigger Toggles */}
        <div>
          <label className="text-xs text-gray-400 block mb-2 font-semibold">Trigger Points</label>
          <div className="space-y-2">
            {[
              { key: "trigger_on_start",   label: "On Workout Start",  emoji: "🚀" },
              { key: "trigger_on_halfway", label: "At Halfway Point",  emoji: "💥" },
              { key: "trigger_on_rest",    label: "During Rest Phase", emoji: "💤" },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setForm(f => ({ ...f, [t.key]: !f[t.key] }))}
                className="w-full flex items-center justify-between p-3 rounded-lg border transition-all min-h-[44px]"
                style={{ borderColor: form[t.key] ? "#00E5FF40" : "#2a2a2a", backgroundColor: form[t.key] ? "#00E5FF08" : "#111" }}
              >
                <div className="flex items-center gap-2">
                  <span>{t.emoji}</span>
                  <span className="text-white text-sm">{t.label}</span>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${form[t.key] ? "border-[#00E5FF] bg-[#00E5FF]" : "border-gray-600"}`}>
                  {form[t.key] && <span className="text-black text-xs font-black">✓</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Test button */}
        <button
          onClick={handleTest}
          disabled={testing || !form.system_prompt.trim()}
          className="w-full py-2.5 rounded-lg border border-gray-600 text-gray-300 font-semibold text-sm flex items-center justify-center gap-2 hover:border-gray-400 transition-all disabled:opacity-40"
        >
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {testing ? "Generating..." : "Test Agent Voice"}
        </button>

        {testResult && (
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Agent says:</p>
            <p className="text-white text-sm italic leading-relaxed">"{testResult}"</p>
          </div>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 rounded-xl font-black text-base text-black flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          style={{ backgroundColor: "#00E5FF" }}
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? "Forging..." : editingId ? "Update Agent" : "Forge Agent"}
        </button>

        {editingId && (
          <button onClick={() => { setEditingId(null); setForm({ name: "", system_prompt: "", voice_id: "deep_male", is_active: true, trigger_on_start: true, trigger_on_halfway: true, trigger_on_rest: true }); setTestResult(null); }}
            className="w-full py-2.5 text-gray-500 text-sm hover:text-white transition-colors">
            Cancel edit
          </button>
        )}
      </div>

      {/* ── Existing Agents ── */}
      {!loading && agents.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-widest">Your Agents</p>
          {agents.map(agent => (
            <div key={agent.id} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-bold text-sm">{agent.name}</p>
                    {agent.is_active && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: "#00E5FF20", color: "#00E5FF" }}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs mt-1 truncate">{agent.system_prompt?.slice(0, 80)}...</p>
                  <p className="text-gray-600 text-xs mt-1">{VOICE_OPTIONS.find(v => v.id === agent.voice_id)?.label || agent.voice_id}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {!agent.is_active && (
                    <button onClick={() => handleSetActive(agent)} className="p-2 rounded-lg border border-gray-700 hover:border-green-600 transition-all min-h-[36px]" title="Set active">
                      <CheckCircle className="w-4 h-4 text-gray-500 hover:text-green-400" />
                    </button>
                  )}
                  <button onClick={() => handleEdit(agent)} className="p-2 rounded-lg border border-gray-700 hover:border-[#00E5FF] transition-all min-h-[36px]" title="Edit">
                    <Zap className="w-4 h-4 text-gray-500" />
                  </button>
                  <button onClick={() => handleDelete(agent.id)} className="p-2 rounded-lg border border-gray-700 hover:border-red-600 transition-all min-h-[36px]" title="Delete">
                    <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}