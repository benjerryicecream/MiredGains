import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ChevronDown, ChevronUp, Trash2, Pencil } from 'lucide-react-native';
import C from '../constants/colors';
import { Workout } from '../types';

interface WorkoutSummaryCardProps {
  workout: Workout;
  unit: string;
  onDelete: () => void;
  onEdit?: () => void;
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function WorkoutSummaryCard({
  workout,
  unit,
  onDelete,
  onEdit,
}: WorkoutSummaryCardProps) {
  const [expanded, setExpanded] = useState(false);

  const totalVolume = workout.exercises.reduce(
    (acc, ex) =>
      acc +
      ex.sets
        .filter((s) => s.completed)
        .reduce((a, s) => a + s.weight * s.reps, 0),
    0
  );
  const totalSets = workout.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );

  return (
    <View style={styles.card}>
      <Pressable
        style={styles.header}
        onPress={() => setExpanded((v) => !v)}
        android_ripple={{ color: C.ripple }}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.date}>{formatDate(workout.date)}</Text>
          <Text style={styles.time}>{formatTime(workout.date)}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{totalVolume.toLocaleString()}</Text>
            <Text style={styles.statLabel}>{unit} vol</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{totalSets}</Text>
            <Text style={styles.statLabel}>sets</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{formatDuration(workout.durationMs)}</Text>
            <Text style={styles.statLabel}>time</Text>
          </View>
          {expanded ? (
            <ChevronUp size={16} color={C.textMuted} />
          ) : (
            <ChevronDown size={16} color={C.textMuted} />
          )}
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.body}>
          <View style={styles.divider} />
          {workout.exercises.map((ex, i) => {
            const completedSets = ex.sets.filter((s) => s.completed);
            if (completedSets.length === 0) return null;
            return (
              <View key={i} style={styles.exRow}>
                <Text style={styles.exName}>{ex.exerciseName}</Text>
                <View style={styles.setsWrap}>
                  {completedSets.map((s, j) => (
                    <Text key={j} style={styles.setChip}>
                      {s.weight}
                      {unit} × {s.reps}
                    </Text>
                  ))}
                </View>
              </View>
            );
          })}
          {onEdit && (
            <Pressable
              style={styles.editRow}
              onPress={onEdit}
              android_ripple={{ color: C.ripple }}
            >
              <Pencil size={14} color={C.textSecondary} />
              <Text style={styles.editText}>Edit Workout</Text>
            </Pressable>
          )}
          <Pressable
            style={styles.deleteRow}
            onPress={onDelete}
            android_ripple={{ color: 'rgba(239,68,68,0.12)' }}
          >
            <Trash2 size={14} color={C.danger} />
            <Text style={styles.deleteText}>Delete Workout</Text>
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
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.borderSubtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    gap: 10,
  },
  headerLeft: { gap: 2 },
  date: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  time: { fontSize: 12, color: C.textSecondary },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  statPill: { alignItems: 'center', minWidth: 40 },
  statValue: { fontSize: 14, fontWeight: '700', color: C.textPrimary },
  statLabel: { fontSize: 10, color: C.textMuted, fontWeight: '500' },

  body: { paddingHorizontal: 14, paddingBottom: 10, gap: 8 },
  divider: { height: 1, backgroundColor: C.borderSubtle, marginBottom: 4 },

  exRow: { gap: 4 },
  exName: { fontSize: 13, fontWeight: '600', color: C.textPrimary },
  setsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  setChip: {
    fontSize: 12,
    color: C.textSecondary,
    backgroundColor: C.bgElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 8,
  },
  editText: { color: C.textSecondary, fontSize: 13, fontWeight: '600' },

  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 8,
  },
  deleteText: { color: C.danger, fontSize: 13, fontWeight: '600' },
});
