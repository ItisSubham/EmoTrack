import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Text as SvgText, Circle } from 'react-native-svg';
import { getMoodEntries, calculateMoodStats } from '../../utils/storage';
import { MoodEntry, MoodStats, MOODS } from '../../types/mood';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import { MoodCard } from '../../components/MoodCard';
import {
  TrendingUp,
  ChartPie as PieChart,
  Calendar,
  Award,
} from 'lucide-react-native';

// Only import victory-native on mobile platforms
let CartesianChart: any, Line: any, Pie: any;
if (Platform.OS !== 'web') {
  try {
    const victoryNative = require('victory-native');
    CartesianChart = victoryNative.CartesianChart;
    Line = victoryNative.Line;
    Pie = victoryNative.Pie;
  } catch (error) {
    console.warn('Victory Native not available:', error);
  }
}

const screenWidth = Dimensions.get('window').width;

// Simple fallback chart component for web
const SimpleLineChart = ({
  data,
}: {
  data: Array<{ x: number; y: number; date: string }>;
}) => {
  if (data.length === 0) return null;

  const maxY = Math.max(...data.map((d) => d.y));
  const minY = Math.min(...data.map((d) => d.y));
  const range = maxY - minY || 1;

  return (
    <View style={styles.simpleChart}>
      <View style={styles.chartArea}>
        {data.map((point, index) => {
          const height = ((point.y - minY) / range) * 120 + 20;
          const left =
            (index / (data.length - 1)) * (screenWidth - SPACING.md * 4 - 40);

          return (
            <View
              key={index}
              style={[
                styles.chartPoint,
                {
                  left: left,
                  bottom: height,
                },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.chartLabels}>
        <Text style={styles.chartLabel}>1</Text>
        <Text style={styles.chartLabel}>2</Text>
        <Text style={styles.chartLabel}>3</Text>
        <Text style={styles.chartLabel}>4</Text>
        <Text style={styles.chartLabel}>5</Text>
      </View>
    </View>
  );
};

// Custom Pie Chart Component using SVG
const CustomPieChart = ({
  data,
}: {
  data: Array<{ value: number; label: string; color: string }>;
}) => {
  if (data.length === 0) return null;

  const size = 200;
  const radius = 80;
  const centerX = size / 2;
  const centerY = size / 2;

  const total = data.reduce((sum, item) => sum + item.value, 0);

  let currentAngle = -90; // Start from top

  const createPath = (startAngle: number, endAngle: number) => {
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);

    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  const getLabelPosition = (startAngle: number, endAngle: number) => {
    const midAngle = (startAngle + endAngle) / 2;
    const labelRadius = radius * 0.7;
    const x = centerX + labelRadius * Math.cos((midAngle * Math.PI) / 180);
    const y = centerY + labelRadius * Math.sin((midAngle * Math.PI) / 180);
    return { x, y };
  };

  return (
    <View style={{ alignItems: 'center', marginVertical: SPACING.md }}>
      <Svg height={size} width={size}>
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const angle = (360 * item.value) / total;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;

          const path = createPath(startAngle, endAngle);
          const labelPos = getLabelPosition(startAngle, endAngle);

          currentAngle = endAngle;

          return (
            <React.Fragment key={index}>
              <Path d={path} fill={item.color} stroke="white" strokeWidth={2} />
              {percentage > 8 && ( // Only show percentage if slice is big enough
                <SvgText
                  x={labelPos.x}
                  y={labelPos.y}
                  fontSize="12"
                  fontWeight="bold"
                  fill="white"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {Math.round(percentage)}%
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
        <Circle
          cx={centerX}
          cy={centerY}
          r={30}
          fill={COLORS.cardBackground}
          stroke={COLORS.border}
          strokeWidth={2}
        />
        <SvgText
          x={centerX}
          y={centerY}
          fontSize="14"
          fontWeight="bold"
          fill={COLORS.textPrimary}
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          Moods
        </SvgText>
      </Svg>
    </View>
  );
};

export default function StatsScreen() {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [stats, setStats] = useState<MoodStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const entries = await getMoodEntries();
      setMoodEntries(entries);
      const moodStats = calculateMoodStats(entries);
      setStats(moodStats);
    } catch (error) {
      console.error('Error loading mood data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const getChartData = () => {
    if (moodEntries.length === 0) return [];

    const sortedEntries = [...moodEntries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return sortedEntries.map((entry, index) => ({
      x: index + 1,
      y: entry.mood,
      date: entry.date,
    }));
  };

  const getPieData = () => {
    if (!stats?.moodDistribution) return [];

    return Object.entries(stats.moodDistribution).map(([mood, count]) => ({
      value: count,
      label: MOODS[parseInt(mood) as keyof typeof MOODS].label,
      color: getMoodColor(parseInt(mood)),
    }));
  };

  const getMoodColor = (mood: number) => {
    const colors = {
      1: '#FF3B30',
      2: '#FF9500',
      3: '#FFCC00',
      4: '#34C759',
      5: '#007AFF',
    };
    return colors[mood as keyof typeof colors] || COLORS.primary;
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

  if (!stats || moodEntries.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Data Yet</Text>
          <Text style={styles.emptyText}>
            Start logging your moods to see beautiful statistics and trends!
          </Text>
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
            <Text style={styles.title}>📊 Your Mood Journey</Text>
            <Text style={styles.subtitle}>
              ✨ Insights from {stats.totalEntries} mood{' '}
              {stats.totalEntries === 1 ? 'entry' : 'entries'}
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <MoodCard
                  title="Average Mood"
                  value={`${stats.averageMood.toFixed(1)}/5`}
                  subtitle="Overall rating"
                  icon={<TrendingUp size={16} color={COLORS.primary} />}
                />
              </View>
              <View style={styles.statItem}>
                <MoodCard
                  title="Current Streak"
                  value={`${stats.currentStreak} ${
                    stats.currentStreak === 1 ? 'day' : 'days'
                  }`}
                  subtitle="Keep going!"
                  icon={<Calendar size={16} color={COLORS.success} />}
                />
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <MoodCard
                  title="Longest Streak"
                  value={`${stats.longestStreak} ${
                    stats.longestStreak === 1 ? 'day' : 'days'
                  }`}
                  subtitle="Personal best"
                  icon={<Award size={16} color={COLORS.warning} />}
                />
              </View>
              <View style={styles.statItem}>
                <MoodCard
                  title="Total Entries"
                  value={stats.totalEntries}
                  subtitle="Moods logged"
                  icon={<PieChart size={16} color={COLORS.primary} />}
                />
              </View>
            </View>
          </View>

          {/* Mood Trend Chart */}
          {moodEntries.length > 1 && (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>📈 Mood Trend</Text>
              <View
                style={{ height: 200, width: screenWidth - SPACING.md * 2 }}
              >
                {Platform.OS !== 'web' && CartesianChart ? (
                  <CartesianChart
                    data={getChartData()}
                    xKey="x"
                    yKeys={['y']}
                    domainPadding={{ left: 20, right: 20, top: 20, bottom: 20 }}
                  >
                    {({ points }: { points: any }) => (
                      <Line
                        points={points.y}
                        color={COLORS.primary}
                        strokeWidth={3}
                        animate={{ type: 'timing', duration: 1000 }}
                      />
                    )}
                  </CartesianChart>
                ) : (
                  <SimpleLineChart data={getChartData()} />
                )}
              </View>
            </View>
          )}

          {/* Mood Distribution Chart */}
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>🥧 Mood Distribution</Text>
            <View
              style={{
                width: screenWidth - SPACING.md * 2,
                alignItems: 'center',
              }}
            >
              {getPieData().length > 0 ? (
                <>
                  <CustomPieChart data={getPieData()} />
                  {/* Legend */}
                  <View style={styles.legendContainer}>
                    {getPieData().map((data, index) => {
                      const total = getPieData().reduce(
                        (sum, item) => sum + item.value,
                        0
                      );
                      const percentage = ((data.value / total) * 100).toFixed(
                        1
                      );

                      return (
                        <View key={index} style={styles.legendItem}>
                          <View
                            style={[
                              styles.legendColor,
                              { backgroundColor: data.color },
                            ]}
                          />
                          <Text style={styles.legendText}>
                            {data.label} ({data.value} - {percentage}%)
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              ) : (
                <View style={styles.pieChartPlaceholder}>
                  <Text style={styles.chartPlaceholder}>
                    No mood data available
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.moodBreakdown}>
            <Text style={styles.sectionTitle}>📊 Mood Breakdown</Text>
            {Object.entries(stats.moodDistribution).map(([mood, count]) => {
              const percentage = (count / stats.totalEntries) * 100;
              const moodData = MOODS[parseInt(mood) as keyof typeof MOODS];

              return (
                <View key={mood} style={styles.moodBreakdownItem}>
                  <View style={styles.moodBreakdownLeft}>
                    <Text style={styles.moodBreakdownEmoji}>
                      {moodData.emoji}
                    </Text>
                    <Text style={styles.moodBreakdownLabel}>
                      {moodData.label}
                    </Text>
                  </View>
                  <View style={styles.moodBreakdownRight}>
                    <View style={styles.moodBreakdownBar}>
                      <View
                        style={[
                          styles.moodBreakdownFill,
                          {
                            width: `${percentage}%`,
                            backgroundColor: getMoodColor(parseInt(mood)),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.moodBreakdownCount}>
                      {count} ({percentage.toFixed(1)}%)
                    </Text>
                  </View>
                </View>
              );
            })}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.title1,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
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
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  statsGrid: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  statRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  statItem: {
    flex: 1,
  },
  chartContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  chartTitle: {
    ...TYPOGRAPHY.title3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  chartPlaceholder: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    padding: SPACING.lg,
  },
  pieChartPlaceholder: {
    height: 150,
    width: 200,
    borderRadius: 100,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    marginBottom: SPACING.md,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
    marginVertical: SPACING.xs / 2,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.xs,
  },
  legendText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textPrimary,
  },
  simpleChart: {
    height: 180,
    position: 'relative',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  chartPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    transform: [{ translateX: -4 }, { translateY: -4 }],
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    marginTop: SPACING.xs,
  },
  chartLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    ...TYPOGRAPHY.title3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  moodBreakdown: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moodBreakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  moodBreakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  moodBreakdownEmoji: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  moodBreakdownLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
  },
  moodBreakdownRight: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodBreakdownBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    marginRight: SPACING.sm,
    overflow: 'hidden',
  },
  moodBreakdownFill: {
    height: '100%',
    borderRadius: 4,
  },
  moodBreakdownCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    minWidth: 60,
    textAlign: 'right',
  },
});
