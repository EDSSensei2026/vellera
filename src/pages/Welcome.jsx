import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

// Placeholder function for intro audio playback
const playIntroAudio = () => {
  // TODO: Decode and play 30-second Base64 audio on load
  // const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  // const audioData = atob(BASE64_AUDIO_STRING);
  // audioContext.decodeAudioData(audioData, (buffer) => {
  //   const source = audioContext.createBufferSource();
  //   source.buffer = buffer;
  //   source.connect(audioContext.destination);
  //   source.start(0);
  // });
  console.log("Intro audio would play here");
};

export default function Welcome() {
  const navigate = useNavigate();

  useEffect(() => {
    playIntroAudio();
  }, []);

  return (
    <div className="w-full h-screen bg-vellera-dark flex flex-col items-center justify-center p-4 space-y-6">
      {/* Vellera Logo */}
      <img src="https://media.base44.com/images/public/69c722c665db36b41f55ba9c/80e6bcea8_Gemini_Generated_Image_cza447cza447cza4.png" alt="Vellera Tactical" className="w-56 h-auto mb-4" />

      {/* Headline */}
      <h1 className="text-white text-4xl font-black text-center tracking-tight">
        Welcome to your <span className="text-vellera-blue">Vellera</span> era.
      </h1>

      {/* Subtext */}
      <p className="text-vellera-muted text-lg text-center">
        Let's build your momentum.
      </p>

      {/* CTA Button */}
      <button
        onClick={() => navigate("/home")}
        className="mt-8 bg-vellera-blue text-vellera-dark font-bold px-8 py-4 rounded-full flex items-center gap-2 hover:shadow-lg hover:shadow-vellera-blue/50 transition-all min-h-[56px] touch-target-min"
      >
        Get Started
        <ArrowRight className="w-5 h-5" />
      </button>

      {/* Tagline */}
      <p className="text-vellera-muted text-xs absolute bottom-8 text-center">
        Your Pace. Your Progress.
      </p>
    </div>
  );
}