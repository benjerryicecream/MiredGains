import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Scale, Plus, History as HistoryIcon } from 'lucide-react-native';
import C from '../../constants/colors';
import { useApp } from '../../context/AppContext';
import WorkoutSummaryCard from '../../components/WorkoutSummaryCard';
import BodyweightEntryRow from '../../components/BodyweightEntryRow';
import EditWorkoutModal from '../../components/EditWorkoutModal';
import { BodyweightEntry, Workout } from '../../types';
import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function HistoryScreen() {
  const {
    workouts,
    bodyweights,
    unit,
    deleteWorkout,
    upsertBodyweight,
    deleteBodyweight,
  } = useApp();

  const [bwInput, setBwInput] = useState('');
  const [tab, setTab] = useState<'workouts' | 'bodyweight'>('workouts');
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  const sortedWorkouts = useMemo(
    () => [...workouts].sort((a, b) => b.date.localeCompare(a.date)),
    [workouts]
  );

  const handleAddBodyweight = () => {
    const val = parseFloat(bwInput);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Invalid weight', 'Enter a valid weight value.');
      return;
    }
    upsertBodyweight({
      id: uuid(),
      date: todayStr(),
      weight: val,
    });
    setBwInput('');
  };

  const sortedBodyweights = [...bodyweights].sort(
    (a, b) => b.date.localeCompare(a.date)
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabBtn, tab === 'workouts' && styles.tabBtnActive]}
          onPress={() => setTab('workouts')}
          android_ripple={{ color: C.ripple }}
        >
          <HistoryIcon size={14} color={tab === 'workouts' ? C.emerald : C.textMuted} />
          <Text style={[styles.tabLabel, tab === 'workouts' && styles.tabLabelActive]}>
            Workouts
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, tab === 'bodyweight' && styles.tabBtnActive]}
          onPress={() => setTab('bodyweight')}
          android_ripple={{ color: C.ripple }}
        >
          <Scale size={14} color={tab === 'bodyweight' ? C.emerald : C.textMuted} />
          <Text style={[styles.tabLabel, tab === 'bodyweight' && styles.tabLabelActive]}>
            Body Weight
          </Text>
        </Pressable>
      </View>

      {tab === 'workouts' ? (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {sortedWorkouts.length === 0 ? (
            <View style={styles.empty}>
              <HistoryIcon size={36} color={C.textMuted} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No workouts yet</Text>
              <Text style={styles.emptySub}>
                Finish a workout and it will appear here.
              </Text>
            </View>
          ) : (
            sortedWorkouts.map((w) => (
              <WorkoutSummaryCard
                key={w.id}
                workout={w}
                unit={unit}
                onEdit={() => setEditingWorkout(w)}
                onDelete={() =>
                  Alert.alert('Delete Workout', 'Remove this workout from history?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteWorkout(w.id) },
                  ])
                }
              />
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Log today's weight */}
          <View style={styles.bwLogCard}>
            <Text style={styles.bwLogTitle}>Log Today's Weight</Text>
            <View style={styles.bwInputRow}>
              <TextInput
                style={styles.bwInput}
                value={bwInput}
                onChangeText={setBwInput}
                placeholder={`Weight in ${unit}`}
                placeholderTextColor={C.textMuted}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={handleAddBodyweight}
              />
              <Text style={styles.bwUnit}>{unit}</Text>
              <Pressable
                style={styles.bwAddBtn}
                onPress={handleAddBodyweight}
                android_ripple={{ color: C.ripple }}
              >
                <Plus size={18} color="#fff" strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>

          {sortedBodyweights.length === 0 ? (
            <View style={styles.empty}>
              <Scale size={36} color={C.textMuted} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No entries yet</Text>
              <Text style={styles.emptySub}>Log your weight above to get started.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionLabel}>LOG</Text>
              {sortedBodyweights.map((entry) => (
                <BodyweightEntryRow
                  key={entry.id}
                  entry={entry}
                  unit={unit}
                  onUpdate={upsertBodyweight}
                  onDelete={() => deleteBodyweight(entry.id)}
                />
              ))}
            </>
          )}
        </ScrollView>
      )}

      <EditWorkoutModal
        workout={editingWorkout}
        onClose={() => setEditingWorkout(null)}
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

  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.bgCard,
    borderBottomWidth: 1,
    borderColor: C.borderSubtle,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: C.emerald },
  tabLabel: { fontSize: 13, fontWeight: '600', color: C.textMuted },
  tabLabelActive: { color: C.emerald },

  list: { padding: 16, paddingBottom: 48 },

  // Empty state
  empty: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 60,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.textSecondary },
  emptySub: { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 20 },

  // Bodyweight
  bwLogCard: {
    backgroundColor: C.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: C.borderSubtle,
  },
  bwLogTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  bwInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bwInput: {
    flex: 1,
    backgroundColor: C.bgInput,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: C.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  bwUnit: { color: C.textMuted, fontSize: 13, fontWeight: '600' },
  bwAddBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.emeraldDim,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionLabel: {
    fontSize: 11, fontWeight: '700',
    color: C.textMuted, letterSpacing: 0.8,
    marginBottom: 8,
  },
});
