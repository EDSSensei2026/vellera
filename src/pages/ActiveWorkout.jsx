import { useState, useEffect, useRef, useCallback } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { X, Pause, Play, SkipForward, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AudioPlayerWidget from "../components/AudioPlayerWidget";

// ─── Default workout (used if no prop passed via location state) ──────────────
const DEFAULT_WORKOUT = {
  title: "The Strike: Heavy Bag Intervals",
  totalRounds: 3,
  exercises: [
    { name: "JAB-CROSS-HOOK",   duration_seconds: 40, rest_seconds: 20 },
    { name: "UPPERCUTS",        duration_seconds: 45, rest_seconds: 15 },
    { name: "SPEED ROUND",      duration_seconds: 30, rest_seconds: 20 },
    { name: "POWER SHOTS",      duration_seconds: 40, rest_seconds: 20 },
    { name: "DEFENSE DRILL",    duration_seconds: 45, rest_seconds: 0  },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Converts raw seconds to "MM:SS" string. e.g. 65 → "01:05" */
function formatTime(seconds) {
  const s = Math.max(0, seconds);
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * playPhaseAlert(type)
 * Handles audio cues for each phase transition.
 *
 * @param {"work"|"rest"|"complete"} type
 *
 * AUDIO DUCKING INTEGRATION POINTS (native):
 *   iOS   → AVAudioSession.setCategory(.playback, options: .duckOthers)
 *   Android → AudioAttributes.Builder().setContentType(CONTENT_TYPE_SPEECH)
 *
 * WEB LIMITATION: Browsers cannot programmatically duck Spotify/YouTube.
 * The Web Audio API can control sounds played *within* the browser context only.
 */
async function playPhaseAlert(type) {
  // 1. DUCK background audio (OS-level — add native bridge call here)
  //    e.g. NativeModules.AudioDuck.requestFocus()

  try {
    const soundMap = {
      work:     "/sounds/bell.mp3",      // Boxing bell — sharp, attention-grabbing
      rest:     "/sounds/chime.mp3",     // Soft chime — signals rest period
      complete: "/sounds/complete.mp3",  // Victory anthem — workout done
    };

    const audio = new Audio(soundMap[type] || soundMap.work);
    audio.volume = 1.0;

    // 2. PLAY local asset
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      await playPromise.catch(() => {}); // Graceful fail on autoplay block
    }

    // 3. RESTORE background audio after ~2s
    //    e.g. NativeModules.AudioDuck.abandonFocus()  ← add here after delay
    await new Promise(r => setTimeout(r, 2000));
  } catch {
    // Silent fail — audio is non-critical
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ActiveWorkout({ workout: workoutProp }) {
  const navigate = useNavigate();

  // Accept workout from prop, location state, or fall back to default
  const workout = workoutProp
    || (typeof window !== "undefined" && window.history.state?.workout)
    || DEFAULT_WORKOUT;

  const { exercises, totalRounds, title } = workout;

  // ── Core State ──────────────────────────────────────────────────────────────
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timeLeft, setTimeLeft]                         = useState(exercises[0].duration_seconds);
  const [isResting, setIsResting]                       = useState(false);
  const [isPaused, setIsPaused]                         = useState(false);
  const [currentRound, setCurrentRound]                 = useState(1);
  const [isComplete, setIsComplete]                     = useState(false);
  const [showExitConfirm, setShowExitConfirm]           = useState(false);
  const [agentCoach, setAgentCoach]                     = useState(null);
  const [agentLine, setAgentLine]                       = useState(null);
  const halfwayFiredRef                                 = useRef(false);
  const exitConfirmRef = useRef(null);

  const currentExercise = exercises[currentExerciseIndex] || exercises[exercises.length - 1];
  const nextExercise    = exercises[currentExerciseIndex + 1] || null;
  const totalExercises  = exercises.length;

  // ── Load active agent coach ──────────────────────────────────────────────────
  useEffect(() => {
    base44.entities.UserAgent.filter({ is_active: true }).then(agents => {
      if (agents[0]) setAgentCoach(agents[0]);
    }).catch(() => {});
  }, []);

  // ── Agent trigger helper ──────────────────────────────────────────────────────
  const triggerAgent = useCallback(async (triggerType) => {
    if (!agentCoach) return;
    const triggerKey = `trigger_on_${triggerType === "halfway" ? "halfway" : triggerType === "rest" ? "rest" : "start"}`;
    if (!agentCoach[triggerKey]) return;
    try {
      const res = await base44.functions.invoke("generateAgentResponse", {
        agent: { name: agentCoach.name, system_prompt: agentCoach.system_prompt, voice_id: agentCoach.voice_id },
        context: {
          trigger: triggerType,
          exercise_name: currentExercise.name,
          time_elapsed_seconds: phaseDuration - timeLeft,
          time_remaining_seconds: timeLeft,
          current_round: currentRound,
          total_rounds: totalRounds,
          streak_days: 0,
          recovery_pct: null,
        },
      });
      const text = res.data?.text;
      if (text) {
        setAgentLine(text);
        // Web Speech API TTS fallback (until ElevenLabs is wired up)
        // AUDIO DUCKING: lower background volume before speaking
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(text);
          utter.rate = 1.05;
          utter.volume = 1.0;
          // RESTORE background volume on end: utter.onend = () => { /* raise volume */ }
          window.speechSynthesis.speak(utter);
        }
        setTimeout(() => setAgentLine(null), 8000);
      }
    } catch { /* silent fail */ }
  }, [agentCoach, currentExercise, timeLeft, currentRound, totalRounds]);

  // ── Screen Wakelock ─────────────────────────────────────────────────────────
  useEffect(() => {
    let wakeLock = null;
    if (!isPaused && !isComplete && "wakeLock" in navigator) {
      navigator.wakeLock.request("screen")
        .then(lock => { wakeLock = lock; })
        .catch(() => {});
    }
    return () => { wakeLock?.release().catch(() => {}); };
  }, [isPaused, isComplete]);

  // ── Halfway point trigger ────────────────────────────────────────────────────
  useEffect(() => {
    if (isResting || isPaused || isComplete) return;
    const halfway = Math.floor(currentExercise.duration_seconds / 2);
    if (timeLeft === halfway && !halfwayFiredRef.current) {
      halfwayFiredRef.current = true;
      triggerAgent("halfway");
    }
  }, [timeLeft, isResting, isPaused, isComplete, currentExercise, triggerAgent]);

  // Reset halfway flag on exercise change
  useEffect(() => { halfwayFiredRef.current = false; }, [currentExerciseIndex]);

  // ── Phase Transition Logic ───────────────────────────────────────────────────
  const advancePhase = useCallback(async () => {
    if (isResting) {
      // REST phase ended → move to next exercise
      const nextIdx = currentExerciseIndex + 1;

      if (nextIdx >= totalExercises) {
        // All exercises in this round done — check rounds
        if (currentRound >= totalRounds) {
          // ── WORKOUT COMPLETE ──
          setIsComplete(true);
          await playPhaseAlert("complete");
          return;
        }
        // Next round
        setCurrentRound(r => r + 1);
        setCurrentExerciseIndex(0);
        setIsResting(false);
        setTimeLeft(exercises[0].duration_seconds);
        await playPhaseAlert("work");
      } else {
        setCurrentExerciseIndex(nextIdx);
        setIsResting(false);
        setTimeLeft(exercises[nextIdx].duration_seconds);
        await playPhaseAlert("work");
      }
    } else {
      // WORK phase ended
      const ex = exercises[currentExerciseIndex];
      if (ex.rest_seconds > 0) {
        // Transition to REST
        setIsResting(true);
        setTimeLeft(ex.rest_seconds);
        triggerAgent("rest");
        await playPhaseAlert("rest");
      } else {
        // No rest — go straight to next exercise
        const nextIdx = currentExerciseIndex + 1;
        if (nextIdx >= totalExercises) {
          if (currentRound >= totalRounds) {
            setIsComplete(true);
            await playPhaseAlert("complete");
            return;
          }
          setCurrentRound(r => r + 1);
          setCurrentExerciseIndex(0);
          setTimeLeft(exercises[0].duration_seconds);
        } else {
          setCurrentExerciseIndex(nextIdx);
          setTimeLeft(exercises[nextIdx].duration_seconds);
        }
        await playPhaseAlert("work");
      }
    }
  }, [currentExerciseIndex, currentRound, exercises, isResting, totalExercises, totalRounds]);

  // ── Timer Engine ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isPaused || isComplete) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Schedule phase advance outside of setState to avoid stale closure
          clearInterval(interval);
          advancePhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, isComplete, advancePhase]);

  // ── User Actions ─────────────────────────────────────────────────────────────

  const handlePlayPause = () => setIsPaused(p => !p);

  /** Instantly jump to the next phase (skip current interval) */
  const handleSkipPhase = () => advancePhase();

  /** Show exit confirmation dialog */
  const handleEndWorkout = () => {
    setIsPaused(true);
    setShowExitConfirm(true);
    // Auto-cancel confirm after 5s
    clearTimeout(exitConfirmRef.current);
    exitConfirmRef.current = setTimeout(() => {
      setShowExitConfirm(false);
      setIsPaused(false);
    }, 5000);
  };

  const confirmExit = () => {
    clearTimeout(exitConfirmRef.current);
    navigate(-1);
  };

  const cancelExit = () => {
    clearTimeout(exitConfirmRef.current);
    setShowExitConfirm(false);
    setIsPaused(false);
  };

  // ── onWorkoutStart agent trigger ─────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => triggerAgent("start"), 1500);
    return () => clearTimeout(timer);
   
  }, []); // fire once on mount

  // ── Derived Display Values ───────────────────────────────────────────────────
  const phaseDuration = isResting ? currentExercise.rest_seconds : currentExercise.duration_seconds;
  const progressPercent = phaseDuration > 0 ? ((phaseDuration - timeLeft) / phaseDuration) * 100 : 0;
  const ringColor = isResting ? "#22c55e" : "#00E5FF";
  const phaseLabel = isResting ? "REST" : currentExercise.name;
  const phaseColor = isResting ? "text-green-400" : "text-[#00E5FF]";

  // ── Workout Complete Screen ───────────────────────────────────────────────────
  if (isComplete) {
    return (
      <div className="w-full h-screen bg-[#121212] flex flex-col items-center justify-center text-center p-6 safe-area-top">
        <div className="text-6xl mb-6">🏆</div>
        <h1 className="text-white font-black text-3xl mb-2">Workout Complete!</h1>
        <p className="text-gray-400 text-sm mb-2">{title}</p>
        <p className="text-[#00E5FF] font-bold text-lg mb-8">{totalRounds} Rounds · {totalExercises} Exercises</p>
        <button
          onClick={() => navigate("/")}
          className="w-full max-w-xs py-4 rounded-xl font-black text-base text-black"
          style={{ backgroundColor: "#00E5FF" }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-[#121212] flex flex-col relative overflow-hidden safe-area-top">
      {/* Ambient phase glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-colors duration-700"
        style={{ background: isResting ? "radial-gradient(ellipse at top, #22c55e0a, transparent 60%)" : "radial-gradient(ellipse at top, #00E5FF0a, transparent 60%)" }}
      />

      {/* ── Header ── */}
      <header className="relative z-20 px-4 py-4 flex items-center justify-between border-b border-gray-800 bg-black/40 backdrop-blur pt-safe">
        <button
          onClick={handleEndWorkout}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center bg-red-900/50 hover:bg-red-900 border border-red-800 rounded-lg transition-all"
        >
          <X className="w-5 h-5 text-red-400" />
        </button>

        <div className="flex-1 text-center px-4">
          <p className="text-white font-black text-sm tracking-tight truncate">{title}</p>
          <p className="text-gray-500 text-xs mt-0.5">
            Ex {currentExerciseIndex + 1}/{totalExercises} · Round {currentRound}/{totalRounds}
          </p>
        </div>

        <div className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs font-bold">
          <span style={{ color: "#00E5FF" }}>R{currentRound}</span>
          <span className="text-gray-600">/{totalRounds}</span>
        </div>
      </header>

      {/* ── Main Timer ── */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4">
        <div className="relative w-72 h-72 md:w-80 md:h-80">
          {/* SVG Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <circle cx="100" cy="100" r="90" fill="none" stroke="#1f2937" strokeWidth="8" />
            <circle
              cx="100" cy="100" r="90"
              fill="none"
              stroke={ringColor}
              strokeWidth="8"
              strokeDasharray={`${(progressPercent / 100) * 565.5} 565.5`}
              strokeLinecap="round"
              filter="url(#glow)"
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Time */}
            <div className="text-white font-mono font-black text-7xl leading-none tracking-tighter">
              {formatTime(timeLeft)}
            </div>

            {/* Phase label */}
            <p className={`mt-4 font-black text-xl tracking-widest uppercase ${phaseColor}`}>
              {phaseLabel}
            </p>

            {/* Next up */}
            <div className="mt-3 text-gray-500 text-xs text-center">
              {isResting
                ? nextExercise
                  ? <>Next: <span className="text-white font-semibold">{nextExercise.name}</span></>
                  : <span className="text-[#00E5FF]">Last exercise!</span>
                : currentExercise.rest_seconds > 0
                  ? <>Rest after: <span className="text-green-400 font-semibold">{currentExercise.rest_seconds}s</span></>
                  : <span className="text-yellow-400 font-semibold">No rest — push through!</span>
              }
            </div>

            {isPaused && (
              <div className="mt-4 px-3 py-1.5 bg-yellow-900/40 border border-yellow-700 rounded-lg">
                <span className="text-yellow-400 text-xs font-bold tracking-widest">⏸ PAUSED</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Agent Coach Line */}
      {agentLine && agentCoach && (
        <div className="relative z-20 mx-4 px-4 py-3 rounded-xl border border-[#00E5FF33] bg-[#00E5FF08] animate-pulse">
          <p className="text-xs font-bold tracking-widest mb-1" style={{ color: "#00E5FF" }}>{agentCoach.name}</p>
          <p className="text-white text-sm italic leading-snug">"{agentLine}"</p>
        </div>
      )}

      {/* Exercise mini-queue */}
      <div className="relative z-20 px-4 pb-2">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {exercises.map((ex, i) => (
            <div
              key={i}
              className="flex-shrink-0 px-2 py-1 rounded-md text-xs border transition-all"
              style={
                i === currentExerciseIndex
                  ? { borderColor: ringColor, color: ringColor, backgroundColor: ringColor + "15" }
                  : i < currentExerciseIndex
                    ? { borderColor: "#2a2a2a", color: "#4b5563", backgroundColor: "transparent" }
                    : { borderColor: "#2a2a2a", color: "#6b7280", backgroundColor: "transparent" }
              }
            >
              {i < currentExerciseIndex ? "✓" : ex.name.split(" ")[0]}
            </div>
          ))}
        </div>
      </div>

      {/* Audio Widget */}
      <AudioPlayerWidget
        isSpotifyConnected={false}
        currentTrack={{ name: "External Audio", artist: "YouTube Music" }}
        onPlayPause={() => {}}
        onSkip={() => {}}
      />

      {/* ── Controls ── */}
      <div className="relative z-20 px-6 py-5 flex items-center justify-center gap-6 bg-black/60 backdrop-blur border-t border-gray-800 safe-area-bottom">
        {/* Skip Phase */}
        <button
          onClick={handleSkipPhase}
          className="w-12 h-12 flex items-center justify-center bg-gray-900 border border-gray-700 hover:border-gray-500 rounded-full transition-all"
          title="Skip phase"
        >
          <SkipForward className="w-5 h-5 text-gray-400" />
        </button>

        {/* Play / Pause (primary) */}
        <button
          onClick={handlePlayPause}
          className="w-20 h-20 flex items-center justify-center rounded-full font-bold text-black transition-all shadow-lg hover:scale-105 active:scale-95"
          style={{ backgroundColor: "#00E5FF", boxShadow: "0 0 24px #00E5FF44" }}
          title={isPaused ? "Resume" : "Pause"}
        >
          {isPaused
            ? <Play className="w-8 h-8 fill-black" />
            : <Pause className="w-8 h-8 fill-black" />
          }
        </button>

        {/* End Workout */}
        <button
          onClick={handleEndWorkout}
          className="w-12 h-12 flex items-center justify-center bg-red-950 border border-red-800 hover:border-red-600 rounded-full transition-all"
          title="End workout"
        >
          <X className="w-5 h-5 text-red-400" />
        </button>
      </div>

      {/* ── Exit Confirmation Dialog ── */}
      {showExitConfirm && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <p className="text-white font-black text-lg">End Workout?</p>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              You're on round {currentRound} of {totalRounds}. Your progress won't be saved.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelExit}
                className="flex-1 py-3 rounded-xl border border-gray-700 text-white font-bold text-sm hover:border-gray-500 transition-all"
              >
                Keep Going
              </button>
              <button
                onClick={confirmExit}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all"
              >
                End It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}