import React, { useState } from 'react';
import {
  Check,
  Play,
  Search,
  FileText,
  Upload,
  BookOpen,
  ListOrdered,
  Compass,
  RotateCcw,
} from 'lucide-react';
import { Course, CourseChapter } from '../../types';
import { useCourseStore } from '../../store/useCourseStore';
import { formatSecondsToTimestamp } from '../../lib/courseUtils';
import { ChapterNotesModal } from './ChapterNotesModal';
import { StudyGuideModal } from './StudyGuideModal';

interface ChapterListProps {
  course: Course;
}

type FilterTag = 'all' | 'high' | 'spring' | 'core' | 'db' | 'dsa';

export const ChapterList: React.FC<ChapterListProps> = ({ course }) => {
  const toggleChapterCompleted = useCourseStore((state) => state.toggleChapterCompleted);
  const importChaptersFromText = useCourseStore((state) => state.importChaptersFromText);
  const updateCourse = useCourseStore((state) => state.updateCourse);
  const resetCourseToOfficial = useCourseStore((state) => state.resetCourseToOfficial);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterTag>('all');
  const [selectedChapterForNotes, setSelectedChapterForNotes] = useState<CourseChapter | null>(null);
  const [showImportBox, setShowImportBox] = useState(false);
  const [isStudyGuideOpen, setIsStudyGuideOpen] = useState(false);
  const [importText, setImportText] = useState('');

  const completedCount = course.chapters.filter((ch) => ch.completed).length;
  const totalCount = course.chapters.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredChapters = course.chapters.filter((ch) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      ch.title.toLowerCase().includes(term) ||
      (ch.category && ch.category.toLowerCase().includes(term)) ||
      (ch.description && ch.description.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    if (selectedFilter === 'high') {
      return ch.importance?.includes('⭐') || false;
    }
    if (selectedFilter === 'spring') {
      return (
        ch.importance?.includes('🎯') ||
        ch.title.toLowerCase().includes('spring') ||
        (ch.category && ch.category.toLowerCase().includes('spring')) ||
        (ch.category && ch.category.toLowerCase().includes('microservice')) ||
        false
      );
    }
    if (selectedFilter === 'core') {
      return ch.category?.toLowerCase().includes('core java') || false;
    }
    if (selectedFilter === 'db') {
      return (
        ch.category?.toLowerCase().includes('jdbc') ||
        ch.category?.toLowerCase().includes('hibernate') ||
        ch.category?.toLowerCase().includes('mongo') ||
        false
      );
    }
    if (selectedFilter === 'dsa') {
      return (
        ch.category?.toLowerCase().includes('dsa') ||
        ch.category?.toLowerCase().includes('junit') ||
        false
      );
    }
    return true;
  });

  const handleSeek = (seconds: number) => {
    if (course.platform === 'youtube-video' || course.platform === 'youtube-playlist') {
      window.dispatchEvent(
        new CustomEvent('seekCourseVideo', {
          detail: { courseId: course.id, seconds },
        })
      );
    } else {
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
      {/* Header & Progress */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-surface-border-dark/60 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold font-display text-text-primary-dark">Course Curriculum</h3>
            <span className="rounded-full bg-surface-dark border border-surface-border-dark px-2 py-0.5 text-[10px] font-mono text-text-muted-dark">
              {completedCount}/{totalCount}
            </span>
          </div>
          <p className="text-[11px] text-text-muted-dark">Click timestamp to seek video or jump to lesson</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {course.studyGuide && (
            <button
              onClick={() => setIsStudyGuideOpen(true)}
              className="flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-colors shadow-sm"
              title="Open Java & Spring Backend Study Guide & Roadmap"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Roadmap</span>
            </button>
          )}

          {course.id === 'telusko-java-spring-microservices' && (
            <button
              onClick={() => resetCourseToOfficial(course.id)}
              className="flex items-center gap-1 rounded-lg border border-surface-border-dark bg-surface-dark px-2 py-1 text-[11px] text-text-muted-dark hover:bg-surface-border-dark hover:text-text-primary-dark transition-colors"
              title="Sync / refresh official 21-chapter curriculum index"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Sync Index</span>
            </button>
          )}

          <button
            onClick={() => setShowImportBox(!showImportBox)}
            className="flex items-center gap-1 rounded-lg border border-surface-border-dark bg-surface-dark px-2 py-1 text-[11px] text-text-muted-dark hover:bg-surface-border-dark hover:text-text-primary-dark transition-colors"
            title="Import or update timestamps from video description"
          >
            <Upload className="w-3 h-3" />
            <span>Import</span>
          </button>

          {/* Progress Percentage Badge */}
          <div className="text-right pl-1">
            <span className="text-xs font-bold font-mono text-amber-400">{progressPercent}%</span>
            <p className="text-[9px] text-text-muted-dark">done</p>
          </div>
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
            placeholder="Paste timestamps from YouTube description or table:&#10;00:00:07 Introduction to Java&#10;13:13:08 JUnit 5&#10;40:41:13 Spring Boot API"
            rows={4}
            className="w-full rounded-md border border-surface-border-dark bg-surface-dark px-2.5 py-1.5 text-xs text-text-primary-dark placeholder-text-muted-dark/40 focus:border-amber-500 focus:outline-none font-mono"
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
          placeholder="Search chapters, concepts, or modules..."
          className="w-full rounded-lg border border-surface-border-dark bg-surface-dark pl-8 pr-3 py-1.5 text-xs text-text-primary-dark placeholder-text-muted-dark/50 focus:border-amber-500 focus:outline-none"
        />
      </div>

      {/* Category / Priority Quick Filter Pills */}
      <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
        {[
          { id: 'all', label: `All (${course.chapters.length})` },
          { id: 'high', label: '⭐ High / Must Watch' },
          { id: 'spring', label: '🎯 Spring & Microservices' },
          { id: 'core', label: '☕ Core Java' },
          { id: 'db', label: '🗄️ JDBC & Hibernate' },
          { id: 'dsa', label: '⚡ DSA & Testing' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedFilter(tab.id as FilterTag)}
            className={`rounded-full px-2.5 py-0.5 text-[10px] whitespace-nowrap transition-colors ${
              selectedFilter === tab.id
                ? 'bg-amber-500 font-semibold text-black shadow-sm'
                : 'bg-surface-dark border border-surface-border-dark/60 text-text-muted-dark hover:text-text-primary-dark hover:border-surface-border-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chapters Scrollable List */}
      <div className="mt-2.5 flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[520px]">
        {filteredChapters.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-muted-dark">
            <BookOpen className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
            <p>No chapters found matching your filter</p>
          </div>
        ) : (
          filteredChapters.map((chapter, idx) => {
            const isCurrent = currentChapterIndex === idx;
            const prevChapter = filteredChapters[idx - 1];
            const isNewCategory = chapter.category && chapter.category !== prevChapter?.category;

            return (
              <React.Fragment key={chapter.id}>
                {/* Module / Category Header */}
                {isNewCategory && (
                  <div className="flex items-center gap-2 pt-2.5 pb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 font-mono">
                      {chapter.category}
                    </span>
                    <div className="h-px flex-1 bg-surface-border-dark/60" />
                  </div>
                )}

                <div
                  className={`group flex items-center justify-between gap-2 rounded-lg border p-2 text-xs transition-all ${
                    isCurrent
                      ? 'border-amber-500/50 bg-amber-500/10 shadow-sm'
                      : chapter.completed
                      ? 'border-emerald-500/20 bg-emerald-500/5 opacity-80'
                      : 'border-surface-border-dark/60 bg-surface-dark/40 hover:border-surface-border-dark hover:bg-surface-dark'
                  }`}
                >
                  {/* Left: Checkbox, Title, Importance, Description */}
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

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`font-medium ${
                            chapter.completed
                              ? 'text-text-muted-dark line-through'
                              : isCurrent
                              ? 'text-amber-300 font-semibold'
                              : 'text-text-primary-dark'
                          }`}
                        >
                          {chapter.title}
                        </span>

                        {chapter.importance && (
                          <span
                            className={`inline-flex items-center rounded px-1.5 py-0.2 text-[9px] font-semibold ${
                              chapter.importance.includes('⭐')
                                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                                : chapter.importance.includes('🔗')
                                ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-300'
                                : chapter.importance.includes('🎯')
                                ? 'bg-purple-500/15 border border-purple-500/30 text-purple-300'
                                : 'bg-zinc-500/15 border border-zinc-500/30 text-zinc-300'
                            }`}
                          >
                            {chapter.importance}
                          </span>
                        )}
                      </div>

                      {chapter.description && (
                        <p className="mt-0.5 text-[10px] text-text-muted-dark truncate">
                          {chapter.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Timestamp Button & Notes */}
                  <div className="flex items-center gap-1.5 shrink-0">
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
              </React.Fragment>
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

      {/* Study Guide & Roadmap Modal */}
      {isStudyGuideOpen && (
        <StudyGuideModal
          isOpen={true}
          onClose={() => setIsStudyGuideOpen(false)}
          course={course}
        />
      )}
    </div>
  );
};
