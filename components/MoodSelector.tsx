import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MOODS } from '../types/mood';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';

interface MoodSelectorProps {
  selectedMood: number | null;
  onMoodSelect: (mood: number) => void;
  disabled?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const MoodSelector: React.FC<MoodSelectorProps> = ({
  selectedMood,
  onMoodSelect,
  disabled = false,
}) => {
  const triggerHaptics = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const MoodButton: React.FC<{ mood: number }> = ({ mood }) => {
    const scale = useSharedValue(1);
    const isSelected = selectedMood === mood;

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
      };
    });

    const handlePress = () => {
      if (disabled) return;
      
      scale.value = withSpring(1.2, { damping: 10 }, () => {
        scale.value = withSpring(1, { damping: 8 });
      });
      
      runOnJS(triggerHaptics)();
      runOnJS(onMoodSelect)(mood);
    };

    return (
      <AnimatedTouchable
        style={[
          styles.moodButton,
          isSelected && styles.selectedMoodButton,
          animatedStyle,
        ]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={styles.moodEmoji}>{MOODS[mood as keyof typeof MOODS].emoji}</Text>
        <Text style={[styles.moodLabel, isSelected && styles.selectedMoodLabel]}>
          {MOODS[mood as keyof typeof MOODS].label}
        </Text>
      </AnimatedTouchable>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How are you feeling today?</Text>
      <View style={styles.moodContainer}>
        {Object.keys(MOODS).map((mood) => (
          <MoodButton key={mood} mood={parseInt(mood)} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.title2,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  moodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  moodButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    minWidth: 80,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedMoodButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  moodLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  selectedMoodLabel: {
    color: COLORS.cardBackground,
    fontFamily: 'Inter-SemiBold',
  },
});