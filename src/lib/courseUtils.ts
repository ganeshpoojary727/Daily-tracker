import { CourseChapter } from '../types';

/**
 * Extracts video ID and optional playlist ID from various YouTube URL formats.
 * e.g. youtu.be/xxx, youtube.com/watch?v=xxx, youtube.com/embed/xxx, etc.
 */
export function extractYouTubeId(url: string): { videoId?: string; playlistId?: string } {
  if (!url) return {};
  const trimmed = url.trim();
  let videoId: string | undefined;
  let playlistId: string | undefined;

  const listMatch = trimmed.match(/[?&]list=([^#&?]+)/);
  if (listMatch) playlistId = listMatch[1];

  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) videoId = shortMatch[1];

  const vMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (vMatch) videoId = vMatch[1];

  const embedMatch = trimmed.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) videoId = embedMatch[1];

  return { videoId, playlistId };
}

/**
 * Parses timestamp string "HH:MM:SS" or "MM:SS" or "SS" into total seconds.
 */
export function parseTimestampStringToSeconds(str: string): number {
  if (!str) return 0;
  const parts = str.trim().split(':').map((p) => parseInt(p, 10));
  if (parts.some((n) => isNaN(n))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return 0;
}

/**
 * Formats total seconds into "HH:MM:SS" or "MM:SS".
 */
export function formatSecondsToTimestamp(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (hrs > 0) return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Parses a block of text containing timestamps and titles into structured CourseChapter array.
 * Examples of matched lines:
 *   "00:00 Introduction"
 *   "15:30 - Setting up JDK"
 *   "01:25:10 Section 2: OOP Principles"
 *   "[02:40:15] Spring Boot Basics"
 */
export function parseTimestampsFromDescription(text: string): CourseChapter[] {
  if (!text) return [];
  const lines = text.split('\n');
  const chapters: CourseChapter[] = [];

  // Match optional brackets, timestamp, separator, and title
  const regex = /(?:^|\s)\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*(?:[-–—:]\s*)?(.*)$/;

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const match = trimmed.match(regex);
    if (match) {
      const timeStr = match[1];
      let remainder = match[2]?.trim() || `Chapter ${chapters.length + 1}`;
      let title = remainder;
      let description: string | undefined;
      let importance: string | undefined;

      // Check if remainder is tab-separated (e.g. Concept \t What is taught \t Importance)
      if (remainder.includes('\t')) {
        const parts = remainder.split('\t').map((p) => p.trim()).filter(Boolean);
        if (parts.length > 0) title = parts[0];
        if (parts.length > 1) description = parts[1];
        if (parts.length > 2) importance = parts[2];
      } else {
        // Extract importance tag if embedded in title (e.g. ⭐ High, 🟡 Medium, 🔗 Prerequisite)
        const impMatch = title.match(/(⭐\s*High(?:\s*🎯)?|🟡\s*Medium|🔗\s*Prerequisite|🎯\s*Spring\s*Boot)/i);
        if (impMatch) {
          importance = impMatch[0].trim();
          title = title.replace(impMatch[0], '').trim();
        }
      }

      title = title.replace(/^[-–—:\s]+/, '').replace(/[-–—:\s]+$/, '').trim();
      if (!title) title = `Chapter ${chapters.length + 1}`;

      const timestampSeconds = parseTimestampStringToSeconds(timeStr);
      chapters.push({
        id: `ch-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
        title,
        description,
        importance,
        timestampSeconds,
        completed: false,
      });
    }
  });

  // Sort by timestamp
  chapters.sort((a, b) => a.timestampSeconds - b.timestampSeconds);

  // Compute duration between chapters
  for (let i = 0; i < chapters.length; i++) {
    if (i < chapters.length - 1) {
      chapters[i].durationSeconds = chapters[i + 1].timestampSeconds - chapters[i].timestampSeconds;
    }
  }

  return chapters;
}

/**
 * Fetches public YouTube video metadata via CORS-friendly oEmbed endpoint.
 * Zero API keys or authentication required.
 */
export async function fetchYouTubeOEmbed(url: string): Promise<{ title?: string; author?: string; thumbnail?: string } | null> {
  try {
    const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(endpoint);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title,
      author: data.author_name,
      thumbnail: data.thumbnail_url,
    };
  } catch {
    return null;
  }
}
