import React, { useState } from 'react';
import { GraduationCap, Plus, BookOpen } from 'lucide-react';
import { useCourseStore } from '../../store/useCourseStore';
import { CourseSwitcher } from './CourseSwitcher';
import { VideoPlayerCard } from './VideoPlayerCard';
import { ExternalCourseCard } from './ExternalCourseCard';
import { ChapterList } from './ChapterList';
import { AddCourseModal } from './AddCourseModal';

export const CourseHubView: React.FC = () => {
  const courses = useCourseStore((state) => state.courses);
  const activeCourseId = useCourseStore((state) => state.activeCourseId);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

        {/* Quick Add Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 self-start md:self-auto rounded-lg bg-streak px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-streak/20 transition-all hover:bg-streak-hover"
        >
          <Plus className="w-4 h-4" />
          <span>New Course</span>
        </button>
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
      ) : (
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
