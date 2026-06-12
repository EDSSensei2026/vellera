import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import CalendarSyncWidget from "../components/CalendarSyncWidget";
import { toast } from "sonner";

const SESSION_COLORS = {
  "BJJ Foundations": "bg-blue-700",
  "MMA Wrestling": "bg-red-700",
  "No-Gi": "bg-purple-700",
  "Masters Class": "bg-yellow-700",
  "S&C Strength": "bg-orange-700",
  "S&C Zone2": "bg-green-700",
  "Home Mobility": "bg-teal-700",
  "Open Mat": "bg-gray-600",
};

function getDaysInMonth(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  return { firstDay, totalDays };
}

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function TrainingCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [sessions, setSessions] = useState([]);
  const [readiness, setReadiness] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    const [allSessions, allReadiness] = await Promise.all([
      base44.entities.TrainingSession.list("-date", 200),
      base44.entities.ReadinessCheckIn.list("-date", 60),
    ]);
    setSessions(allSessions);
    const rMap = {};
    allReadiness.forEach(r => { rMap[r.date] = r.readiness_score; });
    setReadiness(rMap);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  // Build session map by date
  const sessionMap = {};
  sessions.forEach(s => {
    if (!sessionMap[s.date]) sessionMap[s.date] = [];
    sessionMap[s.date].push(s);
  });

  const { firstDay, totalDays } = getDaysInMonth(year, month);
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination || source.droppableId === destination.droppableId) return;

    const newDate = destination.droppableId;
    const session = sessions.find(s => s.id === draggableId);
    if (!session) return;

    // Optimistic update
    setSessions(prev => prev.map(s => s.id === draggableId ? { ...s, date: newDate } : s));

    await base44.entities.TrainingSession.update(draggableId, { date: newDate });
    toast.success(`Session moved to ${newDate}`);
  };

  const monthName = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const todayStr = today.toISOString().split("T")[0];

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24 safe-area-top">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-commander-red rounded-xl flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-black text-lg">Training Calendar</h1>
            <p className="text-commander-muted text-xs">Drag to reschedule sessions</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-commander-muted">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-900/60 border border-red-700" /><span>Low readiness</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded border-2 border-commander-red" /><span>Today</span></div>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between bg-commander-surface border border-commander-border rounded-xl px-4 py-3">
        <button onClick={prevMonth} className="text-white hover:text-commander-red transition-colors p-1">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-white font-bold">{monthName}</span>
        <button onClick={nextMonth} className="text-white hover:text-commander-red transition-colors p-1">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
          <div key={d} className="text-commander-muted text-xs py-1 font-medium">{d}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-commander-surface animate-pulse" />
          ))}
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />;
              const key = dateKey(year, month, day);
              const daySessions = sessionMap[key] || [];
              const readinessScore = readiness[key];
              const isLowReadiness = readinessScore !== undefined && readinessScore < 50;
              const isToday = key === todayStr;
              const isPast = key < todayStr;

              return (
                <Droppable droppableId={key} key={key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      onClick={() => setSelected(selected === key ? null : key)}
                      className={`min-h-[64px] rounded-lg p-1 border transition-all cursor-pointer relative
                        ${isLowReadiness ? "bg-red-950/50 border-red-800" : "bg-commander-surface border-commander-border"}
                        ${isToday ? "border-commander-red border-2" : ""}
                        ${snapshot.isDraggingOver ? "bg-blue-950/40 border-blue-600" : ""}
                        ${selected === key ? "ring-1 ring-white/30" : ""}
                      `}
                    >
                      <span className={`text-xs font-bold block text-center mb-0.5 ${isToday ? "text-commander-red" : isPast ? "text-white/60" : "text-white"}`}>
                        {day}
                      </span>
                      {isLowReadiness && (
                        <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-500" title={`Readiness: ${readinessScore}`} />
                      )}
                      <div className="space-y-0.5">
                        {daySessions.slice(0, 2).map((s, si) => (
                          <Draggable draggableId={s.id} index={si} key={s.id}>
                            {(drag, dragSnapshot) => (
                              <div
                                ref={drag.innerRef}
                                {...drag.draggableProps}
                                {...drag.dragHandleProps}
                                className={`text-white text-[9px] leading-tight px-1 py-0.5 rounded truncate font-medium
                                  ${SESSION_COLORS[s.session_type] || "bg-gray-700"}
                                  ${dragSnapshot.isDragging ? "shadow-lg opacity-90 rotate-1" : ""}
                                `}
                              >
                                {s.session_type?.split(" ")[0]}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {daySessions.length > 2 && (
                          <div className="text-commander-muted text-[9px] text-center">+{daySessions.length - 2}</div>
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

      {/* Google Calendar Sync */}
      <CalendarSyncWidget />

      {/* Day detail panel */}
      {selected && (() => {
        const daySessions = sessionMap[selected] || [];
        const score = readiness[selected];
        return (
          <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-white font-bold">{selected}</p>
              {score !== undefined && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${score < 50 ? "bg-red-900 text-red-300" : score < 70 ? "bg-yellow-900 text-yellow-300" : "bg-green-900 text-green-300"}`}>
                  Readiness {score}
                </span>
              )}
            </div>
            {daySessions.length === 0 ? (
              <p className="text-commander-muted text-sm">No sessions logged</p>
            ) : (
              <div className="space-y-2">
                {daySessions.map(s => (
                  <div key={s.id} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${SESSION_COLORS[s.session_type] || "bg-gray-500"}`} />
                    <div>
                      <p className="text-white text-sm font-medium">{s.session_type}</p>
                      <p className="text-commander-muted text-xs">{s.duration_minutes ? `${s.duration_minutes} min` : ""}{s.intensity ? ` · Intensity ${s.intensity}/10` : ""}{s.google_event_id ? " · 📅 Calendar" : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}