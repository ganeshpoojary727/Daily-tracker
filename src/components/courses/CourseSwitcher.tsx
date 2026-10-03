import React from 'react';
import { Plus, Youtube, Award, Globe, Trash2 } from 'lucide-react';
import { Course } from '../../types';
import { useCourseStore } from '../../store/useCourseStore';

interface CourseSwitcherProps {
  onOpenAddModal: () => void;
}

export const CourseSwitcher: React.FC<CourseSwitcherProps> = ({ onOpenAddModal }) => {
  const courses = useCourseStore((state) => state.courses);
  const activeCourseId = useCourseStore((state) => state.activeCourseId);
  const courseOrder = useCourseStore((state) => state.courseOrder);
  const setActiveCourseId = useCourseStore((state) => state.setActiveCourseId);
  const deleteCourse = useCourseStore((state) => state.deleteCourse);

  const getPlatformIcon = (platform: Course['platform']) => {
    switch (platform) {
      case 'youtube-video':
      case 'youtube-playlist':
        return <Youtube className="w-3.5 h-3.5 text-red-500 fill-current" />;
      case 'udemy':
      case 'coursera':
        return <Award className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Globe className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
      <span className="text-xs font-mono uppercase tracking-wider text-text-muted-dark mr-1">
        Active Courses:
      </span>

      {courseOrder.map((courseId) => {
        const course = courses[courseId];
        if (!course) return null;

        const isActive = course.id === activeCourseId;
        const completedCount = course.chapters.filter((ch) => ch.completed).length;
        const totalCount = course.chapters.length;

        return (
          <div
            key={course.id}
            className={`group relative flex items-center rounded-lg border transition-all ${
              isActive
                ? 'border-streak bg-streak text-white shadow-md shadow-streak/20'
                : 'border-surface-border-dark bg-surface-dark text-text-muted-dark hover:border-surface-border-dark/80 hover:text-text-primary-dark'
            }`}
          >
            <button
              onClick={() => setActiveCourseId(course.id)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold"
            >
              {getPlatformIcon(course.platform)}
              <span className="max-w-[150px] truncate">{course.title}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                  isActive ? 'bg-black/20 text-white' : 'bg-surface-border-dark/60 text-text-muted-dark'
                }`}
              >
                {completedCount}/{totalCount}
              </span>
            </button>

            {/* Delete button (only show if more than 1 course) */}
            {courseOrder.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Remove "${course.title}" from your courses?`)) {
                    deleteCourse(course.id);
                  }
                }}
                className={`opacity-0 group-hover:opacity-100 p-1.5 transition-opacity hover:text-red-400 ${
                  isActive ? 'text-white/60' : 'text-text-muted-dark'
                }`}
                title="Remove course"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}

      {/* Add Course Button */}
      <button
        onClick={onOpenAddModal}
        className="flex items-center gap-1 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 px-3 py-1.5 text-xs font-semibold text-amber-400 transition-colors hover:border-amber-500 hover:bg-amber-500/10"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Course</span>
      </button>
    </div>
  );
};
