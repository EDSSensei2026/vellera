import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { User, ChevronDown, ChevronUp, Plus, Loader2 } from 'lucide-react';
import AssignProgramModal from './AssignProgramModal';

export default function StudentRoster({ students, coachEmail, orgId }) {
  const [expandedId, setExpandedId] = useState(null);
  const [tasks, setTasks] = useState({});
  const [programs, setPrograms] = useState([]);
  const [assigningTo, setAssigningTo] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState({});

  useEffect(() => {
    base44.entities.TrainingProgram?.list('-created_date', 20)
      .then(p => setPrograms(p || []))
      .catch(() => {});
  }, []);

  const loadStudentTasks = async (email) => {
    if (tasks[email]) return;
    setLoadingTasks(prev => ({ ...prev, [email]: true }));
    const studentTasks = await base44.entities.Task.filter({ student_email: email, coach_email: coachEmail });
    setTasks(prev => ({ ...prev, [email]: studentTasks }));
    setLoadingTasks(prev => ({ ...prev, [email]: false }));
  };

  const toggleExpand = (member) => {
    if (expandedId === member.id) {
      setExpandedId(null);
    } else {
      setExpandedId(member.id);
      loadStudentTasks(member.user_email);
    }
  };

  const statusColor = (status) => ({
    Assigned: 'text-yellow-400 bg-yellow-900/30',
    'In Progress': 'text-vellera-blue bg-blue-900/30',
    Submitted: 'text-orange-400 bg-orange-900/30',
    Reviewed: 'text-purple-400 bg-purple-900/30',
    Complete: 'text-vellera-green bg-green-900/30',
  }[status] || 'text-gray-400 bg-gray-800');

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-white font-black text-sm uppercase tracking-wider">Student Roster</h2>
        <span className="text-commander-muted text-xs">{students.length} enrolled</span>
      </div>

      {students.length === 0 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-8 text-center">
          <User className="w-10 h-10 text-commander-muted mx-auto mb-2" />
          <p className="text-white font-bold">No students yet</p>
          <p className="text-commander-muted text-sm mt-1">Students will appear here once they join your organization.</p>
        </div>
      )}

      {students.map(member => {
        const expanded = expandedId === member.id;
        const studentTasks = tasks[member.user_email] || [];
        const completedCount = studentTasks.filter(t => t.status === 'Complete').length;
        const pendingCount = studentTasks.filter(t => ['Assigned', 'In Progress'].includes(t.status)).length;

        return (
          <div key={member.id} className="bg-commander-surface border border-commander-border rounded-xl overflow-hidden">
            <button
              onClick={() => toggleExpand(member)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-800/40 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-vellera-blue/20 border border-vellera-blue/30 flex items-center justify-center">
                  <User className="w-4 h-4 text-vellera-blue" />
                </div>
                <div className="text-left">
                  <p className="text-white font-bold text-sm">{member.user_name || member.user_email.split('@')[0]}</p>
                  <p className="text-commander-muted text-xs">{member.user_email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {studentTasks.length > 0 && (
                  <div className="flex gap-1.5 text-xs">
                    {completedCount > 0 && (
                      <span className="text-vellera-green font-bold">{completedCount} done</span>
                    )}
                    {pendingCount > 0 && (
                      <span className="text-yellow-400 font-bold">{pendingCount} pending</span>
                    )}
                  </div>
                )}
                {expanded ? <ChevronUp className="w-4 h-4 text-commander-muted" /> : <ChevronDown className="w-4 h-4 text-commander-muted" />}
              </div>
            </button>

            {expanded && (
              <div className="border-t border-commander-border p-4 space-y-3">
                {/* Assign Program Button */}
                <button
                  onClick={() => setAssigningTo(member)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-vellera-blue/10 border border-vellera-blue/30 text-vellera-blue text-sm font-bold hover:bg-vellera-blue/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Assign Training Program
                </button>

                {/* Task List */}
                {loadingTasks[member.user_email] ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 text-commander-muted animate-spin" />
                  </div>
                ) : studentTasks.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-commander-muted text-xs uppercase tracking-wider font-bold">Assigned Tasks</p>
                    {studentTasks.slice(0, 5).map(task => (
                      <div key={task.id} className="flex items-center justify-between bg-gray-900 rounded-lg px-3 py-2">
                        <div>
                          <p className="text-white text-xs font-bold">{task.title}</p>
                          <p className="text-commander-muted text-xs">{task.task_type}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${statusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                    ))}
                    {studentTasks.length > 5 && (
                      <p className="text-commander-muted text-xs text-center">+{studentTasks.length - 5} more tasks</p>
                    )}
                  </div>
                ) : (
                  <p className="text-commander-muted text-xs text-center py-2">No tasks assigned yet</p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {assigningTo && (
        <AssignProgramModal
          student={assigningTo}
          coachEmail={coachEmail}
          programs={programs}
          onClose={() => setAssigningTo(null)}
          onAssigned={() => {
            setAssigningTo(null);
            // Refresh tasks for this student
            const email = assigningTo.user_email;
            setTasks(prev => { const next = { ...prev }; delete next[email]; return next; });
            loadStudentTasks(email);
          }}
        />
      )}
    </div>
  );
}