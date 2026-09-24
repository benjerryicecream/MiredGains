import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { X, Scale, Dumbbell, TrendingUp, Award, Layers } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import C from '../constants/colors';
import { useApp } from '../context/AppContext';
import ProgressChart, { ChartDataPoint, ChartSeries } from './ProgressChart';
import { BodyweightEntry, Workout, Exercise } from '../types';

interface ProgressChartModalProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: 'bodyweight' | 'exercise' | 'combined';
  initialExerciseId?: string;
}

type RangeOption = '1M' | '3M' | '6M' | 'ALL';
type ExerciseMetric = 'maxWeight' | 'totalVolume';

const EXERCISE_SERIES_COLORS = [
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#ef4444', // Red
  '#84cc16', // Lime
];

function formatDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  } catch {
    return dateStr;
  }
}

function formatDateFull(dateStr: string): string {
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function ProgressChartModal({
  visible,
  onClose,
  initialTab = 'bodyweight',
  initialExerciseId,
}: ProgressChartModalProps) {
  const insets = useSafeAreaInsets();
  const { bodyweights, workouts, exercises, unit } = useApp();

  const [activeTab, setActiveTab] = useState<'bodyweight' | 'exercise' | 'combined'>(initialTab);
  const [range, setRange] = useState<RangeOption>('ALL');
  const [selectedExId, setSelectedExId] = useState<string>('');
  const [selectedExIdsCombined, setSelectedExIdsCombined] = useState<string[]>([]);
  const [exerciseMetric, setExerciseMetric] = useState<ExerciseMetric>('maxWeight');

  // Update selected exercise when modal opens or initialExerciseId changes
  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
      if (initialExerciseId) {
        setSelectedExId(initialExerciseId);
        setSelectedExIdsCombined([initialExerciseId]);
      } else if (exercises.length > 0) {
        if (!selectedExId) setSelectedExId(exercises[0].id);
        if (selectedExIdsCombined.length === 0) setSelectedExIdsCombined([exercises[0].id]);
      }
    }
  }, [visible, initialTab, initialExerciseId, exercises]);

  // Date filtering threshold
  const cutoffDate = useMemo(() => {
    if (range === 'ALL') return null;
    const now = new Date();
    const days = range === '1M' ? 30 : range === '3M' ? 90 : 180;
    now.setDate(now.getDate() - days);
    return now;
  }, [range]);

  // ─── Body Weight Chart Data ──────────────────────────────────────────
  const { bwChartData, bwStats } = useMemo(() => {
    const sorted = [...bodyweights].sort((a, b) => a.date.localeCompare(b.date));

    const filtered = cutoffDate
      ? sorted.filter((b) => new Date(`${b.date}T00:00:00`) >= cutoffDate)
      : sorted;

    const chartPoints: ChartDataPoint[] = filtered.map((b) => ({
      dateStr: formatDateFull(b.date),
      label: formatDateLabel(b.date),
      value: b.weight,
    }));

    let stats = {
      latest: 0,
      min: 0,
      max: 0,
      change: 0,
      count: filtered.length,
    };

    if (filtered.length > 0) {
      const weights = filtered.map((f) => f.weight);
      const latest = filtered[filtered.length - 1].weight;
      const initial = filtered[0].weight;
      stats = {
        latest,
        min: Math.min(...weights),
        max: Math.max(...weights),
        change: Number((latest - initial).toFixed(1)),
        count: filtered.length,
      };
    }

    return { bwChartData: chartPoints, bwStats: stats };
  }, [bodyweights, cutoffDate]);

  // Helper function to extract data points for a specific exercise
  const extractExerciseData = (exId: string): ChartDataPoint[] => {
    const ex = exercises.find((e) => e.id === exId);
    if (!ex) return [];

    const sortedWorkouts = [...workouts].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const points: ChartDataPoint[] = [];

    for (const w of sortedWorkouts) {
      const wDate = new Date(w.date);
      if (cutoffDate && wDate < cutoffDate) continue;

      const exEntry = w.exercises.find(
        (e) => e.exerciseId === ex.id || e.exerciseName === ex.name
      );

      if (!exEntry || !exEntry.sets || exEntry.sets.length === 0) continue;

      const completedSets = exEntry.sets.filter((s) => s.completed || s.weight > 0);
      if (completedSets.length === 0) continue;

      let value = 0;
      let subtext = '';

      if (exerciseMetric === 'maxWeight') {
        const topWeightSet = [...completedSets].sort((a, b) => b.weight - a.weight)[0];
        value = topWeightSet.weight;
        subtext = `Top Set: ${topWeightSet.weight} ${unit} × ${topWeightSet.reps} reps`;
      } else {
        value = completedSets.reduce((sum, s) => sum + s.weight * s.reps, 0);
        subtext = `Volume: ${value.toLocaleString()} ${unit} (${completedSets.length} sets)`;
      }

      points.push({
        dateStr: formatDateFull(w.date),
        label: formatDateLabel(w.date),
        value,
        subtext,
      });
    }

    return points;
  };

  // ─── Single Exercise Progress Chart Data ──────────────────────────────
  const currentExercise = useMemo(
    () => exercises.find((e) => e.id === selectedExId) || exercises[0],
    [exercises, selectedExId]
  );

  const { exChartData, exStats } = useMemo(() => {
    if (!currentExercise) return { exChartData: [], exStats: { pr: 0, latest: 0, change: 0, count: 0 } };

    const points = extractExerciseData(currentExercise.id);

    let stats = { pr: 0, latest: 0, change: 0, count: points.length };
    if (points.length > 0) {
      const values = points.map((p) => p.value);
      const pr = Math.max(...values);
      const latest = points[points.length - 1].value;
      const initial = points[0].value;
      stats = {
        pr,
        latest,
        change: Number((latest - initial).toFixed(1)),
        count: points.length,
      };
    }

    return { exChartData: points, exStats: stats };
  }, [workouts, currentExercise, cutoffDate, exerciseMetric, unit, exercises]);

  // ─── Combined (Body Weight vs. Exercises) Series Data ─────────────────
  const combinedSeries = useMemo(() => {
    const seriesList: ChartSeries[] = [];

    // Always include Body Weight as first series
    if (bwChartData.length > 0) {
      seriesList.push({
        id: 'bodyweight',
        name: 'Body Weight',
        color: C.emerald,
        data: bwChartData,
      });
    }

    // Add selected exercises
    selectedExIdsCombined.forEach((exId, idx) => {
      const ex = exercises.find((e) => e.id === exId);
      if (!ex) return;
      const points = extractExerciseData(ex.id);
      if (points.length > 0) {
        const color = EXERCISE_SERIES_COLORS[idx % EXERCISE_SERIES_COLORS.length];
        seriesList.push({
          id: ex.id,
          name: ex.name,
          color,
          data: points,
        });
      }
    });

    return seriesList;
  }, [bwChartData, selectedExIdsCombined, exercises, workouts, cutoffDate, exerciseMetric, unit]);

  const toggleCombinedExercise = (exId: string) => {
    setSelectedExIdsCombined((prev) =>
      prev.includes(exId) ? prev.filter((id) => id !== exId) : [...prev, exId]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Modal Header */}
        <View style={styles.titleRow}>
          <View style={styles.titleWithIcon}>
            <TrendingUp size={22} color={C.emerald} strokeWidth={2.5} />
            <Text style={styles.title}>Progress Charts</Text>
          </View>
          <Pressable
            onPress={onClose}
            android_ripple={{ color: C.ripple, radius: 20, borderless: true }}
            style={styles.closeBtn}
          >
            <X size={20} color={C.textSecondary} />
          </Pressable>
        </View>

        {/* Tab Switcher: Bodyweight | Exercise | Combined */}
        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tab, activeTab === 'bodyweight' && styles.tabActive]}
            onPress={() => setActiveTab('bodyweight')}
            android_ripple={{ color: C.ripple }}
          >
            <Scale size={14} color={activeTab === 'bodyweight' ? C.emerald : C.textMuted} />
            <Text style={[styles.tabText, activeTab === 'bodyweight' && styles.tabTextActive]}>
              Body Weight
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'exercise' && styles.tabActive]}
            onPress={() => setActiveTab('exercise')}
            android_ripple={{ color: C.ripple }}
          >
            <Dumbbell size={14} color={activeTab === 'exercise' ? C.emerald : C.textMuted} />
            <Text style={[styles.tabText, activeTab === 'exercise' && styles.tabTextActive]}>
              Exercise
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'combined' && styles.tabActive]}
            onPress={() => setActiveTab('combined')}
            android_ripple={{ color: C.ripple }}
          >
            <Layers size={14} color={activeTab === 'combined' ? C.emerald : C.textMuted} />
            <Text style={[styles.tabText, activeTab === 'combined' && styles.tabTextActive]}>
              Combined
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Time Range Filter Bar */}
          <View style={styles.rangeRow}>
            {(['1M', '3M', '6M', 'ALL'] as RangeOption[]).map((r) => (
              <Pressable
                key={r}
                style={[styles.rangeChip, range === r && styles.rangeChipActive]}
                onPress={() => setRange(r)}
                android_ripple={{ color: C.ripple }}
              >
                <Text style={[styles.rangeText, range === r && styles.rangeTextActive]}>
                  {r}
                </Text>
              </Pressable>
            ))}
          </View>

          {activeTab === 'bodyweight' ? (
            <>
              {/* Stat Summary Cards for Body Weight */}
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>LATEST</Text>
                  <Text style={styles.statVal}>
                    {bwStats.latest ? `${bwStats.latest} ${unit}` : '--'}
                  </Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>MIN / MAX</Text>
                  <Text style={styles.statVal}>
                    {bwStats.count > 0 ? `${bwStats.min} - ${bwStats.max}` : '--'}
                  </Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>NET CHANGE</Text>
                  <Text
                    style={[
                      styles.statVal,
                      bwStats.change > 0
                        ? { color: C.warning }
                        : bwStats.change < 0
                        ? { color: C.emerald }
                        : null,
                    ]}
                  >
                    {bwStats.count > 0
                      ? `${bwStats.change > 0 ? '+' : ''}${bwStats.change} ${unit}`
                      : '--'}
                  </Text>
                </View>
              </View>

              {/* Single Line Body Weight Chart */}
              <View style={styles.chartCard}>
                <Text style={styles.chartCardTitle}>Body Weight Trend ({unit})</Text>
                <ProgressChart data={bwChartData} unit={unit} height={210} color={C.emerald} />
              </View>
            </>
          ) : activeTab === 'exercise' ? (
            <>
              {/* Exercise Selector */}
              <Text style={styles.sectionLabel}>SELECT EXERCISE</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.exChipRow}
              >
                {exercises.map((ex) => {
                  const isSelected = (currentExercise?.id === ex.id);
                  return (
                    <Pressable
                      key={ex.id}
                      style={[styles.exChip, isSelected && styles.exChipActive]}
                      onPress={() => setSelectedExId(ex.id)}
                      android_ripple={{ color: C.ripple }}
                    >
                      <Text style={[styles.exChipText, isSelected && styles.exChipTextActive]}>
                        {ex.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Metric Selector Toggle */}
              <View style={styles.metricRow}>
                <Pressable
                  style={[styles.metricChip, exerciseMetric === 'maxWeight' && styles.metricChipActive]}
                  onPress={() => setExerciseMetric('maxWeight')}
                  android_ripple={{ color: C.ripple }}
                >
                  <Award size={13} color={exerciseMetric === 'maxWeight' ? C.emerald : C.textMuted} />
                  <Text style={[styles.metricText, exerciseMetric === 'maxWeight' && styles.metricTextActive]}>
                    Max Weight
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.metricChip, exerciseMetric === 'totalVolume' && styles.metricChipActive]}
                  onPress={() => setExerciseMetric('totalVolume')}
                  android_ripple={{ color: C.ripple }}
                >
                  <TrendingUp size={13} color={exerciseMetric === 'totalVolume' ? C.emerald : C.textMuted} />
                  <Text style={[styles.metricText, exerciseMetric === 'totalVolume' && styles.metricTextActive]}>
                    Total Volume
                  </Text>
                </Pressable>
              </View>

              {/* Stat Summary Cards for Single Exercise */}
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>
                    {exerciseMetric === 'maxWeight' ? 'PEAK (PR)' : 'MAX VOLUME'}
                  </Text>
                  <Text style={styles.statVal}>
                    {exStats.pr ? `${exStats.pr.toLocaleString()} ${unit}` : '--'}
                  </Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>LATEST</Text>
                  <Text style={styles.statVal}>
                    {exStats.latest ? `${exStats.latest.toLocaleString()} ${unit}` : '--'}
                  </Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>NET PROGRESS</Text>
                  <Text
                    style={[
                      styles.statVal,
                      exStats.change > 0
                        ? { color: C.emerald }
                        : exStats.change < 0
                        ? { color: C.danger }
                        : null,
                    ]}
                  >
                    {exStats.count > 0
                      ? `${exStats.change > 0 ? '+' : ''}${exStats.change.toLocaleString()} ${unit}`
                      : '--'}
                  </Text>
                </View>
              </View>

              {/* Single Exercise Chart */}
              <View style={styles.chartCard}>
                <Text style={styles.chartCardTitle}>
                  {currentExercise?.name ?? 'Exercise'} - {exerciseMetric === 'maxWeight' ? `Max Weight (${unit})` : `Total Volume (${unit})`}
                </Text>
                <ProgressChart data={exChartData} unit={unit} height={210} color="#3b82f6" />
              </View>
            </>
          ) : (
            <>
              {/* Combined View: Multi-Select Exercises to Overlay on Bodyweight */}
              <Text style={styles.sectionLabel}>TOGGLE EXERCISES TO OVERLAY WITH BODYWEIGHT</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.exChipRow}
              >
                {exercises.map((ex) => {
                  const isSelected = selectedExIdsCombined.includes(ex.id);
                  return (
                    <Pressable
                      key={ex.id}
                      style={[styles.exChip, isSelected && styles.exChipActive]}
                      onPress={() => toggleCombinedExercise(ex.id)}
                      android_ripple={{ color: C.ripple }}
                    >
                      <Text style={[styles.exChipText, isSelected && styles.exChipTextActive]}>
                        {isSelected ? '✓ ' : ''}{ex.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Multi-Series Overlay Chart */}
              <View style={styles.chartCard}>
                <Text style={styles.chartCardTitle}>
                  Body Weight vs. Exercises ({unit})
                </Text>
                <ProgressChart series={combinedSeries} unit={unit} height={250} />
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: C.overlay,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: C.borderSubtle,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
  closeBtn: {
    padding: 4,
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: C.borderSubtle,
    backgroundColor: C.bgCard,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: C.emerald,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textMuted,
  },
  tabTextActive: {
    color: C.emerald,
  },

  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 24,
  },

  // Time Range
  rangeRow: {
    flexDirection: 'row',
    backgroundColor: C.bgElevated,
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  rangeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  rangeChipActive: {
    backgroundColor: C.emeraldBg,
  },
  rangeText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textMuted,
  },
  rangeTextActive: {
    color: C.emerald,
    fontWeight: '700',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.bgElevated,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 0.5,
  },
  statVal: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textPrimary,
  },

  // Chart Card
  chartCard: {
    backgroundColor: C.bgInput,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  chartCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textSecondary,
    marginBottom: 4,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 0.8,
  },

  // Exercise Chips
  exChipRow: {
    gap: 8,
    paddingVertical: 2,
  },
  exChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: C.bgElevated,
  },
  exChipActive: {
    backgroundColor: C.emeraldBg,
  },
  exChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.textSecondary,
  },
  exChipTextActive: {
    color: C.emerald,
    fontWeight: '700',
  },

  // Metric Row
  metricRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: C.bgElevated,
  },
  metricChipActive: {
    backgroundColor: C.emeraldBg,
  },
  metricText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textMuted,
  },
  metricTextActive: {
    color: C.emerald,
    fontWeight: '700',
  },
});
