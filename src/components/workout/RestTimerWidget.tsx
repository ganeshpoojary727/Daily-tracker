import React, { useEffect } from 'react';
import { Play, Pause, RotateCcw, Timer, Volume2 } from 'lucide-react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { playWorkoutChime } from '../../lib/soundUtils';

interface RestTimerWidgetProps {
  className?: string;
  compact?: boolean;
}

export const RestTimerWidget: React.FC<RestTimerWidgetProps> = ({
  className = '',
  compact = false,
}) => {
  const { restTimer, startRestTimer, pauseRestTimer, resetRestTimer, tickRestTimer } =
    useWorkoutStore();

  const { durationSeconds, remainingSeconds, isRunning } = restTimer;

  // Interval driver for the timer
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      tickRestTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, tickRestTimer]);

  // Audio alert trigger when hitting 0
  useEffect(() => {
    if (remainingSeconds === 0 && durationSeconds > 0) {
      playWorkoutChime();
    }
  }, [remainingSeconds, durationSeconds]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeFormatted = `${minutes}:${String(seconds).padStart(2, '0')}`;

  // SVG circular calculation
  const radius = compact ? 22 : 36;
  const strokeWidth = compact ? 3.5 : 5;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = durationSeconds > 0 ? remainingSeconds / durationSeconds : 0;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const presets = [60, 90, 120];

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-surface-border-dark bg-surface-card-dark p-4 shadow-sm transition-all ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <Timer className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-text-primary-dark">
              Rest Timer
            </h3>
            <p className="text-[10px] text-text-muted-dark">Between sets recovery</p>
          </div>
        </div>

        {/* Audio test / indicator */}
        <button
          onClick={() => playWorkoutChime()}
          title="Test completion sound"
          className="rounded p-1 text-text-muted-dark hover:bg-surface-dark hover:text-emerald-400 transition-colors"
        >
          <Volume2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Main Countdown Display */}
      <div className="flex items-center justify-center gap-6 py-1">
        {/* SVG Circular Ring */}
        <div className="relative flex items-center justify-center">
          <svg
            className="transform -rotate-90"
            width={(radius + strokeWidth) * 2}
            height={(radius + strokeWidth) * 2}
          >
            {/* Background Track */}
            <circle
              cx={radius + strokeWidth}
              cy={radius + strokeWidth}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-surface-dark"
              fill="transparent"
            />
            {/* Dynamic Progress */}
            <circle
              cx={radius + strokeWidth}
              cy={radius + strokeWidth}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`transition-all duration-300 ${
                remainingSeconds === 0
                  ? 'text-streak animate-pulse'
                  : 'text-emerald-400'
              }`}
              fill="transparent"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span
              className={`font-mono font-bold tracking-tight text-text-primary-dark ${
                compact ? 'text-sm' : 'text-xl'
              }`}
            >
              {timeFormatted}
            </span>
            {!compact && (
              <span className="text-[9px] uppercase tracking-wider text-text-muted-dark">
                {isRunning ? 'Resting' : remainingSeconds === 0 ? 'Ready!' : 'Paused'}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => pauseRestTimer()}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-all ${
                isRunning
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                  : 'bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>{remainingSeconds === 0 ? 'Restart' : 'Start'}</span>
                </>
              )}
            </button>

            <button
              onClick={() => resetRestTimer()}
              title="Reset timer"
              className="rounded-lg border border-surface-border-dark bg-surface-dark p-1.5 text-text-muted-dark hover:text-text-primary-dark hover:bg-surface-card-dark transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1">
            {presets.map((preset) => (
              <button
                key={preset}
                onClick={() => startRestTimer(preset)}
                className={`rounded px-2 py-0.5 font-mono text-[10px] font-medium transition-colors ${
                  durationSeconds === preset && isRunning
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-surface-dark text-text-muted-dark hover:text-text-primary-dark hover:bg-surface-border-dark'
                }`}
              >
                {preset}s
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
