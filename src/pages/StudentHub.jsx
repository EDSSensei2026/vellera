import { useState, useEffect } from 'react';
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { CheckCircle2, Clock, Upload, MessageCircle, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import BackButton from '../components/BackButton';

export default function StudentHub() {
  const [user, setUser] = useState(null);
  const [todayTask, setTodayTask] = useState(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      setUser(me);

      // Fetch today's task
      const today = new Date().toISOString().split('T')[0];
      const tasks = await base44.entities.Task.filter({ 
        student_email: me.email, 
        due_date: today 
      });
      if (tasks.length > 0) setTodayTask(tasks[0]);

      // Fetch completed tasks (last 30 days)
      const allTasks = await base44.entities.Task.filter({ student_email: me.email });
      const completed = allTasks.filter(t => t.status === 'Complete').length;
      setCompletedCount(completed);
      setStreakDays(Math.floor(completed / 7));

      setLoading(false);
    };
    init();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24 safe-area-top">
      <div className="flex items-center gap-2 mb-4">
        <BackButton to="/" />
        <h1 className="text-white text-xl font-black">Your Tasks</h1>
      </div>

      {/* Streak Badge */}
      <div className="bg-gradient-to-r from-vellera-green/20 to-vellera-blue/20 border border-vellera-green/40 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-vellera-green font-black text-2xl">{streakDays}🔥</p>
          <p className="text-commander-muted text-xs">Week Streak</p>
        </div>
        <TrendingUp className="w-6 h-6 text-vellera-green" />
      </div>

      {/* Today's Task */}
      {todayTask ? (
        <div className="bg-commander-surface border-2 border-vellera-blue rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-vellera-blue text-xs uppercase tracking-widest font-bold">Today's Task</p>
              <p className="text-white text-lg font-black mt-1">{todayTask.title}</p>
            </div>
            {todayTask.status === 'Complete' && <CheckCircle2 className="w-5 h-5 text-vellera-green" />}
          </div>
          <p className="text-commander-muted text-sm">{todayTask.description}</p>
          
          {todayTask.status !== 'Complete' && todayTask.status !== 'Reviewed' && (
            <Link to={`/submit-task/${todayTask.id}`} className="w-full bg-vellera-blue text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition mt-2">
              <Upload className="w-4 h-4" />
              Submit Video
            </Link>
          )}
          {todayTask.status === 'Reviewed' && (
            <div className="bg-vellera-green/10 border border-vellera-green/30 rounded-lg p-3">
              <p className="text-vellera-green text-xs font-bold mb-1">Coach Feedback</p>
              <p className="text-white text-sm">{todayTask.coach_feedback}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-6 text-center">
          <Clock className="w-8 h-8 text-commander-muted mx-auto mb-2" />
          <p className="text-white font-bold">No task assigned today</p>
          <p className="text-commander-muted text-sm mt-1">Check back soon or message your coach</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
          <p className="text-commander-muted text-xs uppercase tracking-widest mb-2">Completed</p>
          <p className="text-white text-2xl font-black">{completedCount}</p>
        </div>
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
          <p className="text-commander-muted text-xs uppercase tracking-widest mb-2">Badge Progress</p>
          <p className="text-white text-2xl font-black">{Math.floor((completedCount % 10) * 10)}%</p>
        </div>
      </div>

      {/* Quick Links */}
      <Link to="/coach-messages" className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center justify-between hover:border-vellera-blue transition">
        <span className="text-white font-bold flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Message Coach
        </span>
        <span className="text-gray-500">→</span>
      </Link>
    </div>
  );
}