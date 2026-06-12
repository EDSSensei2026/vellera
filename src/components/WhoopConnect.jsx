import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { toast } from "sonner";
import { Loader2, CheckCircle, RefreshCw, Unlink } from "lucide-react";

export default function WhoopConnect() {
  const [status, setStatus] = useState("loading"); // loading | connected | disconnected
  const [lastSynced, setLastSynced] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const checkConnection = async () => {
    try {
      const tokens = await base44.entities.WhoopToken.filter({});
      if (tokens.length > 0) {
        setStatus("connected");
        setLastSynced(tokens[0].last_synced);
      } else {
        setStatus("disconnected");
      }
    } catch {
      setStatus("disconnected");
    }
  };

  useEffect(() => {
    checkConnection();

    // Listen for OAuth popup completion
    const handleMessage = (e) => {
      if (e.data === "whoop_connected") {
        checkConnection();
        toast.success("Whoop connected! Syncing data...");
        handleSync();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleConnect = async () => {
    try {
      const res = await base44.functions.invoke("whoopOAuthStart", {});
      const url = res.data?.url;
      if (!url) { toast.error("Failed to get auth URL"); return; }
      window.open(url, "_blank", "width=500,height=700");
    } catch (e) {
      toast.error("Connection error: " + (e.response?.data?.message || e.message));
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await base44.functions.invoke("whoopSync", {});
      toast.success("Whoop data synced!");
      checkConnection();
    } catch (e) {
      toast.error("Sync failed: " + e.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    const tokens = await base44.entities.WhoopToken.filter({});
    if (tokens.length > 0) await base44.entities.WhoopToken.delete(tokens[0].id);
    setStatus("disconnected");
    toast.success("Whoop disconnected");
  };

  if (status === "loading") return null;

  return (
    <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center text-base">⚡</div>
          <div>
            <p className="text-white text-sm font-bold">Whoop</p>
            {lastSynced && (
              <p className="text-commander-muted text-xs">
                Last sync: {new Date(lastSynced).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {status === "connected" ? (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1.5 bg-green-900/40 border border-green-800 text-green-400 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-green-900 transition-all min-h-[36px]"
            >
              {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Sync
            </button>
            <button
              onClick={handleDisconnect}
              className="text-commander-muted hover:text-red-400 transition-all p-1.5"
              title="Disconnect Whoop"
            >
              <Unlink className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            className="bg-red-700 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all min-h-[36px]"
          >
            Connect Whoop
          </button>
        )}
      </div>

      {status === "connected" && (
        <p className="text-xs text-commander-muted">
          Recovery · HRV · Sleep · Strain auto-synced to your biometric dashboard.
        </p>
      )}
    </div>
  );
}