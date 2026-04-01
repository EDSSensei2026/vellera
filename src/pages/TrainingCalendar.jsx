import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { toast } from "sonner";

const SESSION_COLORS = {
  "BJJ Foundations": "bg-blue-700 border-blue-500",
  "MMA Wrestling": "bg-red-800 border-red-600",
  "No-Gi": "bg-purple-800 border-purple-600",
  "Masters Class": "bg-yellow-800 border-yellow-600",
  "S&C Strength": "bg-orange-800 border-orange-600",
  "S&C Zone2": "bg-green-800 border-green-600",
  "Home Mobility": "bg-teal-800 border-teal-600",
  "Open Mat": "bg-gray-700 border-gray-500",
};

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

function dateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function TrainingCalendar() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [sessions, setSessions] = useState([]);
  const [readiness, setReadiness] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      base44.entities.TrainingSession.list("-date", 200),
      base44.entities.ReadinessCheckIn.list("-date", 90),
    ]).then(([sess, checkins]) => {
      setSessions(sess);
      const rmap = {};
      checkins.forEach(c => { rmap[c.date] = c.readiness_score; });
      setReadiness(rmap);
      setLoading(false);
    });
  }, []);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const monthName = new Date(viewYear, viewMonth).toLocaleString("en-US", { month: "long", year: "numeric" });

  // Group sessions by date
  const sessionsByDate = {};
  sessions.forEach(s => {
    if (!sessionsByDate[s.date]) sessionsByDate[s.date] = [];
    sessionsByDate[s.date].push(s);
  });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { draggableId, source, destination } = result;
    if (source.droppableId === destination.droppableId) return;

    const newDate = destination.droppableId;
    const session = sessions.find(s => s.id === draggableId);
    if (!session) return;

    // Optimistic update
    setSessions(prev => prev.map(s => s.id === draggableId ? { ...s, date: newDate } : s));

    await base44.entities.TrainingSession.update(draggableId, { date: newDate });
    toast.success(`Session moved to ${newDate}`);
  };

  const getRecoveryStyle = (date) => {
    const score = readiness[date];
    if (score === undefined) return "";
    if (score < 45) return "bg-red-950/60 border-red-800";
    if (score < 65) return "bg-yellow-950/40 border-yellow-800";
    return "";
  };

  const isToday = (year, month, day) =>
    year === today.getFullYear() && month === today.getMonth() && day === today.getDate();

  // Build calendar grid cells
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedSessions = selected ? (sessionsByDate[selected] || []) : [];

  return (
    <div className="p-4 max-w-lg mx-auto pb-24 safe-area-top space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-commander-red rounded-lg flex items-center justify-center">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-white font-black text-lg">Training Calendar</h1>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 transition-all">
            <ChevronLeft className="w-4 h-4 text-commander-muted" />
          </button>
          <span className="text-white text-sm font-bold px-2">{monthName}</span>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 transition-all">
            <ChevronRight className="w-4 h-4 text-commander-muted" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 text-xs flex-wrap">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-950 border border-red-800" /><span className="text-commander-muted">Low readiness (&lt;45)</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-yellow-950 border border-yellow-800" /><span className="text-commander-muted">Moderate (&lt;65)</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-commander-red" /><span className="text-commander-muted">Today</span></div>
      </div>

      {loading ? (
        <div className="h-80 animate-pulse bg-commander-surface rounded-xl border border-commander-border" />
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          {/* Day of week headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
              <div key={d} className="text-center text-xs text-commander-muted font-bold py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />;
              const date = dateStr(viewYear, viewMonth, day);
              const daySessions = sessionsByDate[date] || [];
              const recoveryStyle = getRecoveryStyle(date);
              const todayStyle = isToday(viewYear, viewMonth, day);

              return (
                <Droppable droppableId={date} key={date}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      onClick={() => setSelected(selected === date ? null : date)}
                      className={`min-h-[64px] rounded-lg border p-1 cursor-pointer transition-all ${
                        recoveryStyle || "border-commander-border bg-commander-surface"
                      } ${snapshot.isDraggingOver ? "border-commander-red bg-red-950/30" : ""} ${
                        selected === date ? "ring-1 ring-commander-red" : ""
                      }`}
                    >
                      <div className={`text-xs font-bold mb-0.5 ${todayStyle ? "text-commander-red" : "text-white"}`}>
                        {day}
                        {todayStyle && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-commander-red align-middle" />}
                      </div>
                      <div className="space-y-0.5">
                        {daySessions.slice(0, 2).map((s, i) => (
                          <Draggable draggableId={s.id} index={i} key={s.id}>
                            {(drag) => (
                              <div
                                ref={drag.innerRef}
                                {...drag.draggableProps}
                                {...drag.dragHandleProps}
                                className={`text-[9px] px-1 py-0.5 rounded border truncate text-white font-medium ${SESSION_COLORS[s.session_type] || "bg-gray-700 border-gray-500"}`}
                              >
                                {s.session_type?.split(" ")[0]}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {daySessions.length > 2 && (
                          <div className="text-[9px] text-commander-muted">+{daySessions.length - 2}</div>
                        )}
                      </div>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* Selected day detail */}
      {selected && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-white font-bold text-sm">{new Date(selected + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
            {readiness[selected] !== undefined && (
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                readiness[selected] < 45 ? "bg-red-900 text-red-300" :
                readiness[selected] < 65 ? "bg-yellow-900 text-yellow-300" :
                "bg-green-900 text-green-300"
              }`}>
                Readiness: {readiness[selected]}
              </span>
            )}
          </div>
          {selectedSessions.length === 0 ? (
            <p className="text-commander-muted text-xs">No sessions logged. Drag a session here to reschedule.</p>
          ) : (
            selectedSessions.map(s => (
              <div key={s.id} className={`border rounded-lg px-3 py-2 ${SESSION_COLORS[s.session_type] || "bg-gray-800 border-gray-600"}`}>
                <p className="text-white font-bold text-sm">{s.session_type}</p>
                <div className="flex gap-3 mt-1 text-xs text-white/70">
                  {s.duration_minutes && <span>⏱ {s.duration_minutes} min</span>}
                  {s.intensity && <span>⚡ Intensity {s.intensity}/10</span>}
                  {s.gas_level && <span>🔥 Gas {s.gas_level}/10</span>}
                </div>
                {s.wins && <p className="text-white/60 text-xs mt-1 truncate">✅ {s.wins}</p>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}