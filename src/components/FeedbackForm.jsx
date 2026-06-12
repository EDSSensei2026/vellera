import { useState } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

export default function FeedbackForm({ studentId, studentName, instructorId, onSubmitted }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    feedback_type: "Technique Critique",
    content: "",
    areas_of_strength: [],
    areas_to_improve: [],
    action_items: [],
    rating: 3,
    is_visible_to_student: true,
  });

  const [strengthInput, setStrengthInput] = useState("");
  const [improvementInput, setImprovementInput] = useState("");
  const [actionInput, setActionInput] = useState("");

  const addStrength = () => {
    if (strengthInput.trim()) {
      setFormData(prev => ({
        ...prev,
        areas_of_strength: [...prev.areas_of_strength, strengthInput],
      }));
      setStrengthInput("");
    }
  };

  const addImprovement = () => {
    if (improvementInput.trim()) {
      setFormData(prev => ({
        ...prev,
        areas_to_improve: [...prev.areas_to_improve, improvementInput],
      }));
      setImprovementInput("");
    }
  };

  const addAction = () => {
    if (actionInput.trim()) {
      setFormData(prev => ({
        ...prev,
        action_items: [...prev.action_items, actionInput],
      }));
      setActionInput("");
    }
  };

  const removeStrength = (idx) => {
    setFormData(prev => ({
      ...prev,
      areas_of_strength: prev.areas_of_strength.filter((_, i) => i !== idx),
    }));
  };

  const removeImprovement = (idx) => {
    setFormData(prev => ({
      ...prev,
      areas_to_improve: prev.areas_to_improve.filter((_, i) => i !== idx),
    }));
  };

  const removeAction = (idx) => {
    setFormData(prev => ({
      ...prev,
      action_items: prev.action_items.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.content.trim()) {
      toast.error("Please add feedback content");
      return;
    }

    setSubmitting(true);
    try {
      await base44.entities.StudentFeedback.create({
        student_id: studentId,
        student_email: "", // Will be filled by system
        instructor_id: instructorId,
        instructor_name: "", // Will be filled by system
        ...formData,
      });

      toast.success(`Feedback sent to ${studentName}`);
      setFormData({
        feedback_type: "Technique Critique",
        content: "",
        areas_of_strength: [],
        areas_to_improve: [],
        action_items: [],
        rating: 3,
        is_visible_to_student: true,
      });
      setOpen(false);
      onSubmitted?.();
    } catch (err) {
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-yellow-900 hover:bg-yellow-800 border border-yellow-700 text-yellow-300 rounded-lg px-4 py-3 font-semibold text-sm flex items-center justify-center gap-2 transition-all min-h-[44px]"
      >
        <Plus className="w-4 h-4" /> Give Feedback
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end z-50">
      <div className="w-full max-h-[90vh] bg-commander-surface border-t border-commander-border rounded-t-xl overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-commander-border bg-commander-dark">
          <h3 className="text-white font-bold">Feedback for {studentName}</h3>
          <button onClick={() => setOpen(false)} className="text-commander-muted hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 pb-20">
          {/* Feedback Type */}
          <div>
            <label className="block text-xs text-commander-muted font-semibold mb-2">Type</label>
            <select
              value={formData.feedback_type}
              onChange={(e) => setFormData({ ...formData, feedback_type: e.target.value })}
              className="w-full bg-gray-800 border border-commander-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 min-h-[44px]"
            >
              <option>Technique Critique</option>
              <option>Strength Assessment</option>
              <option>Progress Update</option>
              <option>Belt Recommendation</option>
              <option>Program Adjustment</option>
              <option>General Comment</option>
            </select>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-xs text-commander-muted font-semibold mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: r })}
                  className={`w-10 h-10 rounded-lg border transition-all min-h-[44px] ${
                    formData.rating === r
                      ? "bg-yellow-600 border-yellow-500 text-white"
                      : "bg-gray-800 border-commander-border text-commander-muted"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Content */}
          <div>
            <label className="block text-xs text-commander-muted font-semibold mb-2">Feedback</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Provide detailed feedback..."
              className="w-full bg-gray-800 border border-commander-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 min-h-[100px] resize-none"
            />
          </div>

          {/* Areas of Strength */}
          <div>
            <label className="block text-xs text-green-400 font-semibold mb-2">✓ Areas of Strength</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={strengthInput}
                onChange={(e) => setStrengthInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addStrength())}
                placeholder="e.g., Defensive posture"
                className="flex-1 bg-gray-800 border border-commander-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400 min-h-[44px]"
              />
              <button
                type="button"
                onClick={addStrength}
                className="bg-green-900 text-green-300 px-3 rounded-lg font-semibold text-sm hover:bg-green-800 transition-all min-h-[44px]"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.areas_of_strength.map((s, i) => (
                <span key={i} className="bg-green-900/30 border border-green-800 text-green-300 text-xs rounded-full px-3 py-1 flex items-center gap-2">
                  {s}
                  <button type="button" onClick={() => removeStrength(i)} className="hover:text-red-400">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Areas to Improve */}
          <div>
            <label className="block text-xs text-orange-400 font-semibold mb-2">→ Areas to Improve</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={improvementInput}
                onChange={(e) => setImprovementInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addImprovement())}
                placeholder="e.g., Guard passing technique"
                className="flex-1 bg-gray-800 border border-commander-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 min-h-[44px]"
              />
              <button
                type="button"
                onClick={addImprovement}
                className="bg-orange-900 text-orange-300 px-3 rounded-lg font-semibold text-sm hover:bg-orange-800 transition-all min-h-[44px]"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.areas_to_improve.map((s, i) => (
                <span key={i} className="bg-orange-900/30 border border-orange-800 text-orange-300 text-xs rounded-full px-3 py-1 flex items-center gap-2">
                  {s}
                  <button type="button" onClick={() => removeImprovement(i)} className="hover:text-red-400">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Action Items */}
          <div>
            <label className="block text-xs text-blue-400 font-semibold mb-2">📋 Action Items</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addAction())}
                placeholder="e.g., Drill escape from mount 10 reps"
                className="flex-1 bg-gray-800 border border-commander-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 min-h-[44px]"
              />
              <button
                type="button"
                onClick={addAction}
                className="bg-blue-900 text-blue-300 px-3 rounded-lg font-semibold text-sm hover:bg-blue-800 transition-all min-h-[44px]"
              >
                +
              </button>
            </div>
            <div className="space-y-1">
              {formData.action_items.map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-blue-900/20 border border-blue-800 text-blue-300 text-xs rounded-lg px-3 py-2">
                  <span>•</span>
                  <span className="flex-1">{item}</span>
                  <button type="button" onClick={() => removeAction(i)} className="hover:text-red-400">
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="visible"
              checked={formData.is_visible_to_student}
              onChange={(e) => setFormData({ ...formData, is_visible_to_student: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="visible" className="text-xs text-commander-muted">
              Visible to student
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !formData.content.trim()}
            className="w-full bg-commander-red text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-all disabled:opacity-40 flex items-center justify-center gap-2 min-h-[44px]"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
            ) : (
              "Send Feedback"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}