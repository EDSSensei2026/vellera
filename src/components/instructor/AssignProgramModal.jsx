import { useState } from 'react';
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { X, Dumbbell, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

const TASK_TYPES = ['Drill', 'Strength', 'Conditioning', 'Form Check', 'Video Review', 'Homework'];

export default function AssignProgramModal({ student, coachEmail, programs, onClose, onAssigned }) {
  const [mode, setMode] = useState('quick'); // 'quick' | 'program'
  const [form, setForm] = useState({
    title: '',
    description: '',
    task_type: 'Drill',
    due_date: '',
  });
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleQuickAssign = async () => {
    if (!form.title.trim()) { toast.error('Please enter a task title'); return; }
    setSaving(true);
    await base44.entities.Task.create({
      coach_email: coachEmail,
      student_email: student.user_email,
      title: form.title,
      description: form.description,
      task_type: form.task_type,
      due_date: form.due_date || undefined,
      status: 'Assigned',
    });
    toast.success(`Task assigned to ${student.user_name || student.user_email.split('@')[0]}`);
    setSaving(false);
    onAssigned();
  };

  const handleProgramAssign = async () => {
    if (!selectedProgram) { toast.error('Select a program'); return; }
    setSaving(true);
    // Assign the program as a task referencing the program
    await base44.entities.Task.create({
      coach_email: coachEmail,
      student_email: student.user_email,
      title: `Program: ${selectedProgram.name || selectedProgram.title}`,
      description: selectedProgram.description || '',
      task_type: 'Strength',
      status: 'Assigned',
    });
    toast.success('Program assigned!');
    setSaving(false);
    onAssigned();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-commander-surface border border-commander-border rounded-2xl w-full max-w-md space-y-4 p-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-black">Assign Training</h2>
            <p className="text-commander-muted text-xs mt-0.5">
              To: {student.user_name || student.user_email.split('@')[0]}
            </p>
          </div>
          <button onClick={onClose} className="text-commander-muted hover:text-white transition p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-gray-800 rounded-lg p-1 gap-1">
          {['quick', 'program'].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${
                mode === m ? 'bg-vellera-blue text-black' : 'text-commander-muted hover:text-white'
              }`}
            >
              {m === 'quick' ? 'Quick Task' : 'From Program'}
            </button>
          ))}
        </div>

        {mode === 'quick' ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-commander-muted font-bold uppercase tracking-wider mb-1 block">Task Title *</label>
              <input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. 5×5 Back Squat, Guard Sweep Drill..."
                className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-vellera-blue"
              />
            </div>
            <div>
              <label className="text-xs text-commander-muted font-bold uppercase tracking-wider mb-1 block">Type</label>
              <div className="flex flex-wrap gap-2">
                {TASK_TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => setForm(p => ({ ...p, task_type: t }))}
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                      form.task_type === t
                        ? 'bg-vellera-blue border-vellera-blue text-black'
                        : 'border-commander-border text-commander-muted hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-commander-muted font-bold uppercase tracking-wider mb-1 block">Notes (optional)</label>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Any instructions or cues..."
                rows={2}
                className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-vellera-blue resize-none"
              />
            </div>
            <div>
              <label className="text-xs text-commander-muted font-bold uppercase tracking-wider mb-1 block">Due Date (optional)</label>
              <input
                type="date"
                value={form.due_date}
                onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-vellera-blue"
              />
            </div>
            <button
              onClick={handleQuickAssign}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-vellera-blue text-black font-black text-sm hover:opacity-90 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Assigning...' : 'Assign Task'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {programs.length === 0 ? (
              <div className="text-center py-6">
                <Dumbbell className="w-10 h-10 text-commander-muted mx-auto mb-2" />
                <p className="text-white font-bold text-sm">No Programs Available</p>
                <p className="text-commander-muted text-xs mt-1">Create training programs first to assign them here.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {programs.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProgram(p)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedProgram?.id === p.id
                        ? 'border-vellera-blue bg-vellera-blue/10'
                        : 'border-commander-border bg-gray-800/50 hover:border-gray-600'
                    }`}
                  >
                    <p className="text-white font-bold text-sm">{p.name || p.title || 'Unnamed Program'}</p>
                    {p.description && <p className="text-commander-muted text-xs mt-0.5 line-clamp-1">{p.description}</p>}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={handleProgramAssign}
              disabled={saving || !selectedProgram}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-vellera-green text-black font-black text-sm hover:opacity-90 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Assigning...' : 'Assign Program'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}