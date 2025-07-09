import AsyncStorage from '@react-native-async-storage/async-storage';
import { MoodEntry, MoodStats } from '../types/mood';

const MOOD_STORAGE_KEY = '@mood_tracker_entries';

export const saveMoodEntry = async (entry: MoodEntry): Promise<void> => {
  try {
    const existingEntries = await getMoodEntries();
    const updatedEntries = existingEntries.filter((e) => e.date !== entry.date);
    updatedEntries.push(entry);
    updatedEntries.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    await AsyncStorage.setItem(
      MOOD_STORAGE_KEY,
      JSON.stringify(updatedEntries)
    );
  } catch (error) {
    console.error('Error saving mood entry:', error);
    throw error;
  }
};

export const getMoodEntries = async (): Promise<MoodEntry[]> => {
  try {
    const entriesJson = await AsyncStorage.getItem(MOOD_STORAGE_KEY);
    return entriesJson ? JSON.parse(entriesJson) : [];
  } catch (error) {
    console.error('Error getting mood entries:', error);
    return [];
  }
};

export const getMoodForDate = async (
  date: string
): Promise<MoodEntry | null> => {
  try {
    const entries = await getMoodEntries();
    return entries.find((entry) => entry.date === date) || null;
  } catch (error) {
    console.error('Error getting mood for date:', error);
    return null;
  }
};

export const calculateMoodStats = (entries: MoodEntry[]): MoodStats => {
  if (entries.length === 0) {
    return {
      averageMood: 0,
      totalEntries: 0,
      currentStreak: 0,
      longestStreak: 0,
      moodDistribution: {},
    };
  }

  const totalMood = entries.reduce((sum, entry) => sum + entry.mood, 0);
  const averageMood = totalMood / entries.length;

  const moodDistribution: { [key: number]: number } = {};
  entries.forEach((entry) => {
    moodDistribution[entry.mood] = (moodDistribution[entry.mood] || 0) + 1;
  });

  // Calculate streaks
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let currentStreak = 0;
  let longestStreak = 0;

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  // Calculate current streak
  if (sortedEntries.length > 0) {
    const latestEntry = sortedEntries[0];

    // Only count current streak if today or yesterday has an entry
    if (latestEntry.date === todayStr || latestEntry.date === yesterdayStr) {
      let currentDate = new Date(latestEntry.date);

      for (const entry of sortedEntries) {
        const entryDate = new Date(entry.date);
        const expectedDateStr = currentDate.toISOString().split('T')[0];

        if (entry.date === expectedDateStr) {
          currentStreak++;
          // Move to previous day
          currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
        } else {
          // Check if there's a gap - if so, break the streak
          const daysDiff = Math.floor(
            (currentDate.getTime() - entryDate.getTime()) /
              (24 * 60 * 60 * 1000)
          );
          if (daysDiff > 0) {
            break;
          }
        }
      }
    }
  }

  // Calculate longest streak
  if (entries.length > 0) {
    const chronologicalEntries = [...entries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let tempStreak = 1;
    longestStreak = 1;

    for (let i = 1; i < chronologicalEntries.length; i++) {
      const currentDate = new Date(chronologicalEntries[i].date);
      const previousDate = new Date(chronologicalEntries[i - 1].date);

      const daysDiff = Math.floor(
        (currentDate.getTime() - previousDate.getTime()) / (24 * 60 * 60 * 1000)
      );

      if (daysDiff === 1) {
        // Consecutive day
        tempStreak++;
      } else {
        // Gap in dates, reset streak
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);
  }

  return {
    averageMood,
    totalEntries: entries.length,
    currentStreak,
    longestStreak,
    moodDistribution,
  };
};
