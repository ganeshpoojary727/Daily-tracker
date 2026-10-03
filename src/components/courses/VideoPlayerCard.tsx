import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, FastForward, ExternalLink, Clock, CheckCircle2 } from 'lucide-react';
import { Course } from '../../types';
import { useCourseStore } from '../../store/useCourseStore';
import { formatSecondsToTimestamp } from '../../lib/courseUtils';

interface VideoPlayerCardProps {
  course: Course;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const VideoPlayerCard: React.FC<VideoPlayerCardProps> = ({ course }) => {
  const updatePlaybackProgress = useCourseStore((state) => state.updatePlaybackProgress);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSeconds, setCurrentSeconds] = useState(course.lastWatchedSeconds || 0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Load YouTube IFrame API script once if not already present
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Initialize YT.Player when script is ready and container is mounted
  useEffect(() => {
    let isMounted = true;

    const initPlayer = () => {
      if (!isMounted || !containerRef.current || !window.YT || !window.YT.Player || !course.videoId) return;

      // Clean up previous instance
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
      }

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: course.videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          start: Math.floor(course.lastWatchedSeconds || 0),
          modestbranding: 1,
        },
        events: {
          onReady: (event: any) => {
            if (!isMounted) return;
            setIsPlayerReady(true);
            const dur = event.target.getDuration();
            if (dur && dur > 0) {
              updatePlaybackProgress(course.id, course.lastWatchedSeconds, dur);
            }
          },
          onStateChange: (event: any) => {
            if (!isMounted) return;
            // YT.PlayerState.PLAYING is 1
            if (event.data === 1) {
              setIsPlaying(true);
            } else {
              setIsPlaying(false);
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initPlayer();
      };
    }

    return () => {
      isMounted = false;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
      }
    };
  }, [course.videoId]);

  // Periodic watch progress tracker (every 3 seconds while playing)
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          const time = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          if (typeof time === 'number' && !isNaN(time)) {
            setCurrentSeconds(time);
            updatePlaybackProgress(course.id, time, dur);
          }
        }
      }, 3000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, course.id, updatePlaybackProgress]);

  // Global listener to seek player when user clicks a chapter in ChapterList
  useEffect(() => {
    const handleSeek = (e: Event) => {
      const customEvent = e as CustomEvent<{ courseId: string; seconds: number }>;
      if (customEvent.detail && customEvent.detail.courseId === course.id) {
        const targetSeconds = customEvent.detail.seconds;
        if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
          playerRef.current.seekTo(targetSeconds, true);
          playerRef.current.playVideo();
          setCurrentSeconds(targetSeconds);
          updatePlaybackProgress(course.id, targetSeconds);
        }
      }
    };

    window.addEventListener('seekCourseVideo', handleSeek);
    return () => window.removeEventListener('seekCourseVideo', handleSeek);
  }, [course.id, updatePlaybackProgress]);

  const handleResume = () => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(course.lastWatchedSeconds, true);
      playerRef.current.playVideo();
    }
  };

  const handleSeekRelative = (secondsOffset: number) => {
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      const cur = playerRef.current.getCurrentTime();
      const target = Math.max(0, cur + secondsOffset);
      playerRef.current.seekTo(target, true);
      setCurrentSeconds(target);
      updatePlaybackProgress(course.id, target);
    }
  };

  const totalDuration = course.totalDurationSeconds || 1;
  const progressPercent = Math.min(100, Math.round((currentSeconds / totalDuration) * 100));

  const externalUrlWithTime = `https://www.youtube.com/watch?v=${course.videoId}&t=${Math.floor(currentSeconds)}s`;

  return (
    <div className="flex flex-col rounded-xl border border-surface-border-dark bg-surface-dark/60 p-4 shadow-sm backdrop-blur-sm">
      {/* Video Container */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black shadow-inner">
        <div ref={containerRef} className="h-full w-full" />
      </div>

      {/* Playback Progress Bar */}
      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between text-xs text-text-muted-dark">
          <span className="flex items-center gap-1.5 font-mono text-amber-400 font-semibold">
            <Clock className="w-3.5 h-3.5" />
            {formatSecondsToTimestamp(currentSeconds)}
          </span>
          <span className="font-mono text-[11px] text-text-muted-dark">
            {progressPercent}% of {formatSecondsToTimestamp(course.totalDurationSeconds)}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-border-dark/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Control Actions Row */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-surface-border-dark/50">
        <div className="flex items-center gap-2">
          {/* Resume button */}
          <button
            onClick={handleResume}
            disabled={!isPlayerReady}
            className="flex items-center gap-1.5 rounded-lg bg-streak px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-streak-hover disabled:opacity-50"
            title="Resume playback at last saved timestamp"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Resume ({formatSecondsToTimestamp(course.lastWatchedSeconds)})</span>
          </button>

          {/* Quick jump -10s / +10s */}
          <button
            onClick={() => handleSeekRelative(-10)}
            disabled={!isPlayerReady}
            className="flex items-center gap-1 rounded-lg border border-surface-border-dark bg-surface-dark px-2.5 py-1.5 text-xs text-text-muted-dark transition-colors hover:bg-surface-border-dark hover:text-text-primary-dark disabled:opacity-50"
            title="Rewind 10 seconds"
          >
            <RotateCcw className="w-3 h-3" />
            <span>-10s</span>
          </button>
          <button
            onClick={() => handleSeekRelative(10)}
            disabled={!isPlayerReady}
            className="flex items-center gap-1 rounded-lg border border-surface-border-dark bg-surface-dark px-2.5 py-1.5 text-xs text-text-muted-dark transition-colors hover:bg-surface-border-dark hover:text-text-primary-dark disabled:opacity-50"
            title="Forward 10 seconds"
          >
            <FastForward className="w-3 h-3" />
            <span>+10s</span>
          </button>
        </div>

        {/* External YouTube Link */}
        <a
          href={externalUrlWithTime}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-surface-border-dark px-2.5 py-1.5 text-xs font-medium text-text-muted-dark transition-colors hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
          title="Open video at current timestamp in YouTube"
        >
          <span>Open on YouTube</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
