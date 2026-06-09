import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, MessageCircle, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import VideoTelestration from './VideoTelestration';
import TelestrationCanvas from './TelestrationCanvas';

/**
 * ReviewBridge: Side-by-side video + feedback form
 * Instructor reviews student submission with drawing tools + collaborative notes
 */
export default function ReviewBridge({ taskId }) {
  const [task, setTask] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [collaborativeNote, setCollaborativeNote] = useState('');
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState(null);
  const [showTelestration, setShowTelestration] = useState(false);
  const [annotatedImage, setAnnotatedImage] = useState(null);

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      setUser(me);

      // Fetch task
      const tasks = await base44.entities.Task.filter({ id: taskId });
      if (tasks.length > 0) setTask(tasks[0]);

      // Fetch assignment if exists
      const assignments = await base44.entities.InstructorAssignment.filter({
        task_id: taskId,
      });
      if (assignments.length > 0) setAssignment(assignments[0]);
    };
    init();
  }, [taskId]);

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) return;

    setSending(true);
    try {
      // Update task with feedback
      await base44.entities.Task.update(task.id, {
        coach_feedback: feedbackText,
        status: 'Reviewed',
      });

      // Add collaborative note if assignment exists
      if (assignment && collaborativeNote.trim()) {
        const updatedNotes = [
          ...(assignment.shared_notes || []),
          {
            author_email: user.email,
            content: collaborativeNote,
            timestamp: new Date().toISOString(),
          },
        ];

        await base44.entities.InstructorAssignment.update(assignment.id, {
          shared_notes: updatedNotes,
        });
      }

      setFeedbackText('');
      setCollaborativeNote('');
    } finally {
      setSending(false);
    }
  };

  if (!task) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-5xl mx-auto pb-24 pt-safe">
      <h1 className="text-white text-2xl font-black">{task.title} — Review</h1>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Video + Telestration */}
        <div className="space-y-4">
          {showTelestration ? (
            <TelestrationCanvas 
              videoFrame={task.submitted_url} 
              onSave={(image) => {
                setAnnotatedImage(image);
                toast.success('Annotation saved!');
              }}
            />
          ) : (
            <div className="bg-black rounded-xl overflow-hidden border border-commander-border relative">
              {task.submitted_url && <VideoTelestration videoUrl={task.submitted_url} />}
              <button
                onClick={() => setShowTelestration(true)}
                className="absolute top-4 right-4 bg-black/60 px-3 py-2 rounded-lg text-vellera-blue hover:bg-black/80 transition flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Draw
              </button>
            </div>
          )}
          <div className="text-commander-muted text-sm">
            <p>Student: {task.student_email}</p>
            <p>Submitted: {new Date(task.submitted_date).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Feedback Form */}
        <div className="space-y-4">
          {/* Instructor Feedback */}
          <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Edit3 className="w-4 h-4 text-vellera-blue" />
              <p className="text-white font-bold">Your Feedback</p>
            </div>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Write detailed feedback for the student..."
              rows={6}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg p-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-vellera-blue resize-none"
            />
            <button
              onClick={handleSubmitFeedback}
              disabled={sending || !feedbackText.trim()}
              className="w-full py-3 rounded-lg bg-vellera-green text-black font-bold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send Feedback'}
            </button>
          </div>

          {/* Collaborative Notes (Multi-Instructor) */}
          {assignment && (
            <div className="bg-commander-surface border border-vellera-green/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="w-4 h-4 text-vellera-green" />
                <p className="text-white font-bold">Instructor Notes</p>
              </div>

              {/* Existing Notes */}
              {assignment.shared_notes?.length > 0 && (
                <div className="bg-gray-900 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                  {assignment.shared_notes.map((note, i) => (
                    <div key={i} className="border-b border-gray-800 pb-2 last:border-0">
                      <p className="text-vellera-green text-xs font-bold">{note.author_email}</p>
                      <p className="text-white text-sm">{note.content}</p>
                      <p className="text-commander-muted text-xs mt-1">
                        {new Date(note.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Note */}
              <textarea
                value={collaborativeNote}
                onChange={(e) => setCollaborativeNote(e.target.value)}
                placeholder="Add a note for other instructors..."
                rows={3}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg p-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-vellera-green resize-none"
              />
              <button
                onClick={() => {
                  if (collaborativeNote.trim()) {
                    const updatedNotes = [
                      ...(assignment.shared_notes || []),
                      {
                        author_email: user.email,
                        content: collaborativeNote,
                        timestamp: new Date().toISOString(),
                      },
                    ];
                    base44.entities.InstructorAssignment.update(assignment.id, {
                      shared_notes: updatedNotes,
                    });
                    setCollaborativeNote('');
                  }
                }}
                disabled={!collaborativeNote.trim()}
                className="w-full py-2 rounded-lg bg-vellera-green/20 border border-vellera-green text-vellera-green font-bold text-sm hover:bg-vellera-green/30 transition disabled:opacity-50"
              >
                Add Note
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}