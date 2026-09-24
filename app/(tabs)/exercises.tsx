import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, Tag, TrendingUp } from 'lucide-react-native';
import C from '../../constants/colors';
import { useApp } from '../../context/AppContext';
import AddExerciseModal from '../../components/AddExerciseModal';
import ProgressChartModal from '../../components/ProgressChartModal';
import { Exercise } from '../../types';

const MUSCLE_GROUP_COLORS: Record<string, string> = {
  Back:      '#6366f1',
  Chest:     '#ec4899',
  Shoulders: '#f59e0b',
  Biceps:    '#3b82f6',
  Triceps:   '#8b5cf6',
  Legs:      '#10b981',
  Core:      '#f97316',
  Glutes:    '#ef4444',
  Calves:    '#06b6d4',
  Cardio:    '#84cc16',
  Other:     '#6b7280',
};

function MuscleTag({ group }: { group: string }) {
  const color = MUSCLE_GROUP_COLORS[group] ?? C.textMuted;
  return (
    <View style={[tagStyles.pill, { backgroundColor: color + '1f' }]}>
      <Text style={[tagStyles.label, { color }]}>{group}</Text>
    </View>
  );
}

const tagStyles = StyleSheet.create({
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  label: { fontSize: 11, fontWeight: '700' },
});

export default function ExercisesScreen() {
  const { exercises, addExercise, deleteExercise } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const [chartModalVisible, setChartModalVisible] = useState(false);
  const [selectedChartExId, setSelectedChartExId] = useState<string | undefined>(undefined);

  const muscleGroups = useMemo(
    () => Array.from(new Set(exercises.map((e) => e.muscleGroup))).sort(),
    [exercises]
  );

  const filtered = selectedGroup
    ? exercises.filter((e) => e.muscleGroup === selectedGroup)
    : exercises;

  const sorted = [...filtered].sort((a, b) => {
    if (a.muscleGroup !== b.muscleGroup)
      return a.muscleGroup.localeCompare(b.muscleGroup);
    return a.name.localeCompare(b.name);
  });

  const handleDelete = (ex: Exercise) => {
    if (!ex.isCustom) {
      Alert.alert('Cannot Delete', 'Built-in exercises cannot be deleted.');
      return;
    }
    Alert.alert('Delete Exercise', `Remove "${ex.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteExercise(ex.id) },
    ]);
  };

  const handleSave = (ex: Exercise) => {
    addExercise(ex);
    setModalVisible(false);
  };

  const handleOpenChart = (exId?: string) => {
    setSelectedChartExId(exId);
    setChartModalVisible(true);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Exercises</Text>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.headerChartBtn}
            onPress={() => handleOpenChart()}
            android_ripple={{ color: C.ripple }}
          >
            <TrendingUp size={18} color={C.textSecondary} strokeWidth={2.5} />
          </Pressable>
          <Pressable
            style={styles.addBtn}
            onPress={() => setModalVisible(true)}
            android_ripple={{ color: C.ripple }}
          >
            <Plus size={20} color="#fff" strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>

      {/* Muscle group filter chips */}
      <FlatList
        data={['All', ...muscleGroups]}
        keyExtractor={(item) => item}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => {
          const active = item === 'All' ? !selectedGroup : selectedGroup === item;
          return (
            <Pressable
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setSelectedGroup(item === 'All' ? null : item)}
              android_ripple={{ color: C.ripple }}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {item}
              </Text>
            </Pressable>
          );
        }}
      />

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No exercises found.</Text>
          </View>
        }
        renderItem={({ item: ex }) => (
          <View style={styles.exRow}>
            <View style={styles.exLeft}>
              <Text style={styles.exName}>{ex.name}</Text>
              <MuscleTag group={ex.muscleGroup} />
            </View>
            <View style={styles.exRight}>
              {ex.isCustom && (
                <View style={styles.customBadge}>
                  <Tag size={10} color={C.emerald} />
                  <Text style={styles.customBadgeText}>Custom</Text>
                </View>
              )}
              <Pressable
                onPress={() => handleOpenChart(ex.id)}
                android_ripple={{ color: C.ripple, radius: 18, borderless: true }}
                style={styles.actionIconBtn}
              >
                <TrendingUp size={16} color={C.textSecondary} />
              </Pressable>
              <Pressable
                onPress={() => handleDelete(ex)}
                android_ripple={{ color: 'rgba(239,68,68,0.15)', radius: 18, borderless: true }}
                style={styles.actionIconBtn}
              >
                <Trash2 size={16} color={ex.isCustom ? C.danger : C.textMuted} />
              </Pressable>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <AddExerciseModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />

      <ProgressChartModal
        visible={chartModalVisible}
        onClose={() => setChartModalVisible(false)}
        initialTab="exercise"
        initialExerciseId={selectedChartExId}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: C.borderSubtle,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: C.textPrimary },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerChartBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.emeraldDim,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderColor: C.borderSubtle,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: C.bgElevated,
  },
  filterChipActive: { backgroundColor: C.emeraldBg },
  filterChipText: { fontSize: 13, fontWeight: '500', color: C.textSecondary },
  filterChipTextActive: { color: C.emerald, fontWeight: '700' },

  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 48 },

  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    gap: 8,
  },
  exLeft: { flex: 1, gap: 5 },
  exName: { fontSize: 15, fontWeight: '600', color: C.textPrimary },
  exRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  customBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: C.emeraldBg,
    borderRadius: 100,
  },
  customBadgeText: { fontSize: 10, fontWeight: '700', color: C.emerald },

  actionIconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  separator: { height: 1, backgroundColor: C.borderSubtle },

  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { color: C.textMuted, fontSize: 14 },
});
