export interface MoodEntry {
  date: string; // YYYY-MM-DD format
  mood: number; // 1-5 scale
  emoji: string; // emoji representation
  timestamp: number; // Unix timestamp
}

export interface MoodStats {
  averageMood: number;
  totalEntries: number;
  currentStreak: number;
  longestStreak: number;
  moodDistribution: { [key: number]: number };
}

export const MOODS = {
  1: { emoji: '😢', label: 'Terrible' },
  2: { emoji: '😔', label: 'Not Great' },
  3: { emoji: '😐', label: 'Okay' },
  4: { emoji: '😊', label: 'Good' },
  5: { emoji: '😄', label: 'Amazing' },
} as const;