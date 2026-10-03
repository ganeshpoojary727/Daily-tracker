# Course Tracker & Video Learning Hub Design Specification

## Overview

The **Course Tracker & Video Learning Hub** adds a first-class learning system to Daily Tracker, designed specifically for long-form engineering courses (YouTube mega-tutorials, YouTube playlists, Udemy, Coursera, and custom web courses).

Just like the DSA Practice Queue systematically turns a problem sheet into a self-advancing queue, the Course Hub turns long video courses into structured, trackable curriculums with auto-saved timestamps, chapter completion checklists, and daily streak integration.

---

## 1. Key Features & User Experience

### 1.1 Course Switcher & Management
- Tabbed pill-bar at the top (mirroring `SheetSwitcher.tsx`) allowing instant switching between active courses (e.g., `Telusko Java & Spring`, `Udemy: Microservices Architecture`, `+ Add Course`).
- Each course displays its platform badge (YouTube, Udemy, Coursera, Web), completion percentage, and last studied timestamp.

### 1.2 Hybrid Video Player (YouTube & External Platforms)
- **YouTube In-App Playback (`youtube-video` & `youtube-playlist`):**
  - Uses the official YouTube IFrame API to embed the video cleanly in the dark/amber Daily Tracker theme.
  - Automatically tracks playback time every 3 seconds while playing.
  - Saves `lastWatchedSeconds` to `localStorage` (and syncs to GitHub Gist).
  - Prominent **"Resume at [HH:MM:SS]"** button to jump directly to where the user left off.
  - Clicking any chapter in the syllabus immediately seeks the video player to that timestamp (`player.seekTo(seconds, true)`).
  - Quick-action **"Open on YouTube ↗"** button opens the exact timestamp in a new tab if the user prefers watching full-screen in YouTube.
- **Udemy, Coursera & Custom Web Courses (`udemy`, `coursera`, `custom`):**
  - Displays a rich course banner, external quick-launch button, overall progress ring, and an interactive lecture/chapter checklist.
  - Allows manual time or lecture progress tracking.

### 1.3 Smart Course Importer Modal
- **One-Click URL Parser:**
  - Pasting a YouTube video or playlist URL automatically extracts the Video ID or Playlist ID.
  - Queries YouTube's public oEmbed endpoint (`https://www.youtube.com/oembed?url=...&format=json`) to automatically retrieve the video title, author/channel, and thumbnail with zero API keys required.
- **Smart Timestamp & Chapter Parser:**
  - A textarea where users can paste video descriptions or timestamps (e.g., from YouTube video descriptions or comments).
  - Supports formats:
    - `00:00 Introduction`
    - `14:25 - Environment Setup`
    - `01:45:10 Chapter 5: Spring Boot & REST APIs`
  - Parses them into ordered `CourseChapter` objects with calculated start times and durations.
- **Linked Category Picker:**
  - Select which Daily Checklist category (e.g., "Study", "Java", or "LeetCode") should receive daily progress when chapters are completed.

### 1.4 Interactive Syllabus & Chapter Checklist
- Collapsible section list displaying:
  - Chapter title
  - Start timestamp (`HH:MM:SS`)
  - Checkbox to toggle completed status
  - Active playing indicator (highlights the chapter currently being played)
  - Notes drawer per chapter to jot down quick takeaways or code snippets.
- Completion ring and progress bar showing `X of Y Chapters Finished (Z%)`.

### 1.5 Daily Checklist & Streak Integration
- Marking a chapter as completed automatically increments the linked category count for today in `useTaskStore` (via `incrementTaskCount(todayStr, course.linkedCategoryId, 1)`).
- This ensures study time directly fuels the user's daily checklist and 8+ day streak.

---

## 2. Architecture & Data Structures

### 2.1 Type Definitions (`src/types/index.ts`)

```typescript
export type CoursePlatform = 'youtube-video' | 'youtube-playlist' | 'udemy' | 'coursera' | 'custom';

export interface CourseChapter {
  id: string; // unique chapter id e.g. "c1"
  title: string;
  timestampSeconds: number; // e.g. 3600 for 1:00:00
  durationSeconds?: number;
  completed: boolean;
  completedAt?: string; // YYYY-MM-DD
  notes?: string;
}

export interface Course {
  id: string; // unique slug e.g. "telusko-java-spring-microservices"
  title: string;
  instructor?: string;
  platform: CoursePlatform;
  url: string;
  videoId?: string; // YouTube 11-char video ID if applicable
  playlistId?: string; // YouTube playlist ID if applicable
  thumbnail?: string;
  lastWatchedSeconds: number;
  totalDurationSeconds: number;
  linkedCategoryId: string; // e.g. "study" or "programming"
  chapters: CourseChapter[];
  notes?: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

export interface CourseStoreState {
  courses: Record<string, Course>;
  activeCourseId: string;
  courseOrder: string[];

  // Actions
  setActiveCourseId: (courseId: string) => void;
  addCourse: (course: Course) => void;
  updateCourse: (courseId: string, updates: Partial<Course>) => void;
  deleteCourse: (courseId: string) => void;
  updatePlaybackProgress: (courseId: string, seconds: number, totalDurationSeconds?: number) => void;
  toggleChapterCompleted: (courseId: string, chapterId: string, dateStr?: string) => void;
  importChaptersFromText: (courseId: string, rawText: string) => void;
  setCourseNotes: (courseId: string, notes: string) => void;
}
```

### 2.2 ViewTab Extension
Update `ViewTab` union:
```typescript
export type ViewTab = 'checklist' | 'calendar' | 'goals' | 'practice' | 'courses' | 'dashboard' | 'settings';
```

---

## 3. Component Hierarchy

```
src/components/courses/
├── CourseHubView.tsx            // Main container for the Courses tab
├── CourseSwitcher.tsx           // Pill-bar for switching active courses + Add Course button
├── VideoPlayerCard.tsx          // Embedded YouTube IFrame player with live sync and resume controls
├── ExternalCourseCard.tsx       // Clean banner & launcher for Udemy/Coursera/Web courses
├── ChapterList.tsx              // Syllabus checklist with search, timestamps, active track, checkmarks
├── AddCourseModal.tsx           // Smart import modal (URL parsing, oEmbed, timestamp regex parser)
└── ChapterNotesModal.tsx        // Quick markdown / notes modal for a lesson
```

---

## 4. Default Seed Course

The app will ship with a high-value default course pre-loaded:
- **Title:** Complete Java, Spring, and Microservices Course
- **Instructor:** Telusko
- **Platform:** `youtube-video`
- **Video ID:** `4XTsAAHW_Tc`
- **URL:** `https://youtu.be/4XTsAAHW_Tc`
- **Chapters:** Pre-populated with core milestones (Java Basics, OOP, Collections, Multithreading, Spring Core, Spring Boot, Microservices).

---

## 5. Storage & Synchronization

- **LocalStorage Key:** `dt_courses_v1`
- **GitHub Sync Integration:**
  - Update `GistSyncData` in `src/lib/githubSync.ts` to include optional `courses?: { courses: Record<string, Course>, activeCourseId: string, courseOrder: string[] }`.
  - Update `mergeSyncData()` in `src/lib/githubSyncMerge.ts` to non-destructively merge courses across devices:
    - Unions courses by `id`.
    - Preserves whichever `lastWatchedSeconds` is greater.
    - Unions completed chapters across local and remote.
