import { useState } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { Calendar, Download, Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function CalendarSyncWidget() {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [exportResult, setExportResult] = useState(null);
  const [exportDays, setExportDays] = useState(7);

  const handleImport = async () => {
    setImporting(true);
    setImportResult(null);
    const res = await base44.functions.invoke("calendarSync", {});
    setImportResult(res.data);
    setImporting(false);
  };

  const handleExport = async () => {
    setExporting(true);
    setExportResult(null);
    const res = await base44.functions.invoke("exportMacrosToCalendar", { days: exportDays });
    setExportResult(res.data);
    setExporting(false);
  };

  return (
    <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-vellera-blue" />
        <h2 className="text-white font-black">Google Calendar Sync</h2>
        <span className="text-xs bg-vellera-blue/20 text-vellera-blue border border-vellera-blue/40 px-2 py-0.5 rounded-full font-bold">Connected</span>
      </div>

      {/* Import Section */}
      <div className="bg-gray-900/50 rounded-xl p-4 space-y-3 border border-gray-800">
        <div>
          <p className="text-white font-bold text-sm">📥 Import Class Schedule</p>
          <p className="text-commander-muted text-xs mt-0.5">Scans your Google Calendar for BJJ, MMA & strength events. Automatically creates session logs for past classes.</p>
        </div>
        <button onClick={handleImport} disabled={importing}
          className="w-full flex items-center justify-center gap-2 bg-vellera-blue text-commander-dark font-black py-2.5 rounded-lg hover:bg-vellera-green transition-all disabled:opacity-60">
          {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {importing ? "Scanning Calendar..." : "Import Training Classes"}
        </button>

        {importResult && (
          <div className={`rounded-lg p-3 text-xs space-y-1 ${importResult.error ? "bg-red-900/30 border border-red-700 text-red-300" : "bg-green-900/30 border border-green-700 text-green-300"}`}>
            {importResult.error ? (
              <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {importResult.error}</div>
            ) : (
              <>
                <div className="flex items-center gap-2 font-bold"><CheckCircle className="w-4 h-4" /> Import Complete</div>
                <p>📅 Events scanned: <span className="font-bold">{importResult.events_processed}</span></p>
                <p>🏋️ Sessions imported: <span className="font-bold">{importResult.sessions_imported}</span></p>
                <p>🥗 Nutrition plans auto-created: <span className="font-bold">{importResult.nutrition_plans_auto_created}</span></p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Export Section */}
      <div className="bg-gray-900/50 rounded-xl p-4 space-y-3 border border-gray-800">
        <div>
          <p className="text-white font-bold text-sm">📤 Export Macro Targets</p>
          <p className="text-commander-muted text-xs mt-0.5">Adds 6 AM meal-planning alerts to your Google Calendar with daily calorie & macro targets for upcoming days.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-commander-muted text-xs whitespace-nowrap">Export next</label>
          <select value={exportDays} onChange={e => setExportDays(Number(e.target.value))}
            className="bg-gray-900 border border-commander-border rounded-lg px-2 py-1.5 text-white text-xs flex-1">
            <option value={3}>3 days</option>
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
          </select>
        </div>
        <button onClick={handleExport} disabled={exporting}
          className="w-full flex items-center justify-center gap-2 bg-vellera-green text-commander-dark font-black py-2.5 rounded-lg hover:bg-vellera-blue transition-all disabled:opacity-60">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {exporting ? "Exporting to Calendar..." : "Export Macro Alerts"}
        </button>

        {exportResult && (
          <div className={`rounded-lg p-3 text-xs space-y-1 ${exportResult.error ? "bg-red-900/30 border border-red-700 text-red-300" : "bg-green-900/30 border border-green-700 text-green-300"}`}>
            {exportResult.error ? (
              <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {exportResult.error}</div>
            ) : (
              <>
                <div className="flex items-center gap-2 font-bold"><CheckCircle className="w-4 h-4" /> Export Complete</div>
                <p>🗓️ Macro alerts created: <span className="font-bold">{exportResult.events_created}</span></p>
                <p className="text-green-400/70">Check your Google Calendar at 6 AM each day for your macro targets.</p>
              </>
            )}
          </div>
        )}
      </div>

      <p className="text-commander-muted text-xs text-center">
        🔄 Real-time sync active — new calendar events auto-import when detected.
      </p>
    </div>
  );
}