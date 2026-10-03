import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import {
  Youtube,
  Award,
  Globe,
  Sparkles,
  Link,
  ListOrdered,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Course, CoursePlatform, CourseChapter } from '../../types';
import { useCourseStore } from '../../store/useCourseStore';
import { useTaskStore } from '../../store/useTaskStore';
import {
  extractYouTubeId,
  fetchYouTubeOEmbed,
  parseTimestampsFromDescription,
} from '../../lib/courseUtils';

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddCourseModal: React.FC<AddCourseModalProps> = ({ isOpen, onClose }) => {
  const addCourse = useCourseStore((state) => state.addCourse);
  const taskCategories = useTaskStore((state) => state.categories);

  const [platform, setPlatform] = useState<CoursePlatform>('youtube-video');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [instructor, setInstructor] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [linkedCategoryId, setLinkedCategoryId] = useState(
    taskCategories.find((c) => !c.archived)?.id || 'study'
  );
  const [timestampsText, setTimestampsText] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchSuccess, setFetchSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-detect platform from URL
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    setError(null);

    const lower = newUrl.toLowerCase();
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
      if (lower.includes('list=')) {
        setPlatform('youtube-playlist');
      } else {
        setPlatform('youtube-video');
      }
    } else if (lower.includes('udemy.com')) {
      setPlatform('udemy');
    } else if (lower.includes('coursera.org')) {
      setPlatform('coursera');
    }
  };

  // Auto-fetch YouTube metadata via oEmbed
  const handleAutoFetch = async () => {
    if (!url.trim()) {
      setError('Please enter a URL first.');
      return;
    }

    setIsFetching(true);
    setError(null);
    setFetchSuccess(false);

    try {
      const metadata = await fetchYouTubeOEmbed(url);
      if (metadata) {
        if (metadata.title && !title) setTitle(metadata.title);
        if (metadata.author && !instructor) setInstructor(metadata.author);
        if (metadata.thumbnail && !thumbnail) setThumbnail(metadata.thumbnail);
        setFetchSuccess(true);
      } else {
        setError('Could not auto-fetch metadata for this URL. You can fill details manually.');
      }
    } catch {
      setError('Failed to fetch details. You can enter title and chapters manually.');
    } finally {
      setIsFetching(false);
    }
  };

  const parsedChapters = parseTimestampsFromDescription(timestampsText);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Course title is required.');
      return;
    }
    if (!url.trim()) {
      setError('Course URL is required.');
      return;
    }

    const { videoId, playlistId } = extractYouTubeId(url);

    // If no timestamps provided, generate default start chapter
    let chaptersToUse: CourseChapter[] = parsedChapters;
    if (chaptersToUse.length === 0) {
      chaptersToUse = [
        {
          id: `ch-${Date.now()}-1`,
          title: 'Full Course / Lesson 1',
          timestampSeconds: 0,
          completed: false,
        },
      ];
    }

    const courseId = `course-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newCourse: Course = {
      id: courseId,
      title: title.trim(),
      instructor: instructor.trim() || undefined,
      platform,
      url: url.trim(),
      videoId,
      playlistId,
      thumbnail: thumbnail.trim() || undefined,
      lastWatchedSeconds: 0,
      totalDurationSeconds:
        chaptersToUse.length > 1
          ? chaptersToUse[chaptersToUse.length - 1].timestampSeconds + 1800
          : 3600,
      linkedCategoryId: linkedCategoryId || 'study',
      chapters: chaptersToUse,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addCourse(newCourse);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Course">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
        {/* Platform Selection Tabs */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-text-muted-dark">Platform</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'youtube-video', label: 'YouTube Video', icon: Youtube },
              { id: 'youtube-playlist', label: 'YT Playlist', icon: Youtube },
              { id: 'udemy', label: 'Udemy', icon: Award },
              { id: 'custom', label: 'Web / Other', icon: Globe },
            ].map((p) => {
              const Icon = p.icon;
              const isActive = platform === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatform(p.id as CoursePlatform)}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition-all ${
                    isActive
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-semibold'
                      : 'border-surface-border-dark bg-surface-dark text-text-muted-dark hover:border-surface-border-dark/80 hover:text-text-primary-dark'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Course URL & Auto-fetch */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-muted-dark flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Link className="w-3.5 h-3.5" />
              <span>Course / Video URL *</span>
            </span>
            {(platform === 'youtube-video' || platform === 'youtube-playlist') && (
              <button
                type="button"
                onClick={handleAutoFetch}
                disabled={isFetching || !url}
                className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 disabled:opacity-50"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Fetching...</span>
                  </>
                ) : fetchSuccess ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Fetched Info</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Fetch Info</span>
                  </>
                )}
              </button>
            )}
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://youtu.be/4XTsAAHW_Tc or https://udemy.com/course/..."
            required
            className="w-full rounded-lg border border-surface-border-dark bg-surface-dark px-3 py-2 text-xs text-text-primary-dark placeholder-text-muted-dark/40 focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Title & Instructor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-muted-dark">Course Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Complete Java, Spring, & Microservices"
              required
              className="w-full rounded-lg border border-surface-border-dark bg-surface-dark px-3 py-2 text-xs text-text-primary-dark placeholder-text-muted-dark/40 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-muted-dark">Instructor / Channel</label>
            <input
              type="text"
              value={instructor}
              onChange={(e) => setInstructor(e.target.value)}
              placeholder="e.g. Telusko, FreeCodeCamp"
              className="w-full rounded-lg border border-surface-border-dark bg-surface-dark px-3 py-2 text-xs text-text-primary-dark placeholder-text-muted-dark/40 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Linked Category Dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-muted-dark flex items-center justify-between">
            <span>Link to Daily Checklist Category</span>
            <span className="text-[10px] text-text-muted-dark">Completing lessons counts towards this daily task</span>
          </label>
          <select
            value={linkedCategoryId}
            onChange={(e) => setLinkedCategoryId(e.target.value)}
            className="w-full rounded-lg border border-surface-border-dark bg-surface-dark px-3 py-2 text-xs text-text-primary-dark focus:border-amber-500 focus:outline-none"
          >
            {taskCategories
              .filter((c) => !c.archived)
              .map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.dailyTarget ? `${cat.dailyTarget} ${cat.unit || 'tasks'}/day` : 'Daily'})
                </option>
              ))}
          </select>
        </div>

        {/* Timestamps & Chapter Textarea */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-text-muted-dark flex items-center gap-1.5">
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Paste Timestamps / Syllabus (Optional)</span>
            </label>
            {parsedChapters.length > 0 && (
              <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-400">
                {parsedChapters.length} chapters detected
              </span>
            )}
          </div>
          <p className="text-[11px] text-text-muted-dark">
            Paste timestamps from YouTube description (e.g. <code>00:00 Intro\n15:30 Setup\n1:20:00 OOP</code>).
          </p>
          <textarea
            value={timestampsText}
            onChange={(e) => setTimestampsText(e.target.value)}
            placeholder="00:00 - Introduction&#10;14:25 - Environment Setup&#10;01:20:00 - OOP Principles"
            rows={4}
            className="w-full rounded-lg border border-surface-border-dark bg-surface-dark px-3 py-2 text-xs font-mono text-text-primary-dark placeholder-text-muted-dark/40 focus:border-amber-500 focus:outline-none"
          />
        </div>

        {error && <p className="text-xs text-red-400 font-medium">{error}</p>}

        {/* Submit Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-surface-border-dark">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-surface-border-dark px-3.5 py-1.5 text-xs font-medium text-text-muted-dark hover:bg-surface-dark hover:text-text-primary-dark"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-streak px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-streak/20 hover:bg-streak-hover transition-all"
          >
            Create Course
          </button>
        </div>
      </form>
    </Modal>
  );
};
