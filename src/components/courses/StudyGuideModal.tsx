import React from 'react';
import { Modal } from '../ui/Modal';
import {
  Compass,
  Star,
  Target,
  FastForward,
  Play,
  ArrowRight,
  Flame,
  CheckCircle,
} from 'lucide-react';
import { Course, CourseStudyGuide } from '../../types';
import { parseTimestampStringToSeconds } from '../../lib/courseUtils';

interface StudyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
}

export const StudyGuideModal: React.FC<StudyGuideModalProps> = ({ isOpen, onClose, course }) => {
  const guide: CourseStudyGuide | undefined = course.studyGuide;

  if (!guide) return null;

  const handleSeek = (timeStr: string) => {
    // Extract first timestamp in range if formatted as "03:13:26 - 03:14:35"
    const firstPart = timeStr.split(/[-–—]/)[0].trim();
    const seconds = parseTimestampStringToSeconds(firstPart);
    window.dispatchEvent(
      new CustomEvent('seekCourseVideo', {
        detail: { courseId: course.id, seconds },
      })
    );
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Java & Spring Study Guide & Roadmap">
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
        {/* Prerequisite Chain Banner */}
        {guide.prerequisiteChain && (
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
              <Compass className="w-4 h-4" />
              <span>Recommended Prerequisite Chain</span>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-text-primary-dark">
              {guide.prerequisiteChain.split('→').map((step, idx, arr) => (
                <React.Fragment key={idx}>
                  <span className="rounded-md bg-surface-dark border border-cyan-500/20 px-2.5 py-1 text-cyan-200">
                    {step.trim()}
                  </span>
                  {idx < arr.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-cyan-400/60 shrink-0" />}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Must Watch For Java Backend */}
        {guide.mustWatch && guide.mustWatch.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <h4 className="text-sm font-bold text-text-primary-dark font-display">
                Must Watch For Java Backend
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {guide.mustWatch.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col justify-between rounded-lg border border-amber-500/20 bg-surface-dark/70 p-3 hover:border-amber-500/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-amber-300">{item.topic}</span>
                      <button
                        onClick={() => handleSeek(item.range)}
                        className="flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-semibold text-amber-400 hover:bg-amber-500 hover:text-black transition-colors"
                        title="Jump to this section in video"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>{item.range}</span>
                      </button>
                    </div>
                    <p className="mt-1 text-[11px] text-text-muted-dark leading-relaxed">{item.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spring Boot Relevance */}
        {guide.springBootRelevance && Object.keys(guide.springBootRelevance).length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-400" />
              <h4 className="text-sm font-bold text-text-primary-dark font-display">
                Spring Boot Relevance
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.entries(guide.springBootRelevance).map(([key, val], idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-purple-500/20 bg-surface-dark/70 p-3"
                >
                  <p className="text-xs font-bold text-purple-300">{key}</p>
                  <p className="mt-1 text-[11px] text-text-muted-dark leading-relaxed">{val}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Watching Order & Top Concepts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Watching Order */}
          {guide.recommendedOrder && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-text-primary-dark font-display">
                  Recommended Order
                </h4>
              </div>
              <ol className="space-y-1.5 rounded-lg border border-surface-border-dark bg-surface-dark/50 p-3">
                {guide.recommendedOrder.map((step, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-text-primary-dark">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold font-mono text-emerald-400">
                      {idx + 1}
                    </span>
                    <span className="text-[11px] leading-tight">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Top Concepts */}
          {guide.topConcepts && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-400" />
                <h4 className="text-sm font-bold text-text-primary-dark font-display">
                  Top Concepts
                </h4>
              </div>
              <div className="space-y-1.5 rounded-lg border border-surface-border-dark bg-surface-dark/50 p-3">
                {guide.topConcepts.map((concept, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-2 border-b border-surface-border-dark/40 pb-1.5 last:border-b-0 last:pb-0">
                    <div>
                      <p className="text-xs font-bold text-rose-300">{concept.topic}</p>
                      <p className="text-[10px] text-text-muted-dark">{concept.note}</p>
                    </div>
                    <button
                      onClick={() => handleSeek(concept.timestamp)}
                      className="shrink-0 rounded bg-rose-500/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                      title="Jump to timestamp"
                    >
                      {concept.timestamp}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Can Watch Quickly */}
        {guide.canWatchQuickly && guide.canWatchQuickly.length > 0 && (
          <div className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <FastForward className="w-3.5 h-3.5" />
              <span>Can Watch Quickly / Skip</span>
            </div>
            <div className="space-y-1 text-xs text-text-muted-dark">
              {guide.canWatchQuickly.map((item, idx) => (
                <div key={idx} className="flex items-baseline gap-2">
                  <span className="font-semibold text-text-primary-dark">{item.topic} ({item.timestamp}):</span>
                  <span>{item.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
