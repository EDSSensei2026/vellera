import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, ChevronRight, MessageSquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  Assigned:    { color: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/30', label: 'Assigned' },
  'In Progress': { color: 'text-vellera-blue bg-blue-900/30 border-blue-700/30', label: 'In Progress' },
  Submitted:   { color: 'text-orange-400 bg-orange-900/30 border-orange-700/30', label: 'Submitted' },
  Reviewed:    { color: 'text-purple-400 bg-purple-900/30 border-purple-700/30', label: 'Reviewed' },
  Complete:    { color: 'text-vellera-green bg-green-900/30 border-green-700/30', label: 'Complete' },
};

export default function StudentProgressLogs({ students, coachEmail }) {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [reviewingTask, setReviewingTask] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const allTasks = await base44.entities.Task.filter({ coach_email: coachEmail });
      setTasks(allTasks);
      setLoading(false);
    };
    load();
  }, [coachEmail]);

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const submitFeedback = async () => {
    if (!feedback.trim()) return;
    setSaving(true);
    await base44.entities.Task.update(reviewingTask.id, {
      coach_feedback: feedback,
      status: 'Reviewed',
    });
    setTasks(prev => prev.map(t => t.id === reviewingTask.id ? { ...t, coach_feedback: feedback, status: 'Reviewed' } : t));
    toast.success('Feedback submitted');
    setReviewingTask(null);
    setFeedback('');
    setSaving(false);
  };

  const markComplete = async (task) => {
    await base44.entities.Task.update(task.id, { status: 'Complete' });
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'Complete' } : t));
    toast.success('Marked complete');
  };

  const studentName = (email) => {
    const m = students.find(s => s.user_email === email);
    return m?.user_name || email.split('@')[0];
  };

  if (loading) {
    return (
      <div className="flex justify-center pt-12">
        <Loader2 className="w-6 h-6 text-commander-muted animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-black text-sm uppercase tracking-wider">Progress Logs</h2>
        <span className="text-commander-muted text-xs">{tasks.length} total tasks</span>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'Submitted', 'In Progress', 'Assigned', 'Complete'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
              filter === f
                ? 'bg-vellera-blue border-vellera-blue text-black'
                : 'border-commander-border text-commander-muted hover:text-white'
            }`}
          >
            {f === 'all' ? `All (${tasks.length})` : `${f} (${tasks.filter(t => t.status === f).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-commander-muted mx-auto mb-2" />
          <p className="text-white font-bold">No tasks in this category</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(task => {
          const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG['Assigned'];
          const needsReview = task.status === 'Submitted';
          return (
            <div key={task.id} className={`bg-commander-surface border rounded-xl p-4 ${needsReview ? 'border-orange-600/50' : 'border-commander-border'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-white font-bold text-sm">{task.title}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${cfg.color}`}>{task.status}</span>
                  </div>
                  <p className="text-commander-muted text-xs">
                    {studentName(task.student_email)} · {task.task_type}
                    {task.due_date && ` · Due ${new Date(task.due_date).toLocaleDateString()}`}
                  </p>
                  {task.coach_feedback && (
                    <p className="text-vellera-green text-xs mt-1 italic">Feedback: "{task.coach_feedback}"</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {needsReview && (
                    <button
                      onClick={() => { setReviewingTask(task); setFeedback(''); }}
                      className="flex items-center gap-1 text-xs text-orange-400 font-bold hover:text-orange-300 transition"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Review
                    </button>
                  )}
                  {task.status === 'Reviewed' && (
                    <button
                      onClick={() => markComplete(task)}
                      className="flex items-center gap-1 text-xs text-vellera-green font-bold hover:opacity-80 transition"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Complete
                    </button>
                  )}
                </div>
              </div>
              {task.submitted_url && (
                <a
                  href={task.submitted_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-vellera-blue font-bold hover:underline"
                >
                  View Submission <ChevronRight className="w-3 h-3" />
                </a>
              )}
            </div>
          );
        })}
      </div>

      {/* Feedback Modal */}
      {reviewingTask && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-commander-surface border border-commander-border rounded-2xl w-full max-w-md p-5 space-y-4">
            <div>
              <h3 className="text-white font-black">Leave Feedback</h3>
              <p className="text-commander-muted text-xs mt-0.5">{reviewingTask.title} · {studentName(reviewingTask.student_email)}</p>
            </div>
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="Write your coaching feedback here..."
              rows={4}
              className="w-full bg-gray-800 border border-commander-border rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-vellera-blue resize-none"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setReviewingTask(null)}
                className="flex-1 py-2.5 rounded-xl border border-commander-border text-commander-muted font-bold text-sm hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={submitFeedback}
                disabled={saving || !feedback.trim()}
                className="flex-1 py-2.5 rounded-xl bg-vellera-blue text-black font-black text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? 'Saving...' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}