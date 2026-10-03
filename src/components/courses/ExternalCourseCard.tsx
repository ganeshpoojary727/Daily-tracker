import React from 'react';
import { ExternalLink, Award } from 'lucide-react';
import { Course } from '../../types';
import { formatSecondsToTimestamp } from '../../lib/courseUtils';

interface ExternalCourseCardProps {
  course: Course;
}

export const ExternalCourseCard: React.FC<ExternalCourseCardProps> = ({ course }) => {
  const completedChapters = course.chapters.filter((ch) => ch.completed).length;
  const totalChapters = course.chapters.length;
  const progressPercent = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  const platformBadgeText =
    course.platform === 'udemy'
      ? 'Udemy Course'
      : course.platform === 'coursera'
      ? 'Coursera'
      : 'Web Course';

  return (
    <div className="flex flex-col rounded-xl border border-surface-border-dark bg-surface-dark/60 p-6 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase text-purple-400">
              <Award className="w-3 h-3" />
              {platformBadgeText}
            </span>
            {course.instructor && (
              <span className="text-xs text-text-muted-dark font-medium">by {course.instructor}</span>
            )}
          </div>
          <h2 className="text-xl font-bold font-display text-text-primary-dark tracking-tight">
            {course.title}
          </h2>
          {course.notes && (
            <p className="text-xs text-text-muted-dark line-clamp-2 max-w-xl">{course.notes}</p>
          )}
        </div>

        {/* Quick Launch Button */}
        <a
          href={course.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-purple-600/20 transition-all hover:brightness-110 shrink-0"
        >
          <span>Open on {course.platform === 'udemy' ? 'Udemy' : 'Platform'}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Progress Overview Card */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-surface-border-dark/60">
        <div className="rounded-lg bg-surface-dark border border-surface-border-dark/40 p-3">
          <p className="text-[10px] font-mono text-text-muted-dark uppercase tracking-wider">Chapters Finished</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-bold font-mono text-text-primary-dark">{completedChapters}</span>
            <span className="text-xs text-text-muted-dark">/ {totalChapters}</span>
          </div>
        </div>

        <div className="rounded-lg bg-surface-dark border border-surface-border-dark/40 p-3">
          <p className="text-[10px] font-mono text-text-muted-dark uppercase tracking-wider">Completion</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-bold font-mono text-amber-400">{progressPercent}%</span>
          </div>
        </div>

        <div className="rounded-lg bg-surface-dark border border-surface-border-dark/40 p-3">
          <p className="text-[10px] font-mono text-text-muted-dark uppercase tracking-wider">Estimated Time</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-bold font-mono text-text-primary-dark">
              {formatSecondsToTimestamp(course.totalDurationSeconds)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
