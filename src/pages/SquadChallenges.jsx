import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { toast } from "sonner";
import BackButton from "../components/BackButton";
import { Trophy, Plus, Calendar, Users } from "lucide-react";

const METRIC_LABELS = {
  total_sessions: "Total Sessions",
  total_minutes: "Total Training Minutes",
  consecutive_days: "Consecutive Days",
  total_volume_lifted: "Total Volume Lifted (lbs)",
  average_intensity: "Average Intensity (1-10)",
};

export default function SquadChallenges() {
  const [squads, setSquads] = useState([]);
  const [selectedSquad, setSelectedSquad] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    challenge_name: "",
    description: "",
    metric_type: "total_sessions",
    target_value: 10,
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    prize_description: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSquads();
  }, []);

  const loadSquads = async () => {
    const mySquads = await base44.entities.SquadMembership.filter({
      created_by: (await base44.auth.me()).email,
    });
    setSquads(mySquads);
    if (mySquads.length > 0) {
      setSelectedSquad(mySquads[0].squad_id);
    }
    setLoading(false);
  };

  const loadChallenges = async (squadId) => {
    const data = await base44.entities.SquadChallenge.filter({
      squad_id: squadId,
    });
    setChallenges(data);

    const membs = await base44.entities.SquadMembership.filter({
      squad_id: squadId,
    });
    setMembers(membs);
  };

  const createChallenge = async () => {
    if (!form.challenge_name.trim()) {
      toast.error("Challenge name required");
      return;
    }
    setSaving(true);
    try {
      await base44.entities.SquadChallenge.create({
        squad_id: selectedSquad,
        ...form,
      });
      toast.success("Challenge created!");
      setForm({
        challenge_name: "",
        description: "",
        metric_type: "total_sessions",
        target_value: 10,
        start_date: new Date().toISOString().split("T")[0],
        end_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
        prize_description: "",
      });
      setShowForm(false);
      loadChallenges(selectedSquad);
    } catch (err) {
      toast.error("Failed to create challenge");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (selectedSquad) {
      loadChallenges(selectedSquad);
    }
  }, [selectedSquad]);

  const squad = squads.find(s => s.squad_id === selectedSquad);
  const isCaptain = squad?.role === "captain";

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24 safe-area-top overflow-auto h-screen">
      <div className="flex items-center gap-2 mb-2">
        <BackButton to="/squads" />
        <h1 className="text-white text-xl font-black tracking-tight">Squad Challenges</h1>
      </div>

      {/* Squad Selector */}
      {squads.length > 0 && (
        <div>
          <label className="text-xs text-commander-muted block mb-2">Select Squad</label>
          <select
            value={selectedSquad || ""}
            onChange={(e) => setSelectedSquad(e.target.value)}
            className="w-full bg-commander-surface border border-commander-border rounded-lg px-3 py-2 text-white text-sm min-h-[44px]"
          >
            {squads.map((s) => (
              <option key={s.squad_id} value={s.squad_id}>
                {s.display_name || `Squad ${s.squad_id.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Create Challenge Button */}
      {isCaptain && (
        <button
          onClick={() => setShowForm((f) => !f)}
          className="w-full bg-commander-red text-white rounded-lg py-3 font-bold text-sm hover:bg-red-700 transition-all min-h-[44px] flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Create Challenge
        </button>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
          <p className="text-white font-bold text-sm">New Squad Challenge</p>

          <input
            value={form.challenge_name}
            onChange={(e) => setForm((f) => ({ ...f, challenge_name: e.target.value }))}
            placeholder="Challenge name"
            className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm min-h-[44px]"
          />

          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Description"
            rows={2}
            className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm resize-none"
          />

          <div>
            <label className="text-xs text-commander-muted block mb-1">Metric</label>
            <select
              value={form.metric_type}
              onChange={(e) => setForm((f) => ({ ...f, metric_type: e.target.value }))}
              className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm min-h-[44px]"
            >
              {Object.entries(METRIC_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-commander-muted block mb-1">Target</label>
              <input
                type="number"
                value={form.target_value}
                onChange={(e) => setForm((f) => ({ ...f, target_value: parseFloat(e.target.value) }))}
                className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-xs text-commander-muted block mb-1">End Date</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm min-h-[44px]"
              />
            </div>
          </div>

          <input
            value={form.prize_description}
            onChange={(e) => setForm((f) => ({ ...f, prize_description: e.target.value }))}
            placeholder="Prize (optional)"
            className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm min-h-[44px]"
          />

          <button
            onClick={createChallenge}
            disabled={saving}
            className="w-full bg-commander-red text-white rounded-lg py-3 font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-60 min-h-[44px]"
          >
            {saving ? "Creating..." : "Create Challenge"}
          </button>
        </div>
      )}

      {/* Active Challenges */}
      {challenges.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-commander-muted uppercase tracking-widest">Active Challenges</p>
          {challenges
            .filter((c) => c.is_active)
            .map((challenge) => (
              <div key={challenge.id} className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-bold text-sm">{challenge.challenge_name}</p>
                    {challenge.description && (
                      <p className="text-commander-muted text-xs mt-1">{challenge.description}</p>
                    )}
                  </div>
                  <Trophy className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-800 rounded-lg p-2">
                    <p className="text-commander-muted">Metric</p>
                    <p className="text-white font-bold">{METRIC_LABELS[challenge.metric_type]}</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-2">
                    <p className="text-commander-muted">Target</p>
                    <p className="text-white font-bold">{challenge.target_value}</p>
                  </div>
                </div>

                {challenge.prize_description && (
                  <div className="bg-yellow-950/30 border border-yellow-800 rounded-lg p-2">
                    <p className="text-yellow-300 text-xs font-bold">🏆 {challenge.prize_description}</p>
                  </div>
                )}

                <div className="flex items-center gap-1 text-xs text-commander-muted">
                  <Calendar className="w-4 h-4" />
                  Ends {new Date(challenge.end_date).toLocaleDateString()}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Squad Members Leaderboard */}
      {members.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-commander-muted" />
            <p className="text-xs text-commander-muted uppercase tracking-widest">Squad Leaderboard</p>
          </div>
          {members
            .sort((a, b) => (b.total_sessions || 0) - (a.total_sessions || 0))
            .map((member, idx) => (
              <div key={member.id} className="bg-commander-surface border border-commander-border rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">#{idx + 1}</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">{member.display_name}</p>
                    <p className="text-commander-muted text-xs">{member.total_sessions || 0} sessions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-black text-lg">{member.total_minutes || 0}</p>
                  <p className="text-commander-muted text-xs">minutes</p>
                </div>
              </div>
            ))}
        </div>
      )}

      {!loading && challenges.length === 0 && (
        <div className="text-center py-8">
          <Trophy className="w-8 h-8 text-commander-muted mx-auto mb-2" />
          <p className="text-commander-muted text-sm">{isCaptain ? "Create a challenge to get started" : "No active challenges yet"}</p>
        </div>
      )}
    </div>
  );
}