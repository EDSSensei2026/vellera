import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Edit2, Copy, Star, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DrillTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ template_name: "", description: "", drills: [] });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const tmpl = await base44.entities.DrillTemplate.list("-is_favorite", 100);
      setTemplates(tmpl);
    } catch (err) {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!formData.template_name.trim()) {
      toast.error("Enter a template name");
      return;
    }
    try {
      if (editingId) {
        await base44.entities.DrillTemplate.update(editingId, formData);
        toast.success("Template updated!");
      } else {
        await base44.entities.DrillTemplate.create(formData);
        toast.success("Template saved!");
      }
      setFormData({ template_name: "", description: "", drills: [] });
      setEditingId(null);
      setShowForm(false);
      await loadTemplates();
    } catch (err) {
      toast.error("Failed to save: " + err.message);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm("Delete this template?")) return;
    try {
      await base44.entities.DrillTemplate.delete(id);
      toast.success("Template deleted");
      await loadTemplates();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const handleToggleFavorite = async (id, current) => {
    try {
      await base44.entities.DrillTemplate.update(id, { is_favorite: !current });
      await loadTemplates();
    } catch (err) {
      toast.error("Failed to update");
    }
  };

  const handleEditTemplate = (tmpl) => {
    setFormData(tmpl);
    setEditingId(tmpl.id);
    setShowForm(true);
  };

  const handleDuplicateTemplate = (tmpl) => {
    setFormData({
      template_name: `${tmpl.template_name} (Copy)`,
      description: tmpl.description,
      drills: tmpl.drills,
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleUseTemplate = (tmpl) => {
    // Navigate to scheduler and pass template data via state
    navigate("/schedule-drills", { state: { template: tmpl } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-commander-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-vellera-blue" />
      </div>
    );
  }

  const favorites = templates.filter(t => t.is_favorite);
  const others = templates.filter(t => !t.is_favorite);

  return (
    <div className="min-h-screen bg-commander-dark p-4 pb-24 max-w-lg mx-auto space-y-4 safe-area-top">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-commander-muted hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-white text-xl font-black">Drill Templates</h1>
          <p className="text-commander-muted text-xs">Manage your training day routines</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setFormData({ template_name: "", description: "", drills: [] }); }}
          className="flex items-center gap-1 text-xs bg-vellera-green text-black font-bold px-3 py-1.5 rounded-lg hover:bg-opacity-90 transition-all min-h-[44px]"
        >
          <Plus className="w-3.5 h-3.5" /> New
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
          <p className="text-white font-bold text-sm">{editingId ? "Edit" : "Create"} Template</p>
          
          <div>
            <label className="text-xs text-commander-muted block mb-1">Template Name</label>
            <input
              type="text"
              placeholder="e.g. Load Bearing Day, Combat Drills"
              value={formData.template_name}
              onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
              className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-vellera-blue min-h-[44px]"
            />
          </div>

          <div>
            <label className="text-xs text-commander-muted block mb-1">Description (optional)</label>
            <textarea
              placeholder="What's the focus of this routine?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-vellera-blue"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="flex-1 py-2 px-3 bg-gray-800 border border-commander-border text-white rounded-lg text-sm font-bold hover:bg-gray-700 transition-all min-h-[44px]"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveTemplate}
              className="flex-1 py-2 px-3 bg-vellera-green text-black rounded-lg text-sm font-bold hover:bg-opacity-90 transition-all min-h-[44px]"
            >
              {editingId ? "Update" : "Create"}
            </button>
          </div>
        </div>
      )}

      {/* Favorites Section */}
      {favorites.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-commander-muted uppercase tracking-widest">⭐ Favorites</p>
          {favorites.map(tmpl => (
            <div key={tmpl.id} className="bg-commander-surface border border-amber-700/50 rounded-xl p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm">{tmpl.template_name}</p>
                  {tmpl.description && <p className="text-commander-muted text-xs mt-0.5">{tmpl.description}</p>}
                  <p className="text-gray-500 text-xs mt-1">{tmpl.drills?.length || 0} drills</p>
                </div>
                <button
                  onClick={() => handleToggleFavorite(tmpl.id, true)}
                  className="text-amber-400 hover:text-amber-300 transition-all shrink-0"
                >
                  <Star className="w-4 h-4 fill-current" />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleUseTemplate(tmpl)}
                  className="flex-1 py-2 px-2 bg-vellera-green text-black rounded-lg text-xs font-bold hover:bg-opacity-90 transition-all flex items-center justify-center gap-1 min-h-[40px]"
                >
                  <Download className="w-3 h-3" /> Use
                </button>
                <button
                  onClick={() => handleEditTemplate(tmpl)}
                  className="flex-1 py-2 px-2 bg-gray-800 border border-commander-border text-white rounded-lg text-xs font-bold hover:bg-gray-700 transition-all flex items-center justify-center gap-1 min-h-[40px]"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => handleDuplicateTemplate(tmpl)}
                  className="flex-1 py-2 px-2 bg-gray-800 border border-commander-border text-white rounded-lg text-xs font-bold hover:bg-gray-700 transition-all flex items-center justify-center gap-1 min-h-[40px]"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
                <button
                  onClick={() => handleDeleteTemplate(tmpl.id)}
                  className="py-2 px-2 bg-red-900/40 border border-red-700 text-red-400 rounded-lg hover:bg-red-900/60 transition-all min-h-[40px]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All Templates Section */}
      {others.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-commander-muted uppercase tracking-widest">{favorites.length > 0 ? "Other Templates" : "All Templates"}</p>
          {others.map(tmpl => (
            <div key={tmpl.id} className="bg-commander-surface border border-commander-border rounded-xl p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm">{tmpl.template_name}</p>
                  {tmpl.description && <p className="text-commander-muted text-xs mt-0.5">{tmpl.description}</p>}
                  <p className="text-gray-500 text-xs mt-1">{tmpl.drills?.length || 0} drills</p>
                </div>
                <button
                  onClick={() => handleToggleFavorite(tmpl.id, false)}
                  className="text-gray-600 hover:text-gray-400 transition-all shrink-0"
                >
                  <Star className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleUseTemplate(tmpl)}
                  className="flex-1 py-2 px-2 bg-vellera-green text-black rounded-lg text-xs font-bold hover:bg-opacity-90 transition-all flex items-center justify-center gap-1 min-h-[40px]"
                >
                  <Download className="w-3 h-3" /> Use
                </button>
                <button
                  onClick={() => handleEditTemplate(tmpl)}
                  className="flex-1 py-2 px-2 bg-gray-800 border border-commander-border text-white rounded-lg text-xs font-bold hover:bg-gray-700 transition-all flex items-center justify-center gap-1 min-h-[40px]"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => handleDuplicateTemplate(tmpl)}
                  className="flex-1 py-2 px-2 bg-gray-800 border border-commander-border text-white rounded-lg text-xs font-bold hover:bg-gray-700 transition-all flex items-center justify-center gap-1 min-h-[40px]"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
                <button
                  onClick={() => handleDeleteTemplate(tmpl.id)}
                  className="py-2 px-2 bg-red-900/40 border border-red-700 text-red-400 rounded-lg hover:bg-red-900/60 transition-all min-h-[40px]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {templates.length === 0 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-8 text-center">
          <p className="text-commander-muted text-sm mb-4">No templates yet. Create one to get started!</p>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setFormData({ template_name: "", description: "", drills: [] }); }}
            className="inline-flex items-center gap-2 bg-vellera-green text-black font-bold px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" /> Create First Template
          </button>
        </div>
      )}
    </div>
  );
}