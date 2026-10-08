import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, FastForward, ExternalLink, Clock, Sparkles } from 'lucide-react';
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
  const markChapterCompleted = useCourseStore((state) => state.markChapterCompleted);

  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const initialResumeTargetRef = useRef(Math.floor(course.lastWatchedSeconds || 0));
  const hasVerifiedSeekRef = useRef(Math.floor(course.lastWatchedSeconds || 0) <= 5);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSeconds, setCurrentSeconds] = useState(course.lastWatchedSeconds || 0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Sync state when course changes
  useEffect(() => {
    const saved = Math.floor(course.lastWatchedSeconds || 0);
    setCurrentSeconds(saved);
    initialResumeTargetRef.current = saved;
    hasVerifiedSeekRef.current = saved <= 5;
  }, [course.id]);

  // Load YouTube IFrame API script once if not already present
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Guarantee save to storage whenever browser window is closed or reloaded
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const time = playerRef.current.getCurrentTime();
          if (typeof time === 'number' && !isNaN(time) && time > 0 && hasVerifiedSeekRef.current) {
            updatePlaybackProgress(course.id, time);
          }
        } catch {}
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [course.id, updatePlaybackProgress]);

  // Initialize YT.Player when script is ready and container is mounted
  useEffect(() => {
    let isMounted = true;
    const targetResume = initialResumeTargetRef.current;

    const initPlayer = () => {
      if (!isMounted || !containerRef.current || !window.YT || !window.YT.Player || !course.videoId) return;

      // Clean up previous instance
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
      }

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: course.videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          start: targetResume > 0 ? targetResume : 0,
          modestbranding: 1,
        },
        events: {
          onReady: (event: any) => {
            if (!isMounted) return;
            setIsPlayerReady(true);
            const dur = event.target.getDuration();
            if (dur && dur > 0) {
              updatePlaybackProgress(course.id, targetResume, dur);
            }

            // Cue or seek to last saved timestamp on player ready
            if (targetResume > 5) {
              try {
                event.target.seekTo(targetResume, true);
                setCurrentSeconds(targetResume);
              } catch {}
            }
          },
          onStateChange: (event: any) => {
            if (!isMounted) return;
            // YT.PlayerState.PLAYING is 1
            if (event.data === 1) {
              setIsPlaying(true);

              // If playback started near 0 while user had previously saved progress, auto-resume!
              if (!hasVerifiedSeekRef.current && targetResume > 5) {
                const cur = event.target.getCurrentTime();
                if (cur < targetResume - 5) {
                  try {
                    event.target.seekTo(targetResume, true);
                    setCurrentSeconds(targetResume);
                  } catch {}
                } else {
                  hasVerifiedSeekRef.current = true;
                }
              }
            } else {
              setIsPlaying(false);
              // Save progress on pause or stop ONLY if verified seek has already occurred
              if (hasVerifiedSeekRef.current && typeof event.target.getCurrentTime === 'function') {
                try {
                  const cur = event.target.getCurrentTime();
                  if (typeof cur === 'number' && !isNaN(cur) && cur > 0) {
                    setCurrentSeconds(cur);
                    updatePlaybackProgress(course.id, cur);
                  }
                } catch {}
              }
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
      // Guarantee save on component unmount (tab switch, navigating away)
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const cur = playerRef.current.getCurrentTime();
          if (typeof cur === 'number' && !isNaN(cur) && cur > 0 && hasVerifiedSeekRef.current) {
            updatePlaybackProgress(course.id, cur);
          }
        } catch {}
      }
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
      }
    };
  }, [course.id, course.videoId]);

  // Periodic watch progress tracker + Auto-complete chapters as user watches past them
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          const time = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          if (typeof time === 'number' && !isNaN(time)) {
            const target = initialResumeTargetRef.current;

            // If player is still transitioning/seeking to resume point, avoid overwriting with near-0 values
            if (!hasVerifiedSeekRef.current && target > 5) {
              if (time < target - 5) {
                try {
                  playerRef.current.seekTo(target, true);
                } catch {}
                return;
              } else {
                hasVerifiedSeekRef.current = true;
              }
            }

            setCurrentSeconds(time);
            updatePlaybackProgress(course.id, time, dur);

            // Auto-complete chapters as you watch past them
            course.chapters.forEach((chapter, idx) => {
              if (chapter.completed) return;
              const nextChapter = course.chapters[idx + 1];

              // If next chapter reached, this chapter is finished
              if (nextChapter && time >= nextChapter.timestampSeconds - 5) {
                markChapterCompleted(course.id, chapter.id);
              } else if (!nextChapter && course.totalDurationSeconds > 0 && time >= course.totalDurationSeconds - 20) {
                // Final chapter finished near end of video
                markChapterCompleted(course.id, chapter.id);
              }
            });
          }
        }
      }, 2000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, course.id, course.chapters, course.totalDurationSeconds, updatePlaybackProgress, markChapterCompleted]);

  // Global listener to seek player when user clicks a chapter in ChapterList
  useEffect(() => {
    const handleSeek = (e: Event) => {
      const customEvent = e as CustomEvent<{ courseId: string; seconds: number }>;
      if (customEvent.detail && customEvent.detail.courseId === course.id) {
        const targetSeconds = customEvent.detail.seconds;
        if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
          hasVerifiedSeekRef.current = true;
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
    const target = Math.floor(course.lastWatchedSeconds || 0);
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      hasVerifiedSeekRef.current = true;
      playerRef.current.seekTo(target, true);
      playerRef.current.playVideo();
      setCurrentSeconds(target);
    }
  };

  const handleSeekRelative = (secondsOffset: number) => {
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      const cur = playerRef.current.getCurrentTime();
      const target = Math.max(0, cur + secondsOffset);
      hasVerifiedSeekRef.current = true;
      playerRef.current.seekTo(target, true);
      setCurrentSeconds(target);
      updatePlaybackProgress(course.id, target);
    }
  };

  const totalDuration = course.totalDurationSeconds || 1;
  const watchProgressPercent = Math.min(100, Math.round((currentSeconds / totalDuration) * 100));

  // Determine active chapter based on currentSeconds
  const activeChapter = course.chapters.find((ch, i) => {
    const nextChapter = course.chapters[i + 1];
    if (nextChapter) {
      return currentSeconds >= ch.timestampSeconds && currentSeconds < nextChapter.timestampSeconds;
    }
    return currentSeconds >= ch.timestampSeconds;
  });

  const externalUrlWithTime = `https://www.youtube.com/watch?v=${course.videoId}&t=${Math.floor(currentSeconds)}s`;

  return (
    <div className="flex flex-col rounded-xl border border-surface-border-dark bg-surface-dark/60 p-4 shadow-sm backdrop-blur-sm">
      {/* Video Container */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black shadow-inner">
        <div ref={containerRef} className="h-full w-full" />
      </div>

      {/* Active Chapter / Topic Live Indicator */}
      {activeChapter && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-2 w-2 shrink-0 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 font-mono shrink-0">
              {activeChapter.category || 'Topic'}:
            </span>
            <span className="font-semibold text-text-primary-dark truncate">
              {activeChapter.title}
            </span>
          </div>
          {activeChapter.importance && (
            <span className="shrink-0 text-[10px] font-medium text-amber-300">
              {activeChapter.importance}
            </span>
          )}
        </div>
      )}

      {/* Live Continuous Playback Progress Bar */}
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-mono text-amber-400 font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatSecondsToTimestamp(currentSeconds)}</span>
            <span className="text-text-muted-dark font-normal">/ {formatSecondsToTimestamp(course.totalDurationSeconds)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-400 border border-amber-500/20">
              <Sparkles className="w-2.5 h-2.5" />
              <span>{watchProgressPercent}% Watched</span>
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-border-dark/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 transition-all duration-300"
            style={{ width: `${watchProgressPercent}%` }}
          />
        </div>
      </div>

      {/* Control Actions Row */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-surface-border-dark/50">
        <div className="flex items-center gap-2">
          {/* Resume button with status indication */}
          <button
            onClick={handleResume}
            disabled={!isPlayerReady}
            className="flex items-center gap-1.5 rounded-lg bg-streak px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-streak-hover disabled:opacity-50"
            title="Resume playback from your last saved position"
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
