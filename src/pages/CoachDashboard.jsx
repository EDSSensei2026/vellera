import { useState, useEffect } from 'react';
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { Users, DollarSign, CheckCircle2, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import BackButton from '../components/BackButton';

export default function CoachDashboard() {
  const [user, setUser] = useState(null);
  const [coach, setCoach] = useState(null);
  const [students, setStudents] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      setUser(me);

      // Fetch coach profile
      const coaches = await base44.entities.Coach.filter({ coach_email: me.email });
      if (coaches.length > 0) {
        setCoach(coaches[0]);
      }

      // Fetch pending tasks
      const tasks = await base44.entities.Task.filter({ coach_email: me.email, status: 'Submitted' });
      setPendingTasks(tasks);

      setLoading(false);
    };
    init();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-24 safe-area-top">
      <div className="flex items-center gap-2 mb-4">
        <BackButton to="/" />
        <h1 className="text-white text-2xl font-black">Coach Dashboard</h1>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-vellera-blue" />
            <p className="text-commander-muted text-xs uppercase tracking-widest">Active Students</p>
          </div>
          <p className="text-white text-3xl font-black">{coach?.active_students || 0}</p>
        </div>
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-vellera-green" />
            <p className="text-commander-muted text-xs uppercase tracking-widest">Month Revenue</p>
          </div>
          <p className="text-white text-3xl font-black">${coach?.monthly_revenue || 0}</p>
        </div>
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-yellow-400" />
            <p className="text-commander-muted text-xs uppercase tracking-widest">Sessions</p>
          </div>
          <p className="text-white text-3xl font-black">{coach?.total_sessions || 0}</p>
        </div>
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-red-400" />
            <p className="text-commander-muted text-xs uppercase tracking-widest">Pending Reviews</p>
          </div>
          <p className="text-white text-3xl font-black">{pendingTasks.length}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <p className="text-xs text-commander-muted uppercase tracking-widest font-bold">Quick Actions</p>
        <div className="grid grid-cols-2 gap-2">
          <Link to="/assign-task" className="bg-vellera-blue/20 border border-vellera-blue rounded-xl p-3 flex items-center justify-between hover:bg-vellera-blue/30 transition">
            <span className="text-white text-sm font-bold">Assign Task</span>
            <Plus className="w-4 h-4 text-vellera-blue" />
          </Link>
          <Link to="/coach-messages" className="bg-vellera-green/20 border border-vellera-green rounded-xl p-3 flex items-center justify-between hover:bg-vellera-green/30 transition">
            <span className="text-white text-sm font-bold">Messages</span>
            <ArrowRight className="w-4 h-4 text-vellera-green" />
          </Link>
        </div>
      </div>

      {/* Pending Reviews */}
      {pendingTasks.length > 0 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
          <p className="text-xs text-commander-muted uppercase tracking-widest font-bold mb-3">Pending Video Reviews</p>
          {pendingTasks.map(task => (
            <Link key={task.id} to={`/review-task/${task.id}`} className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded-lg hover:border-vellera-blue transition">
              <div>
                <p className="text-white text-sm font-bold">{task.title}</p>
                <p className="text-commander-muted text-xs">{task.student_email}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-commander-muted" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}