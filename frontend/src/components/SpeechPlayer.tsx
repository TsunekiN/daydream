import { Pause, Play, Square, Volume2 } from "lucide-react";
import { useSpeech } from "@/contexts/SpeechContext";
import { cn } from "@/lib/utils";

interface SpeechPlayerProps {
  bodyHtml: string;
  className?: string;
}

export function SpeechPlayer({ bodyHtml, className }: SpeechPlayerProps) {
  const { status, currentChunkIndex, totalChunks, rate, speak, pause, resume, stop, setRate } =
    useSpeech();

  const handlePlayPause = () => {
    if (status === "idle") {
      speak(bodyHtml);
    } else if (status === "playing") {
      pause();
    } else if (status === "paused") {
      resume();
    }
  };

  const handleStop = () => {
    stop();
  };

  const progress = totalChunks > 0 ? Math.round((currentChunkIndex / totalChunks) * 100) : 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Play/Pause */}
      <button
        onClick={handlePlayPause}
        className="p-2 rounded-full bg-daydream-gray-100 hover:bg-daydream-gray-200 transition-colors"
        aria-label={status === "playing" ? "一時停止" : "読み上げ"}
      >
        {status === "playing" ? (
          <Pause className="w-4 h-4 text-daydream-accent" />
        ) : (
          <Play className="w-4 h-4 text-daydream-pearl" />
        )}
      </button>

      {/* Stop */}
      {status !== "idle" && (
        <button
          onClick={handleStop}
          className="p-2 rounded-full bg-daydream-gray-100 hover:bg-daydream-gray-200 transition-colors"
          aria-label="停止"
        >
          <Square className="w-3.5 h-3.5 text-daydream-pearl" />
        </button>
      )}

      {/* Progress */}
      {status !== "idle" && (
        <span className="text-[10px] text-daydream-pearl tabular-nums">
          {progress}%
        </span>
      )}

      {/* Speed */}
      <div className="flex items-center gap-1 ml-auto">
        <Volume2 className="w-3.5 h-3.5 text-daydream-pearl" />
        <select
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
          className="text-[10px] bg-daydream-gray-100 border-none rounded px-1.5 py-0.5 text-daydream-pearl outline-none"
          aria-label="読み上げ速度"
        >
          <option value={0.5}>0.5x</option>
          <option value={0.75}>0.75x</option>
          <option value={1}>1x</option>
          <option value={1.25}>1.25x</option>
          <option value={1.5}>1.5x</option>
          <option value={2}>2x</option>
        </select>
      </div>
    </div>
  );
}
