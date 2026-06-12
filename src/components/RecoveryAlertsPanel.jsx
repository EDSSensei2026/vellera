import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { Bell, Check, Clock, Dumbbell, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function RecoveryAlertsPanel() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const loadAlerts = async () => {
    try {
      const data = await base44.entities.RecoveryAlert.list("-event_end_time", 20);
      setAlerts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAlerts(); }, []);

  const acknowledge = async (alert) => {
    await base44.entities.RecoveryAlert.update(alert.id, { acknowledged: true });
    setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, acknowledged: true } : a));
    toast.success("Marked as done!");
  };

  const unread = alerts.filter(a => !a.acknowledged);

  if (loading) return null;
  if (alerts.length === 0) return null;

  return (
    <div className="bg-commander-surface border border-commander-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-commander-border">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-vellera-blue" />
          <p className="text-white font-black text-sm">Recovery Alerts</p>
          {unread.length > 0 && (
            <span className="bg-vellera-blue text-black text-xs font-black rounded-full px-2 py-0.5">
              {unread.length}
            </span>
          )}
        </div>
        <p className="text-commander-muted text-xs">Auto-generated after training</p>
      </div>

      {/* Alert list */}
      <div className="divide-y divide-commander-border">
        {alerts.map(alert => (
          <div key={alert.id} className={`px-4 py-3 ${alert.acknowledged ? "opacity-50" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <Dumbbell className={`w-4 h-4 mt-0.5 shrink-0 ${alert.acknowledged ? "text-gray-500" : "text-vellera-green"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold truncate">{alert.event_title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock className="w-3 h-3 text-commander-muted" />
                    <span className="text-commander-muted text-xs">{timeAgo(alert.event_end_time)}</span>
                    {alert.duration_minutes && (
                      <span className="text-commander-muted text-xs">· {alert.duration_minutes} min</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setExpanded(expanded === alert.id ? null : alert.id)}
                  className="text-commander-muted hover:text-white transition-colors"
                >
                  {expanded === alert.id
                    ? <ChevronUp className="w-4 h-4" />
                    : <ChevronDown className="w-4 h-4" />}
                </button>
                {!alert.acknowledged && (
                  <button
                    onClick={() => acknowledge(alert)}
                    className="w-6 h-6 rounded-full border border-commander-border hover:border-vellera-green hover:bg-vellera-green/20 flex items-center justify-center transition-all"
                    title="Mark done"
                  >
                    <Check className="w-3 h-3 text-commander-muted" />
                  </button>
                )}
                {alert.acknowledged && (
                  <Check className="w-4 h-4 text-vellera-green" />
                )}
              </div>
            </div>

            {/* Expanded message */}
            {expanded === alert.id && (
              <div className="mt-3 ml-6 bg-gray-800 rounded-lg px-3 py-3">
                <pre className="text-gray-200 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                  {alert.alert_message}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}