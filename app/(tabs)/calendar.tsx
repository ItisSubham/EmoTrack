import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar as RNCalendar, DateData } from 'react-native-calendars';
import { getMoodEntries, saveMoodEntry } from '../../utils/storage';
import { MoodEntry, MOODS } from '../../types/mood';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import { MoodSelector } from '../../components/MoodSelector';
import { formatDisplayDate } from '../../utils/date';

export default function CalendarScreen() {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMoodEntries = async () => {
    try {
      const entries = await getMoodEntries();
      setMoodEntries(entries);
    } catch (error) {
      console.error('Error loading mood entries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMoodEntries();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadMoodEntries();
    }, [])
  );

  const getMarkedDates = () => {
    const marked: { [key: string]: any } = {};

    moodEntries.forEach((entry) => {
      const moodData = MOODS[entry.mood as keyof typeof MOODS];
      marked[entry.date] = {
        customStyles: {
          container: {
            backgroundColor: COLORS.primary,
            borderRadius: 6,
          },
          text: {
            color: COLORS.cardBackground,
            fontWeight: 'bold',
          },
        },
      };
    });

    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: COLORS.primary,
      };
    }

    return marked;
  };

  const handleDatePress = (day: DateData) => {
    setSelectedDate(day.dateString);
    const entry = moodEntries.find((e) => e.date === day.dateString);
    setSelectedMood(entry?.mood || null);
  };

  const handleMoodSelect = async (mood: number) => {
    if (!selectedDate) return;

    try {
      const entry: MoodEntry = {
        date: selectedDate,
        mood,
        emoji: MOODS[mood as keyof typeof MOODS].emoji,
        timestamp: Date.now(),
      };

      await saveMoodEntry(entry);
      setSelectedMood(mood);
      await loadMoodEntries();
    } catch (error) {
      console.error('Error saving mood:', error);
      Alert.alert('Error', 'Failed to save your mood. Please try again.');
    }
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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>📅 Mood Calendar</Text>
          <Text style={styles.subtitle}>
            Tap a date to view or add your mood
          </Text>
        </View>

        <View style={styles.calendarContainer}>
          <RNCalendar
            onDayPress={handleDatePress}
            markedDates={getMarkedDates()}
            markingType="custom"
            theme={{
              backgroundColor: COLORS.cardBackground,
              calendarBackground: COLORS.cardBackground,
              textSectionTitleColor: COLORS.textSecondary,
              selectedDayBackgroundColor: COLORS.primary,
              selectedDayTextColor: COLORS.cardBackground,
              todayTextColor: COLORS.primary,
              dayTextColor: COLORS.textPrimary,
              textDisabledColor: COLORS.textSecondary,
              dotColor: COLORS.primary,
              selectedDotColor: COLORS.cardBackground,
              arrowColor: COLORS.primary,
              monthTextColor: COLORS.textPrimary,
              indicatorColor: COLORS.primary,
              textDayFontFamily: 'Inter-Regular',
              textMonthFontFamily: 'Inter-SemiBold',
              textDayHeaderFontFamily: 'Inter-Regular',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
            style={styles.calendar}
          />
        </View>

        {selectedDate && (
          <View style={styles.selectedDateContainer}>
            <Text style={styles.selectedDateTitle}>
              🗓️ {formatDisplayDate(selectedDate)}
            </Text>
            <View style={styles.moodSelectorContainer}>
              <MoodSelector
                selectedMood={selectedMood}
                onMoodSelect={handleMoodSelect}
              />
            </View>
            {selectedMood && (
              <View style={styles.currentMoodContainer}>
                <Text style={styles.currentMoodText}>
                  ✨ Your mood:{' '}
                  {MOODS[selectedMood as keyof typeof MOODS].emoji}{' '}
                  {MOODS[selectedMood as keyof typeof MOODS].label}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>🎯 Mood Scale</Text>
          <View style={styles.legendItems}>
            {Object.entries(MOODS).map(([mood, data]) => (
              <View key={mood} style={styles.legendItem}>
                <Text style={styles.legendEmoji}>{data.emoji}</Text>
                <Text style={styles.legendLabel}>{data.label}</Text>
              </View>
            ))}
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
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
    paddingTop: SPACING.sm,
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
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  calendarContainer: {
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calendar: {
    borderRadius: RADIUS.md,
  },
  selectedDateContainer: {
    margin: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.md,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedDateTitle: {
    ...TYPOGRAPHY.title3,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  moodSelectorContainer: {
    marginBottom: SPACING.md,
  },
  currentMoodContainer: {
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
  },
  currentMoodText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
  },
  legendContainer: {
    margin: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.md,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTitle: {
    ...TYPOGRAPHY.title3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  legendItem: {
    alignItems: 'center',
    padding: SPACING.xs,
  },
  legendEmoji: {
    fontSize: 20,
    marginBottom: SPACING.xs,
  },
  legendLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
});
