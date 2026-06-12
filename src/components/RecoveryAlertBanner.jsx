import { useEffect, useState } from 'react';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RECOVERY_THRESHOLD = 30; // percent

/**
 * RecoveryAlertBanner
 * Mounts globally. Checks latest Whoop/Strava recovery score.
 * If < 30%, shows a mandatory dismissible alert recommending Primer & Reset.
 */
export default function RecoveryAlertBanner() {
  const [alert, setAlert] = useState(null);  // { score, source, message }
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      // Pulling state details from independent local storage blocks instead of dead SDK hooks
      const localSession = localStorage.getItem('vellera_session');
      if (!localSession) return;

      try {
        const me = JSON.parse(localSession);
        if (!me || !me.email) return;

        // 1. Check local device fallback wellness logs
        const localLogs = localStorage.getItem('vellera_wellness_logs');
        const logs = localLogs ? JSON.parse(localLogs) : [];
        const today = new Date().toISOString().split('T')[0];

        // Search for matching log entries for today's user metrics profile
        const todayLog = logs.find(log => log.user_email === me.email && log.log_date === today);

        if (todayLog) {
          const score = todayLog.readiness_score ?? 100;
          if (score < RECOVERY_THRESHOLD) {
            setAlert({
              score,
              source: 'Wellness Log',
              message: `Your readiness is critically low at ${score}%. High-intensity training today is not recommended.`,
            });
            return;
          }
        }

        // 2. Fallback check for wearable tokens (e.g. simulated Whoop state telemetry)
        const localTokens = localStorage.getItem('vellera_wearable_tokens');
        const tokens = localTokens ? JSON.parse(localTokens) : [];
        const whoopToken = tokens.find(t => t.user_email === me.email && t.provider === 'whoop');

        if (whoopToken && whoopToken.last_recovery_score != null) {
          const whoopScore = whoopToken.last_recovery_score;
          if (whoopScore < RECOVERY_THRESHOLD) {
            setAlert({
              score: whoopScore,
              source: 'Whoop',
              message: `Your Whoop Recovery Score is ${whoopScore}%. Strain today could extend your recovery window.`,
            });
          }
        }
      } catch (err) {
        console.error('Local telemetry extraction failed:', err);
      }
    };

    check();
  }, []);

  if (!alert || dismissed) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-0 left-0 right-0 z-50 bg-red-950 border-b-2 border-red-500 px-4 py-3 flex items-start gap-3 shadow-2xl"
    >
      {/* Icon */}
      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-red-200 font-black text-sm">
          ⚠ Recovery Alert — {alert.source}: {alert.score}%
        </p>
        <p className="text-red-300 text-xs mt-0.5">{alert.message}</p>
        <button
          onClick={() => navigate('/mobility')}
          className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-white bg-red-700 hover:bg-red-600 px-3 py-1.5 rounded-lg transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Switch to Primer &amp; Reset
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss recovery alert"
        className="p-1.5 rounded-lg text-red-400 hover:text-white hover:bg-red-800 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
