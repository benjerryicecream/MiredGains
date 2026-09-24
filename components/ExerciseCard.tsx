import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react-native';
import C from '../constants/colors';
import { WorkoutExercise, WorkoutSet } from '../types';
import SetRow from './SetRow';

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  unit: string;
  onAddSet: () => void;
  onUpdateSet: (set: WorkoutSet) => void;
  onRemoveSet: (setId: string) => void;
  onToggleSet: (setId: string) => void;
  onRemoveExercise: () => void;
}

export default function ExerciseCard({
  exercise,
  unit,
  onAddSet,
  onUpdateSet,
  onRemoveSet,
  onToggleSet,
  onRemoveExercise,
}: ExerciseCardProps) {
  const [collapsed, setCollapsed] = useState(false);

  const completedCount = exercise.sets.filter((s) => s.completed).length;
  const totalSets = exercise.sets.length;
  const totalVolume = exercise.sets
    .filter((s) => s.completed)
    .reduce((acc, s) => acc + s.weight * s.reps, 0);

  return (
    <View style={styles.card}>
      {/* Header */}
      <Pressable
        style={styles.header}
        onPress={() => setCollapsed((v) => !v)}
        android_ripple={{ color: C.ripple }}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>
              {completedCount}/{totalSets} sets
            </Text>
            {totalVolume > 0 && (
              <Text style={styles.meta}>
                · {totalVolume.toLocaleString()} {unit} vol
              </Text>
            )}
          </View>
        </View>

        <View style={styles.headerRight}>
          {completedCount === totalSets && totalSets > 0 && (
            <View style={styles.donePill}>
              <Text style={styles.donePillText}>Done</Text>
            </View>
          )}
          <Pressable
            onPress={onRemoveExercise}
            android_ripple={{ color: 'rgba(239,68,68,0.15)', radius: 18, borderless: true }}
            style={styles.removeBtn}
          >
            <X size={16} color={C.textMuted} />
          </Pressable>
          {collapsed ? (
            <ChevronDown size={18} color={C.textSecondary} />
          ) : (
            <ChevronUp size={18} color={C.textSecondary} />
          )}
        </View>
      </Pressable>

      {!collapsed && (
        <View style={styles.body}>
          {/* Column headers */}
          {exercise.sets.length > 0 && (
            <View style={styles.colHeaders}>
              <View style={{ width: 24 }} />
              <Text style={[styles.colLabel, { flex: 1, textAlign: 'center' }]}>
                WEIGHT
              </Text>
              <Text style={[styles.colLabel, { flex: 1, textAlign: 'center' }]}>
                REPS
              </Text>
              <View style={{ width: 68 }} />
            </View>
          )}

          {exercise.sets.map((set, idx) => (
            <SetRow
              key={set.id}
              set={set}
              index={idx}
              unit={unit}
              onUpdate={onUpdateSet}
              onRemove={() => onRemoveSet(set.id)}
              onToggle={() => onToggleSet(set.id)}
            />
          ))}

          <Pressable
            style={styles.addSetBtn}
            onPress={onAddSet}
            android_ripple={{ color: C.ripple }}
          >
            <Plus size={15} color={C.emerald} strokeWidth={2.5} />
            <Text style={styles.addSetText}>Add Set</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.bgCard,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.borderSubtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  headerLeft: { flex: 1, gap: 3 },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
    letterSpacing: 0.1,
  },
  metaRow: { flexDirection: 'row', gap: 4 },
  meta: { fontSize: 12, color: C.textSecondary },

  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  removeBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donePill: {
    backgroundColor: C.emeraldBg,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  donePillText: { color: C.emerald, fontSize: 11, fontWeight: '700' },

  body: { paddingHorizontal: 10, paddingBottom: 10 },

  colHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  colLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 0.8,
  },

  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addSetText: {
    color: C.emerald,
    fontSize: 14,
    fontWeight: '600',
  },
});
