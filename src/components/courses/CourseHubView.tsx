import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  BookOpen,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Code2,
} from 'lucide-react';
import { useCourseStore } from '../../store/useCourseStore';
import { useUIStore } from '../../store/useUIStore';
import { CourseSwitcher } from './CourseSwitcher';
import { VideoPlayerCard } from './VideoPlayerCard';
import { ExternalCourseCard } from './ExternalCourseCard';
import { ChapterList } from './ChapterList';
import { AddCourseModal } from './AddCourseModal';

export const CourseHubView: React.FC = () => {
  const courses = useCourseStore((state) => state.courses);
  const activeCourseId = useCourseStore((state) => state.activeCourseId);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);

  const isJavaPlaygroundOpen = useUIStore((state) => state.isJavaPlaygroundOpen);
  const isSyllabusFoldedInCompilerMode = useUIStore((state) => state.isSyllabusFoldedInCompilerMode);
  const toggleSyllabusInCompilerMode = useUIStore((state) => state.toggleSyllabusInCompilerMode);

  const activeCourse = courses[activeCourseId] || Object.values(courses)[0];

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border-dark/60 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold font-display text-text-primary-dark tracking-tight">
              Course Learning Hub
            </h1>
          </div>
          <p className="mt-1 text-xs text-text-muted-dark">
            Track video courses from YouTube, Udemy, and web with automated timestamp resume and chapter checklists.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* Normal Mode Theater View Toggle */}
          {!isJavaPlaygroundOpen && activeCourse && (
            <button
              onClick={() => setIsTheaterMode(!isTheaterMode)}
              className="flex items-center gap-1.5 rounded-lg border border-surface-border-dark bg-surface-dark px-3 py-2 text-xs font-medium text-text-muted-dark hover:text-text-primary-dark hover:border-surface-border-dark transition-colors shadow-sm"
              title={isTheaterMode ? 'Restore side-by-side view' : 'Maximize video player (Theater mode)'}
            >
              {isTheaterMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isTheaterMode ? 'Side-by-Side' : 'Theater View'}</span>
            </button>
          )}

          {/* Quick Add Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-streak px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-streak/20 transition-all hover:bg-streak-hover"
          >
            <Plus className="w-4 h-4" />
            <span>New Course</span>
          </button>
        </div>
      </div>

      {/* Course Switcher Pills */}
      <CourseSwitcher onOpenAddModal={() => setIsAddModalOpen(true)} />

      {/* Main Content Area */}
      {!activeCourse ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-border-dark py-16 text-center">
          <BookOpen className="w-10 h-10 text-text-muted-dark/40 mb-3" />
          <h3 className="text-sm font-semibold text-text-primary-dark">No Courses Added Yet</h3>
          <p className="mt-1 max-w-sm text-xs text-text-muted-dark">
            Add a YouTube course or Udemy tutorial to track your progress and resume where you left off.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 flex items-center gap-1.5 rounded-lg bg-streak px-4 py-2 text-xs font-semibold text-white hover:bg-streak-hover"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Course</span>
          </button>
        </div>
      ) : isJavaPlaygroundOpen ? (
        /* ================= COMPILER FOCUS MODE ================= */
        /* Left sidebar and curriculum are auto-folded for maximum video screen space */
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Focus Mode Notification & Syllabus Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 backdrop-blur-sm shadow-sm">
            <div className="flex items-center gap-2 text-xs">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/20 text-emerald-400">
                <Code2 className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-emerald-300">Compiler Focus Mode:</span>
              <span className="text-text-muted-dark hidden sm:inline">
                Sidebar and curriculum are folded to give you 100% video workspace beside code.
              </span>
            </div>

            <button
              onClick={toggleSyllabusInCompilerMode}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-surface-dark px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-all shadow-sm"
              title="Toggle course chapter list below the video"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>
                {isSyllabusFoldedInCompilerMode
                  ? `Show Syllabus (${activeCourse.chapters.length} chapters)`
                  : 'Fold Syllabus'}
              </span>
              {isSyllabusFoldedInCompilerMode ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronUp className="w-3 h-3" />
              )}
            </button>
          </div>

          {/* Full Width Video Player Card */}
          <div className="w-full">
            {activeCourse.platform === 'youtube-video' || activeCourse.platform === 'youtube-playlist' ? (
              <VideoPlayerCard course={activeCourse} />
            ) : (
              <ExternalCourseCard course={activeCourse} />
            )}
          </div>

          {/* Syllabus Rendered Directly Below Video when Unfolded */}
          {!isSyllabusFoldedInCompilerMode && (
            <div className="w-full pt-2">
              <ChapterList course={activeCourse} />
            </div>
          )}
        </div>
      ) : isTheaterMode ? (
        /* ================= THEATER MODE (NORMAL) ================= */
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between rounded-xl border border-surface-border-dark bg-surface-dark/60 px-4 py-2 text-xs">
            <div className="flex items-center gap-2 text-text-muted-dark">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-text-primary-dark font-medium">Theater View:</span>
              <span>Video expanded to full width. Curriculum is accessible below.</span>
            </div>
            <button
              onClick={() => setIsTheaterMode(false)}
              className="flex items-center gap-1.5 rounded-lg border border-surface-border-dark bg-surface-dark px-3 py-1 text-xs text-text-muted-dark hover:text-text-primary-dark transition-colors"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>
          </div>

          <div className="w-full">
            {activeCourse.platform === 'youtube-video' || activeCourse.platform === 'youtube-playlist' ? (
              <VideoPlayerCard course={activeCourse} />
            ) : (
              <ExternalCourseCard course={activeCourse} />
            )}
          </div>

          <div className="w-full pt-2">
            <ChapterList course={activeCourse} />
          </div>
        </div>
      ) : (
        /* ================= STANDARD 2-COLUMN VIEW ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Player or External Banner */}
          <div className="lg:col-span-7 space-y-4">
            {activeCourse.platform === 'youtube-video' || activeCourse.platform === 'youtube-playlist' ? (
              <VideoPlayerCard course={activeCourse} />
            ) : (
              <ExternalCourseCard course={activeCourse} />
            )}
          </div>

          {/* Right Column: Interactive Syllabus & Chapter Checklist */}
          <div className="lg:col-span-5">
            <ChapterList course={activeCourse} />
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      <AddCourseModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
};
