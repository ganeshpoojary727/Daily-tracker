import React, { useState } from 'react';
import {
  Check,
  Play,
  Clock,
  Search,
  FileText,
  Upload,
  BookOpen,
  CheckCircle2,
  ListOrdered,
} from 'lucide-react';
import { Course, CourseChapter } from '../../types';
import { useCourseStore } from '../../store/useCourseStore';
import { formatSecondsToTimestamp } from '../../lib/courseUtils';
import { ChapterNotesModal } from './ChapterNotesModal';

interface ChapterListProps {
  course: Course;
}

export const ChapterList: React.FC<ChapterListProps> = ({ course }) => {
  const toggleChapterCompleted = useCourseStore((state) => state.toggleChapterCompleted);
  const importChaptersFromText = useCourseStore((state) => state.importChaptersFromText);
  const updateCourse = useCourseStore((state) => state.updateCourse);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChapterForNotes, setSelectedChapterForNotes] = useState<CourseChapter | null>(null);
  const [showImportBox, setShowImportBox] = useState(false);
  const [importText, setImportText] = useState('');

  const completedCount = course.chapters.filter((ch) => ch.completed).length;
  const totalCount = course.chapters.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredChapters = course.chapters.filter((ch) =>
    ch.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSeek = (seconds: number) => {
    // If YouTube video, dispatch event to VideoPlayerCard
    if (course.platform === 'youtube-video' || course.platform === 'youtube-playlist') {
      window.dispatchEvent(
        new CustomEvent('seekCourseVideo', {
          detail: { courseId: course.id, seconds },
        })
      );
    } else {
      // For external courses, open URL
      window.open(course.url, '_blank');
    }
  };

  const handleSaveNotes = (notes: string) => {
    if (!selectedChapterForNotes) return;
    const updated = course.chapters.map((ch) =>
      ch.id === selectedChapterForNotes.id ? { ...ch, notes } : ch
    );
    updateCourse(course.id, { chapters: updated });
  };

  const handleImportTimestamps = () => {
    if (!importText.trim()) return;
    importChaptersFromText(course.id, importText);
    setImportText('');
    setShowImportBox(false);
  };

  // Find currently active chapter based on lastWatchedSeconds
  const currentWatched = course.lastWatchedSeconds || 0;
  const currentChapterIndex = course.chapters.findIndex((ch, i) => {
    const nextChapter = course.chapters[i + 1];
    if (nextChapter) {
      return currentWatched >= ch.timestampSeconds && currentWatched < nextChapter.timestampSeconds;
    }
    return currentWatched >= ch.timestampSeconds;
  });

  return (
    <div className="flex h-full flex-col rounded-xl border border-surface-border-dark bg-surface-dark/60 p-4 shadow-sm backdrop-blur-sm">
      {/* Header & Progress Ring */}
      <div className="flex items-center justify-between border-b border-surface-border-dark/60 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold font-display text-text-primary-dark">Course Curriculum</h3>
            <span className="rounded-full bg-surface-dark border border-surface-border-dark px-2 py-0.5 text-[10px] font-mono text-text-muted-dark">
              {completedCount}/{totalCount}
            </span>
          </div>
          <p className="text-[11px] text-text-muted-dark">Click timestamp to seek video or jump to lesson</p>
        </div>

        {/* Progress Percentage Badge */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-xs font-bold font-mono text-amber-400">{progressPercent}%</span>
            <p className="text-[9px] text-text-muted-dark">done</p>
          </div>
          <button
            onClick={() => setShowImportBox(!showImportBox)}
            className="flex items-center gap-1 rounded-lg border border-surface-border-dark bg-surface-dark px-2 py-1 text-[11px] text-text-muted-dark hover:bg-surface-border-dark hover:text-text-primary-dark transition-colors"
            title="Import or update timestamps from video description"
          >
            <Upload className="w-3 h-3" />
            <span>Import</span>
          </button>
        </div>
      </div>

      {/* Import / Paste Timestamps Box */}
      {showImportBox && (
        <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
          <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Paste Timestamps / Chapters</span>
          </p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste timestamps from YouTube description, e.g.:&#10;00:00 Introduction&#10;15:30 Setup JDK&#10;1:20:00 OOP Concepts"
            rows={4}
            className="w-full rounded-md border border-surface-border-dark bg-surface-dark px-2.5 py-1.5 text-xs text-text-primary-dark placeholder-text-muted-dark/40 focus:border-amber-500 focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowImportBox(false)}
              className="px-2.5 py-1 text-xs text-text-muted-dark hover:text-text-primary-dark"
            >
              Cancel
            </button>
            <button
              onClick={handleImportTimestamps}
              className="rounded bg-amber-500 hover:bg-amber-600 px-3 py-1 text-xs font-semibold text-black"
            >
              Parse & Save
            </button>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="mt-3 relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-muted-dark" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search chapters or topics..."
          className="w-full rounded-lg border border-surface-border-dark bg-surface-dark pl-8 pr-3 py-1.5 text-xs text-text-primary-dark placeholder-text-muted-dark/50 focus:border-amber-500 focus:outline-none"
        />
      </div>

      {/* Chapters Scrollable List */}
      <div className="mt-3 flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[500px]">
        {filteredChapters.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-muted-dark">
            <BookOpen className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
            <p>No chapters found matching "{searchTerm}"</p>
          </div>
        ) : (
          filteredChapters.map((chapter, idx) => {
            const isCurrent = currentChapterIndex === idx;

            return (
              <div
                key={chapter.id}
                className={`group flex items-center justify-between gap-2 rounded-lg border p-2 text-xs transition-all ${
                  isCurrent
                    ? 'border-amber-500/50 bg-amber-500/10 shadow-sm'
                    : chapter.completed
                    ? 'border-emerald-500/20 bg-emerald-500/5 opacity-80'
                    : 'border-surface-border-dark/60 bg-surface-dark/40 hover:border-surface-border-dark hover:bg-surface-dark'
                }`}
              >
                {/* Left: Checkbox & Title */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    onClick={() => toggleChapterCompleted(course.id, chapter.id)}
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      chapter.completed
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-surface-border-dark bg-surface-dark hover:border-emerald-400'
                    }`}
                    title={chapter.completed ? 'Mark uncompleted' : 'Mark completed'}
                  >
                    {chapter.completed && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>

                  <span
                    className={`truncate font-medium ${
                      chapter.completed
                        ? 'text-text-muted-dark line-through'
                        : isCurrent
                        ? 'text-amber-300 font-semibold'
                        : 'text-text-primary-dark'
                    }`}
                  >
                    {chapter.title}
                  </span>
                </div>

                {/* Right: Timestamp Button & Notes */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Timestamp seek button */}
                  <button
                    onClick={() => handleSeek(chapter.timestampSeconds)}
                    className={`flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[10px] font-semibold transition-colors ${
                      isCurrent
                        ? 'bg-amber-500 text-black'
                        : 'bg-surface-border-dark/40 text-text-muted-dark hover:bg-amber-500/20 hover:text-amber-400'
                    }`}
                    title="Jump video to this timestamp"
                  >
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span>{formatSecondsToTimestamp(chapter.timestampSeconds)}</span>
                  </button>

                  {/* Notes toggle */}
                  <button
                    onClick={() => setSelectedChapterForNotes(chapter)}
                    className={`rounded p-1 text-text-muted-dark hover:bg-surface-border-dark hover:text-text-primary-dark ${
                      chapter.notes ? 'text-amber-400' : 'opacity-40 group-hover:opacity-100'
                    }`}
                    title={chapter.notes ? 'View/edit chapter notes' : 'Add chapter notes'}
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Chapter Notes Modal */}
      {selectedChapterForNotes && (
        <ChapterNotesModal
          isOpen={true}
          onClose={() => setSelectedChapterForNotes(null)}
          chapter={selectedChapterForNotes}
          onSaveNotes={handleSaveNotes}
        />
      )}
    </div>
  );
};
