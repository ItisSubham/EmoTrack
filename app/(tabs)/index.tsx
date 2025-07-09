import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar, TrendingUp } from 'lucide-react-native';
import { MoodSelector } from '../../components/MoodSelector';
import { MoodCard } from '../../components/MoodCard';
import {
  saveMoodEntry,
  getMoodEntries,
  calculateMoodStats,
} from '../../utils/storage';
import { getTodayString, formatDisplayDate } from '../../utils/date';
import { MoodEntry, MoodStats, MOODS } from '../../types/mood';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [todaysMood, setTodaysMood] = useState<MoodEntry | null>(null);
  const [stats, setStats] = useState<MoodStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadTodaysMood = async () => {
    try {
      const entries = await getMoodEntries();
      const todayStr = getTodayString();
      const todayEntry = entries.find((entry) => entry.date === todayStr);

      if (todayEntry) {
        setTodaysMood(todayEntry);
        setSelectedMood(todayEntry.mood);
      }

      const moodStats = calculateMoodStats(entries);
      setStats(moodStats);
    } catch (error) {
      console.error("Error loading today's mood:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodaysMood();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadTodaysMood();
    }, [])
  );

  const handleMoodSelect = async (mood: number) => {
    try {
      const todayStr = getTodayString();
      const entry: MoodEntry = {
        date: todayStr,
        mood,
        emoji: MOODS[mood as keyof typeof MOODS].emoji,
        timestamp: Date.now(),
      };

      await saveMoodEntry(entry);
      setSelectedMood(mood);
      setTodaysMood(entry);

      // Reload stats
      const entries = await getMoodEntries();
      const moodStats = calculateMoodStats(entries);
      setStats(moodStats);

      // Show success feedback
      if (Platform.OS !== 'web') {
        // On mobile, could show a toast or subtle animation
      }
    } catch (error) {
      console.error('Error saving mood:', error);
      Alert.alert('Error', 'Failed to save your mood. Please try again.');
    }
  };

  const getMoodFeedback = () => {
    if (!selectedMood) return null;

    const moodData = MOODS[selectedMood as keyof typeof MOODS];
    const feedbackTexts = {
      1: "I'm sorry you're having a tough day. Remember, tomorrow is a new opportunity.",
      2: 'Hope things get better for you soon. Take care of yourself.',
      3: 'An okay day is still a day. Small steps forward count.',
      4: "Great to hear you're doing well! Keep up the positive energy.",
      5: 'Wonderful! Your positive energy is contagious. Keep shining!',
    };

    return (
      <View style={styles.feedbackContainer}>
        <Text style={styles.feedbackEmoji}>{moodData.emoji}</Text>
        <Text style={styles.feedbackText}>
          {feedbackTexts[selectedMood as keyof typeof feedbackTexts]}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>🌟 Today's Mood</Text>
            <Text style={styles.date}>
              {formatDisplayDate(getTodayString())}
            </Text>
          </View>

          <View style={styles.moodSection}>
            <MoodSelector
              selectedMood={selectedMood}
              onMoodSelect={handleMoodSelect}
            />
          </View>

          {selectedMood && (
            <View style={styles.feedbackSection}>{getMoodFeedback()}</View>
          )}

          {stats && (
            <View style={styles.statsSection}>
              <View style={styles.statsGrid}>
                <View style={styles.statRow}>
                  <MoodCard
                    title="Current Streak"
                    value={`${stats.currentStreak} ${
                      stats.currentStreak === 1 ? 'day' : 'days'
                    }`}
                    subtitle="Keep it up!"
                  />
                </View>
                <View style={styles.statRow}>
                  <View style={styles.statItem}>
                    <MoodCard
                      title="Total Entries"
                      value={stats.totalEntries}
                      subtitle="Moods logged"
                    />
                  </View>
                  <View style={styles.statItem}>
                    <MoodCard
                      title="Average"
                      value={
                        stats.averageMood > 0
                          ? `${stats.averageMood.toFixed(1)}/5`
                          : 'N/A'
                      }
                      subtitle="This month"
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/calendar')}
            >
              <Calendar size={20} color={COLORS.primary} />
              <Text style={styles.actionButtonText}>Calendar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/stats')}
            >
              <TrendingUp size={20} color={COLORS.primary} />
              <Text style={styles.actionButtonText}>View Stats</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 80 : SPACING.lg,
  },
  content: {
    padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.largeTitle,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  date: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  moodSection: {
    marginBottom: SPACING.xl,
  },
  feedbackSection: {
    marginBottom: SPACING.xl,
  },
  feedbackContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feedbackEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  feedbackText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  statsSection: {
    marginBottom: SPACING.xl,
  },
  statsGrid: {
    gap: SPACING.md,
  },
  statRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  statItem: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.primary,
  },
});
