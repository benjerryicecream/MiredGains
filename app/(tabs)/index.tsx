import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Dumbbell,
  Plus,
  Search,
  X,
  CheckCircle2,
  Timer,
  FlameKindling,
  NotebookPen,
  Bell,
  Calendar,
  Trash2,
  Pencil,
  Play,
} from 'lucide-react-native';
import C from '../../constants/colors';
import { useWorkout } from '../../context/WorkoutContext';
import { useApp } from '../../context/AppContext';
import { useNotifications } from '../../hooks/useNotifications';
import ExerciseCard from '../../components/ExerciseCard';
import Button from '../../components/ui/Button';
import AddExerciseModal from '../../components/AddExerciseModal';
import ScheduleWorkoutModal from '../../components/ScheduleWorkoutModal';
import { Exercise, ScheduledWorkout, WorkoutSet } from '../../types';
import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';

// ─── Elapsed timer display ────────────────────────────────────────────────────
function ElapsedTimer({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - startTime), 1000);
    return () => clearInterval(id);
  }, [startTime]);

  const totalSec = Math.floor(elapsed / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const label = h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  return (
    <View style={timerStyles.wrap}>
      <Timer size={13} color={C.emerald} />
      <Text style={timerStyles.text}>{label}</Text>
    </View>
  );
}

const timerStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  text: { fontSize: 13, fontWeight: '700', color: C.emerald, fontVariant: ['tabular-nums'] },
});

