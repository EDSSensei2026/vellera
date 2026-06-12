import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { ArrowLeft, Plus, Search, Trash2, ChevronDown, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import EPMasteryTracker from "../components/EPMasteryTracker";

export default function BJJTacticalJournal() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showEPTracker, setShowEPTracker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const [formData, setFormData] = useState({
    session_date: new Date().toISOString().split("T")[0],
    session_type: "Class",
    techniques_practiced: [{ name: "", position: "Guard", reps: 0, notes: "" }],
    training_partners: [""],
    coach_feedback: "",
    lightbulb_moments: [""],
    focus_area: "Positional Control",
    difficulty_level: "Intermediate",
    overall_feeling: 7,
    next_session_goals: "",
    injury_notes: "",
  });

  // Load entries
  useEffect(() => {
    const loadEntries = async () => {
      try {
        const data = await base44.entities.BJJTacticalJournal.list("-session_date", 50);
        setEntries(data);
        setFilteredEntries(data);
      } catch (err) {
        console.error("Failed to load journal entries:", err);
      } finally {
        setLoading(false);
      }
    };

    loadEntries();
  }, []);

  // Search & filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEntries(entries);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = entries.filter((entry) => {
      const technicianMatch = entry.techniques_practiced?.some((t) =>
        t.name?.toLowerCase().includes(query)
      );
      const coachMatch = entry.coach_feedback?.toLowerCase().includes(query);
      const insightMatch = entry.lightbulb_moments?.some((m) =>
        m?.toLowerCase().includes(query)
      );
      return technicianMatch || coachMatch || insightMatch;
    });

    setFilteredEntries(filtered);
  }, [searchQuery, entries]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanedData = {
      ...formData,
      techniques_practiced: formData.techniques_practiced.filter(
        (t) => t.name?.trim()
      ),
      training_partners: formData.training_partners.filter(
        (p) => p?.trim()
      ),
      lightbulb_moments: formData.lightbulb_moments.filter(
        (m) => m?.trim()
      ),
    };

    try {
      await base44.entities.BJJTacticalJournal.create(cleanedData);

      // Reload entries
      const data = await base44.entities.BJJTacticalJournal.list(
        "-session_date",
        50
      );
      setEntries(data);

      // Reset form
      setFormData({
        session_date: new Date().toISOString().split("T")[0],
        session_type: "Class",
        techniques_practiced: [{ name: "", position: "Guard", reps: 0, notes: "" }],
        training_partners: [""],
        coach_feedback: "",
        lightbulb_moments: [""],
        focus_area: "Positional Control",
        difficulty_level: "Intermediate",
        overall_feeling: 7,
        next_session_goals: "",
        injury_notes: "",
      });

      setShowForm(false);
    } catch (err) {
      console.error("Failed to create entry:", err);
    }
  };

  // Delete entry
  const handleDelete = async (id) => {
    if (!confirm("Delete this journal entry?")) return;

    try {
      await base44.entities.BJJTacticalJournal.delete(id);
      setEntries(entries.filter((e) => e.id !== id));
    } catch (err) {
      console.error("Failed to delete entry:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-commander-dark flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24 safe-area-top">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="text-commander-muted hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-white text-2xl font-black">BJJ Tactical Journal</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEPTracker(!showEPTracker)}
            title="EP Mastery Tracker"
            className={`p-2 rounded-lg border transition-all ${showEPTracker ? "bg-amber-500 border-amber-400 text-black" : "border-amber-700/50 bg-amber-900/30 text-amber-400 hover:bg-amber-800/40"}`}
          >
            <Shield className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-vellera-blue text-commander-dark p-2 rounded-lg hover:bg-vellera-green transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-commander-muted" />
        <input
          type="text"
          placeholder="Search by technique, coach feedback, or insights..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-commander-surface border border-commander-border rounded-lg pl-10 pr-3 py-2 text-white placeholder-commander-muted text-sm focus:outline-none focus:border-vellera-blue"
        />
      </div>

      {/* EP Mastery Tracker */}
      {showEPTracker && (
        <EPMasteryTracker entries={entries} />
      )}

      {/* New Entry Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-4"
        >
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-commander-muted font-bold">
                Session Date
              </label>
              <input
                type="date"
                value={formData.session_date}
                onChange={(e) =>
                  setFormData({ ...formData, session_date: e.target.value })
                }
                className="w-full bg-gray-900 border border-commander-border rounded-lg px-2 py-1 text-white text-sm mt-1"
                required
              />
            </div>
            <div>
              <label className="text-xs text-commander-muted font-bold">
                Session Type
              </label>
              <select
                value={formData.session_type}
                onChange={(e) =>
                  setFormData({ ...formData, session_type: e.target.value })
                }
                className="w-full bg-gray-900 border border-commander-border rounded-lg px-2 py-1 text-white text-sm mt-1"
              >
                <option>Class</option>
                <option>Open Mat</option>
                <option>Competition</option>
                <option>Sparring</option>
              </select>
            </div>
          </div>

          {/* Techniques */}
          <div>
            <label className="text-xs text-commander-muted font-bold">
              Techniques Practiced
            </label>
            {formData.techniques_practiced.map((tech, idx) => (
              <div key={idx} className="mt-2 space-y-2">
                <input
                  type="text"
                  placeholder="Technique name (e.g., Armbar, Guard Pass)"
                  value={tech.name}
                  onChange={(e) => {
                    const updated = [...formData.techniques_practiced];
                    updated[idx].name = e.target.value;
                    setFormData({
                      ...formData,
                      techniques_practiced: updated,
                    });
                  }}
                  className="w-full bg-gray-900 border border-commander-border rounded-lg px-2 py-1 text-white text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={tech.position}
                    onChange={(e) => {
                      const updated = [...formData.techniques_practiced];
                      updated[idx].position = e.target.value;
                      setFormData({
                        ...formData,
                        techniques_practiced: updated,
                      });
                    }}
                    className="bg-gray-900 border border-commander-border rounded-lg px-2 py-1 text-white text-sm"
                  >
                    <option>Guard</option>
                    <option>Mount</option>
                    <option>Side Control</option>
                    <option>Back Control</option>
                    <option>Turtle</option>
                    <option>Knee On Belly</option>
                    <option>Standing</option>
                    <option>Other</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Reps"
                    value={tech.reps}
                    onChange={(e) => {
                      const updated = [...formData.techniques_practiced];
                      updated[idx].reps = parseInt(e.target.value) || 0;
                      setFormData({
                        ...formData,
                        techniques_practiced: updated,
                      });
                    }}
                    className="bg-gray-900 border border-commander-border rounded-lg px-2 py-1 text-white text-sm"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Notes on this technique..."
                  value={tech.notes}
                  onChange={(e) => {
                    const updated = [...formData.techniques_practiced];
                    updated[idx].notes = e.target.value;
                    setFormData({
                      ...formData,
                      techniques_practiced: updated,
                    });
                  }}
                  className="w-full bg-gray-900 border border-commander-border rounded-lg px-2 py-1 text-white text-sm"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  techniques_practiced: [
                    ...formData.techniques_practiced,
                    { name: "", position: "Guard", reps: 0, notes: "" },
                  ],
                })
              }
              className="text-vellera-blue text-sm font-semibold mt-2"
            >
              + Add Technique
            </button>
          </div>

          {/* Training Partners */}
          <div>
            <label className="text-xs text-commander-muted font-bold">
              Training Partners
            </label>
            {formData.training_partners.map((partner, idx) => (
              <input
                key={idx}
                type="text"
                placeholder="Partner name"
                value={partner}
                onChange={(e) => {
                  const updated = [...formData.training_partners];
                  updated[idx] = e.target.value;
                  setFormData({ ...formData, training_partners: updated });
                }}
                className="w-full bg-gray-900 border border-commander-border rounded-lg px-2 py-1 text-white text-sm mt-2"
              />
            ))}
            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  training_partners: [...formData.training_partners, ""],
                })
              }
              className="text-vellera-blue text-sm font-semibold mt-2"
            >
              + Add Partner
            </button>
          </div>

          {/* Coach Feedback */}
          <div>
            <label className="text-xs text-commander-muted font-bold">
              Coach Feedback / Corrections
            </label>
            <textarea
              value={formData.coach_feedback}
              onChange={(e) =>
                setFormData({ ...formData, coach_feedback: e.target.value })
              }
              placeholder="What did your coach say?"
              rows="2"
              className="w-full bg-gray-900 border border-commander-border rounded-lg px-2 py-1 text-white text-sm mt-1"
            />
          </div>

          {/* Lightbulb Moments */}
          <div>
            <label className="text-xs text-commander-muted font-bold">
              Lightbulb Moments & Insights
            </label>
            {formData.lightbulb_moments.map((insight, idx) => (
              <textarea
                key={idx}
                value={insight}
                onChange={(e) => {
                  const updated = [...formData.lightbulb_moments];
                  updated[idx] = e.target.value;
                  setFormData({ ...formData, lightbulb_moments: updated });
                }}
                placeholder="Key insight or realization..."
                rows="1"
                className="w-full bg-gray-900 border border-commander-border rounded-lg px-2 py-1 text-white text-sm mt-1"
              />
            ))}
            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  lightbulb_moments: [...formData.lightbulb_moments, ""],
                })
              }
              className="text-vellera-blue text-sm font-semibold mt-2"
            >
              + Add Insight
            </button>
          </div>

          {/* Other Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-commander-muted font-bold">
                Focus Area
              </label>
              <select
                value={formData.focus_area}
                onChange={(e) =>
                  setFormData({ ...formData, focus_area: e.target.value })
                }
                className="w-full bg-gray-900 border border-commander-border rounded-lg px-2 py-1 text-white text-sm mt-1"
              >
                <option>Submissions</option>
                <option>Escapes</option>
                <option>Positional Control</option>
                <option>Cardio & Endurance</option>
                <option>Defense</option>
                <option>Footwork</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-commander-muted font-bold">
                Difficulty Level
              </label>
              <select
                value={formData.difficulty_level}
                onChange={(e) =>
                  setFormData({ ...formData, difficulty_level: e.target.value })
                }
                className="w-full bg-gray-900 border border-commander-border rounded-lg px-2 py-1 text-white text-sm mt-1"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
                <option>Elite</option>
              </select>
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="text-xs text-commander-muted font-bold">
              Session Rating: {formData.overall_feeling}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.overall_feeling}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  overall_feeling: parseInt(e.target.value),
                })
              }
              className="w-full mt-1"
            />
          </div>

          {/* Next Session Goals */}
          <div>
            <label className="text-xs text-commander-muted font-bold">
              Goals for Next Session
            </label>
            <textarea
              value={formData.next_session_goals}
              onChange={(e) =>
                setFormData({ ...formData, next_session_goals: e.target.value })
              }
              placeholder="What will you work on next?"
              rows="2"
              className="w-full bg-gray-900 border border-commander-border rounded-lg px-2 py-1 text-white text-sm mt-1"
            />
          </div>

          {/* Injury Notes */}
          <div>
            <label className="text-xs text-commander-muted font-bold">
              Injury / Pain Notes
            </label>
            <textarea
              value={formData.injury_notes}
              onChange={(e) =>
                setFormData({ ...formData, injury_notes: e.target.value })
              }
              placeholder="Any pain or discomfort to note?"
              rows="2"
              className="w-full bg-gray-900 border border-commander-border rounded-lg px-2 py-1 text-white text-sm mt-1"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-vellera-green text-commander-dark font-bold py-2 rounded-lg hover:bg-vellera-blue transition-all"
            >
              Save Entry
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 bg-gray-800 text-white font-bold py-2 rounded-lg hover:bg-gray-700 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Entries List */}
      <div className="space-y-3">
        {filteredEntries.length === 0 ? (
          <div className="bg-commander-surface border border-commander-border rounded-xl p-6 text-center">
            <p className="text-commander-muted">
              {entries.length === 0
                ? "No journal entries yet. Start by logging your first session!"
                : "No entries match your search."}
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-commander-surface border border-commander-border rounded-xl overflow-hidden"
            >
              {/* Header */}
              <button
                onClick={() =>
                  setExpandedId(expandedId === entry.id ? null : entry.id)
                }
                className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition-all"
              >
                <div className="text-left flex-1">
                  <p className="text-white font-bold">
                    {entry.session_type} - {entry.session_date}
                  </p>
                  <p className="text-commander-muted text-sm">
                    {entry.focus_area} •{" "}
                    {entry.overall_feeling ? `${entry.overall_feeling}/10` : "No rating"}
                  </p>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-commander-muted transition-transform ${
                    expandedId === entry.id ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Expanded Content */}
              {expandedId === entry.id && (
                <div className="border-t border-commander-border p-4 space-y-3 bg-gray-900/50">
                  {/* Techniques */}
                  {entry.techniques_practiced?.length > 0 && (
                    <div>
                      <p className="text-vellera-blue text-sm font-bold mb-2">
                        Techniques
                      </p>
                      {entry.techniques_practiced.map((tech, idx) => (
                        <div key={idx} className="text-xs text-gray-300 mb-1">
                          <span className="font-semibold">{tech.name}</span> (
                          {tech.position}){tech.reps ? ` - ${tech.reps} reps` : ""}
                          {tech.notes && ` - ${tech.notes}`}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Partners */}
                  {entry.training_partners?.filter((p) => p?.trim()).length >
                    0 && (
                    <div>
                      <p className="text-vellera-green text-sm font-bold mb-2">
                        Training Partners
                      </p>
                      <p className="text-xs text-gray-300">
                        {entry.training_partners.filter((p) => p?.trim()).join(", ")}
                      </p>
                    </div>
                  )}

                  {/* Coach Feedback */}
                  {entry.coach_feedback && (
                    <div>
                      <p className="text-orange-400 text-sm font-bold mb-2">
                        Coach Feedback
                      </p>
                      <p className="text-xs text-gray-300">
                        {entry.coach_feedback}
                      </p>
                    </div>
                  )}

                  {/* Insights */}
                  {entry.lightbulb_moments?.filter((m) => m?.trim()).length >
                    0 && (
                    <div>
                      <p className="text-yellow-400 text-sm font-bold mb-2">
                        💡 Lightbulb Moments
                      </p>
                      {entry.lightbulb_moments
                        .filter((m) => m?.trim())
                        .map((insight, idx) => (
                          <p key={idx} className="text-xs text-gray-300 mb-1">
                            • {insight}
                          </p>
                        ))}
                    </div>
                  )}

                  {/* Next Goals */}
                  {entry.next_session_goals && (
                    <div>
                      <p className="text-blue-400 text-sm font-bold mb-2">
                        Next Session Goals
                      </p>
                      <p className="text-xs text-gray-300">
                        {entry.next_session_goals}
                      </p>
                    </div>
                  )}

                  {/* Injury Notes */}
                  {entry.injury_notes && (
                    <div>
                      <p className="text-red-400 text-sm font-bold mb-2">
                        ⚠️ Injury Notes
                      </p>
                      <p className="text-xs text-gray-300">
                        {entry.injury_notes}
                      </p>
                    </div>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-red-500 hover:text-red-300 text-sm font-semibold flex items-center gap-1 mt-2"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Entry
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}