// ─── Exercise Picker Modal ────────────────────────────────────────────────────
function ExercisePicker({
  visible,
  exercises,
  addedIds,
  onSelect,
  onClose,
  onCreateNew,
}: {
  visible: boolean;
  exercises: Exercise[];
  addedIds: string[];
  onSelect: (ex: Exercise) => void;
  onClose: () => void;
  onCreateNew: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const filtered = exercises.filter(
    (e) =>
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.muscleGroup.toLowerCase().includes(query.toLowerCase())
  );

  const groups = filtered.reduce<Record<string, Exercise[]>>((acc, ex) => {
    if (!acc[ex.muscleGroup]) acc[ex.muscleGroup] = [];
    acc[ex.muscleGroup].push(ex);
    return acc;
  }, {});

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={pickerStyles.overlay} onPress={onClose} />
      <View style={[pickerStyles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={pickerStyles.handle} />
        <View style={pickerStyles.titleRow}>
          <Text style={pickerStyles.title}>Add Exercise</Text>
          <Pressable onPress={onClose} android_ripple={{ color: C.ripple, radius: 20, borderless: true }}>
            <X size={20} color={C.textSecondary} />
          </Pressable>
        </View>

        {/* Search */}
        <View style={pickerStyles.searchWrap}>
          <Search size={16} color={C.textMuted} style={pickerStyles.searchIcon} />
          <TextInput
            style={pickerStyles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor={C.textMuted}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <X size={15} color={C.textMuted} />
            </Pressable>
          )}
        </View>

        <ScrollView contentContainerStyle={pickerStyles.list} keyboardShouldPersistTaps="handled">
          {Object.entries(groups)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([group, exs]) => (
              <View key={group}>
                <Text style={pickerStyles.groupHeader}>{group}</Text>
                {exs.map((ex) => {
                  const added = addedIds.includes(ex.id);
                  return (
                    <Pressable
                      key={ex.id}
                      style={[pickerStyles.item, added && pickerStyles.itemAdded]}
                      onPress={() => !added && onSelect(ex)}
                      android_ripple={{ color: C.ripple }}
                    >
                      <Text style={[pickerStyles.itemName, added && pickerStyles.itemNameAdded]}>
                        {ex.name}
                      </Text>
                      {added && <CheckCircle2 size={16} color={C.emerald} />}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          {filtered.length === 0 && (
            <Text style={pickerStyles.empty}>No exercises match "{query}"</Text>
          )}
        </ScrollView>

        <View style={pickerStyles.footer}>
          <Button
            label="Create Custom Exercise"
            variant="secondary"
            size="md"
            icon={<Plus size={15} color={C.textPrimary} />}
            fullWidth
            onPress={onCreateNew}
          />
        </View>
      </View>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.overlay },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: C.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingBottom: 16,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: C.border, alignSelf: 'center',
    marginTop: 10, marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  title: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bgInput, borderRadius: 12,
    borderWidth: 1, borderColor: C.borderSubtle,
    marginHorizontal: 16, marginBottom: 8,
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  searchIcon: {},
  searchInput: { flex: 1, fontSize: 15, color: C.textPrimary },
  list: { paddingHorizontal: 16, paddingBottom: 8, gap: 2 },
  groupHeader: {
    fontSize: 11, fontWeight: '700', color: C.textMuted,
    letterSpacing: 0.8, textTransform: 'uppercase',
    paddingTop: 14, paddingBottom: 4, paddingHorizontal: 4,
  },
  item: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, paddingHorizontal: 12,
    borderRadius: 12,
  },
  itemAdded: { opacity: 0.55 },
  itemName: { fontSize: 15, color: C.textPrimary, fontWeight: '500' },
  itemNameAdded: { color: C.emerald },
  empty: { color: C.textMuted, textAlign: 'center', paddingVertical: 24, fontSize: 14 },
  footer: { paddingHorizontal: 16, paddingTop: 10 },
});

// ─── Main Workout Screen ──────────────────────────────────────────────────────
export default function WorkoutScreen() {
  const {
    active,
    startTime,
    exercises,
    notes,
    startWorkout,
    discardWorkout,
    setNotes,
    addExercise,
    removeExercise,
    addSet,
    updateSet,
    removeSet,
    toggleSet,
    elapsedMs,
  } = useWorkout();

  const {
    exercises: allExercises,
    addExercise: persistExercise,
    saveWorkout,
    scheduledWorkouts,
    deleteScheduledWorkout,
    completeScheduledWorkout,
    unit,
  } = useApp();

  const { cancelNotification } = useNotifications();

  const [pickerVisible, setPickerVisible] = useState(false);
  const [newExModalVisible, setNewExModalVisible] = useState(false);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [editScheduled, setEditScheduled] = useState<ScheduledWorkout | null>(null);

  const addedIds = exercises.map((e) => e.exerciseId);

  const activeScheduledWorkouts = scheduledWorkouts.filter((sw) => !sw.completed);

  const handleSelectExercise = (ex: Exercise) => {
    addExercise({ exerciseId: ex.id, exerciseName: ex.name, sets: [] });
    setPickerVisible(false);
  };

  const handleCreateNew = (ex: Exercise) => {
    persistExercise(ex);
    addExercise({ exerciseId: ex.id, exerciseName: ex.name, sets: [] });
    setNewExModalVisible(false);
    setPickerVisible(false);
  };

  const handleStartScheduledWorkout = (sw: ScheduledWorkout) => {
    startWorkout();
    // Pre-populate planned exercises with pre-planned target weights & reps
    if (sw.plannedExercises && sw.plannedExercises.length > 0) {
      sw.plannedExercises.forEach((pe) => {
        const sets: WorkoutSet[] = pe.targetSets && pe.targetSets.length > 0
          ? pe.targetSets.map((ts) => ({
              id: uuid(),
              weight: ts.targetWeight,
              reps: ts.targetReps,
              completed: false,
            }))
          : [];

        addExercise({
          exerciseId: pe.exerciseId,
          exerciseName: pe.exerciseName,
          sets,
        });
      });
    } else if (sw.exerciseIds && sw.exerciseIds.length > 0) {
      // Legacy fallback
      sw.exerciseIds.forEach((exId) => {
        const found = allExercises.find((e) => e.id === exId);
        if (found) {
          addExercise({ exerciseId: found.id, exerciseName: found.name, sets: [] });
        }
      });
    }
    completeScheduledWorkout(sw.id);
  };

  const handleCancelScheduledWorkout = (sw: ScheduledWorkout) => {
    Alert.alert('Cancel Scheduled Workout', `Remove alert for "${sw.title}"?`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          cancelNotification(sw.notificationId);
          deleteScheduledWorkout(sw.id);
        },
      },
    ]);
  };

  const handleFinish = () => {
    const completedExercises = exercises.filter((ex) =>
      ex.sets.some((s) => s.completed)
    );
    if (completedExercises.length === 0) {
      Alert.alert('No completed sets', 'Complete at least one set before finishing.');
      return;
    }
    Alert.alert('Finish Workout?', 'Save this workout to your history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        onPress: () => {
          saveWorkout({
            id: uuid(),
            date: new Date().toISOString(),
            durationMs: elapsedMs(),
            exercises: completedExercises,
            notes: notes.trim() || undefined,
          });
          discardWorkout();
        },
      },
    ]);
  };

  const handleDiscard = () => {
    Alert.alert('Discard Workout?', 'All progress will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: discardWorkout },
    ]);
  };

  // ── Idle state ──────────────────────────────────────────────────────────────
  if (!active) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.idleScrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.idleHeader}>
            <Text style={styles.idleHeaderTitle}>Workout Tracker</Text>
            <Pressable
              style={styles.scheduleHeaderBtn}
              onPress={() => setScheduleModalVisible(true)}
              android_ripple={{ color: C.ripple }}
            >
              <Bell size={16} color={C.textSecondary} strokeWidth={2.5} />
              <Text style={styles.scheduleHeaderBtnText}>Schedule</Text>
            </Pressable>
          </View>

          <View style={styles.idleContent}>
            <View style={styles.idleIcon}>
              <FlameKindling size={44} color={C.emerald} strokeWidth={1.5} />
            </View>
            <Text style={styles.idleTitle}>U Mirin'?</Text>
            <Text style={styles.idleSub}>Start a new workout or schedule a future session with Android alerts.</Text>

            <View style={styles.idleActionButtons}>
              <Button
                label="Start Workout Now"
                variant="primary"
                size="lg"
                icon={<Plus size={18} color="#fff" />}
                onPress={startWorkout}
                style={styles.startBtn}
              />
              <Button
                label="Schedule Workout"
                variant="secondary"
                size="lg"
                icon={<Bell size={18} color={C.textPrimary} />}
                onPress={() => setScheduleModalVisible(true)}
                style={styles.scheduleBtn}
              />
            </View>
          </View>

          {/* Upcoming Scheduled Workouts Section */}
          {activeScheduledWorkouts.length > 0 && (
            <View style={styles.scheduledSection}>
              <Text style={styles.sectionLabel}>UPCOMING SCHEDULED WORKOUTS</Text>
              {activeScheduledWorkouts.map((sw) => {
                const targetD = new Date(sw.scheduledAt);
                const dateStr = targetD.toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                });
                const timeStr = targetD.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                const plannedSummary = sw.plannedExercises && sw.plannedExercises.length > 0
                  ? sw.plannedExercises
                      .map((pe) => {
                        const setDesc = pe.targetSets && pe.targetSets.length > 0
                          ? ` (${pe.targetSets.length} sets @ ${pe.targetSets[0].targetWeight} ${unit})`
                          : '';
                        return `${pe.exerciseName}${setDesc}`;
                      })
                      .join(' • ')
                  : (sw.exerciseIds || [])
                      .map((id) => allExercises.find((e) => e.id === id)?.name)
                      .filter(Boolean)
                      .join(', ');

                return (
                  <View key={sw.id} style={styles.scheduledCard}>
                    <View style={styles.scheduledCardHeader}>
                      <View style={styles.scheduledCardTitleRow}>
                        <Bell size={16} color={C.textSecondary} />
                        <Text style={styles.scheduledCardTitle}>{sw.title}</Text>
                      </View>
                      <View style={styles.scheduledCardActions}>
                        <Pressable
                          onPress={() => setEditScheduled(sw)}
                          android_ripple={{ color: C.ripple, radius: 18, borderless: true }}
                          style={styles.deleteIconBtn}
                        >
                          <Pencil size={16} color={C.textSecondary} />
                        </Pressable>
                        <Pressable
                          onPress={() => handleCancelScheduledWorkout(sw)}
                          android_ripple={{ color: C.ripple, radius: 18, borderless: true }}
                          style={styles.deleteIconBtn}
                        >
                          <Trash2 size={16} color={C.danger} />
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.scheduledBadgeRow}>
                      <View style={styles.timeBadge}>
                        <Calendar size={12} color={C.emerald} />
                        <Text style={styles.timeBadgeText}>{dateStr} at {timeStr}</Text>
                      </View>
                    </View>

                    {plannedSummary ? (
                      <Text style={styles.plannedExText}>
                        Routine: <Text style={styles.plannedExList}>{plannedSummary}</Text>
                      </Text>
                    ) : null}

                    <Button
                      label="Start Planned Workout"
                      variant="primary"
                      size="md"
                      icon={<Play size={14} color="#fff" />}
                      onPress={() => handleStartScheduledWorkout(sw)}
                      style={styles.startScheduledBtn}
                    />
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        <ScheduleWorkoutModal
          visible={scheduleModalVisible}
          onClose={() => setScheduleModalVisible(false)}
        />

        <ScheduleWorkoutModal
          visible={editScheduled !== null}
          editing={editScheduled}
          onClose={() => setEditScheduled(null)}
        />
      </SafeAreaView>
    );
  }

  // ── Active state ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Active Workout</Text>
          {startTime && <ElapsedTimer startTime={startTime} />}
        </View>
        <View style={styles.headerActions}>
          <Button label="Discard" variant="ghost" size="sm" onPress={handleDiscard} />
          <Button label="Finish" variant="primary" size="sm" onPress={handleFinish} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {exercises.length === 0 && (
          <View style={styles.emptyState}>
            <Dumbbell size={32} color={C.textMuted} strokeWidth={1.5} />
            <Text style={styles.emptyText}>Add your first exercise below</Text>
          </View>
        )}

        {exercises.map((ex) => (
          <ExerciseCard
            key={ex.exerciseId}
            exercise={ex}
            unit={unit}
            onAddSet={() => addSet(ex.exerciseId)}
            onUpdateSet={(set) => updateSet(ex.exerciseId, set)}
            onRemoveSet={(setId) => removeSet(ex.exerciseId, setId)}
            onToggleSet={(setId) => toggleSet(ex.exerciseId, setId)}
            onRemoveExercise={() => removeExercise(ex.exerciseId)}
          />
        ))}

        <Button
          label="Add Exercise"
          variant="secondary"
          size="lg"
          icon={<Plus size={18} color={C.textPrimary} />}
          fullWidth
          onPress={() => setPickerVisible(true)}
          style={styles.addExBtn}
        />

        {/* Workout Notes */}
        <View style={styles.notesSection}>
          <View style={styles.notesHeader}>
            <NotebookPen size={14} color={C.textSecondary} />
            <Text style={styles.notesTitle}>WORKOUT NOTES</Text>
          </View>
          <TextInput
            style={styles.notesInput}
            placeholder="How did it go? Any pains or PRs?"
            placeholderTextColor={C.textMuted}
            multiline
            value={notes}
            onChangeText={setNotes}
          />
        </View>
      </ScrollView>

      <ExercisePicker
        visible={pickerVisible}
        exercises={allExercises}
        addedIds={addedIds}
        onSelect={handleSelectExercise}
        onClose={() => setPickerVisible(false)}
        onCreateNew={() => {
          setPickerVisible(false);
          setNewExModalVisible(true);
        }}
      />

      <AddExerciseModal
        visible={newExModalVisible}
        onClose={() => setNewExModalVisible(false)}
        onSave={handleCreateNew}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // Idle
  idleScrollContent: { paddingBottom: 48 },
  idleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: C.borderSubtle,
    marginBottom: 20,
  },
  idleHeaderTitle: { fontSize: 22, fontWeight: '700', color: C.textPrimary },
  scheduleHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: C.bgElevated,
  },
  scheduleHeaderBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSecondary,
  },

  idleContent: { alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingVertical: 12 },
  idleIcon: {
    width: 90, height: 90, borderRadius: 24,
    backgroundColor: C.emeraldBg,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  idleTitle: { fontSize: 24, fontWeight: '700', color: C.textPrimary, textAlign: 'center' },
  idleSub: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 21 },
  idleActionButtons: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  startBtn: { width: '100%' },
  scheduleBtn: { width: '100%' },

  // Scheduled Workouts Section
  scheduledSection: {
    marginTop: 28,
    paddingHorizontal: 16,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 0.8,
  },
  scheduledCard: {
    backgroundColor: C.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    gap: 10,
  },
  scheduledCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduledCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  scheduledCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
  },
  deleteIconBtn: {
    padding: 4,
  },
  scheduledCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scheduledBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.emeraldBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  timeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.emerald,
  },
  plannedExText: {
    fontSize: 12,
    color: C.textMuted,
  },
  plannedExList: {
    color: C.textSecondary,
    fontWeight: '600',
  },
  startScheduledBtn: {
    marginTop: 4,
  },

  // Active
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
  headerActions: { flexDirection: 'row', gap: 8 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },

  emptyState: {
    alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 48,
  },
  emptyText: { color: C.textMuted, fontSize: 14 },

  addExBtn: { marginTop: 4 },

  notesSection: {
    marginTop: 24,
    backgroundColor: C.bgCard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    gap: 8,
  },
  notesHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  notesTitle: { fontSize: 11, fontWeight: '700', color: C.textSecondary, letterSpacing: 0.8 },
  notesInput: {
    fontSize: 14,
    color: C.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 4,
  },
});
