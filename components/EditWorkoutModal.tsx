import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Plus,
  Search,
  CheckCircle2,
  Pencil,
} from 'lucide-react-native';
import C from '../constants/colors';
import { Workout, WorkoutExercise, WorkoutSet, Exercise } from '../types';
import { useApp } from '../context/AppContext';
import SetRow from './SetRow';
import AddExerciseModal from './AddExerciseModal';
import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';

// ─── Exercise Picker ──────────────────────────────────────────────────────────
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
      <Pressable style={ps.overlay} onPress={onClose} />
      <View style={[ps.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={ps.handle} />
        <View style={ps.titleRow}>
          <Text style={ps.title}>Add Exercise</Text>
          <Pressable onPress={onClose} android_ripple={{ color: C.ripple, radius: 20, borderless: true }}>
            <X size={20} color={C.textSecondary} />
          </Pressable>
        </View>
        <View style={ps.searchWrap}>
          <Search size={16} color={C.textMuted} />
          <TextInput
            style={ps.searchInput}
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
        <ScrollView contentContainerStyle={ps.list} keyboardShouldPersistTaps="handled">
          {Object.entries(groups)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([group, exs]) => (
              <View key={group}>
                <Text style={ps.groupHeader}>{group}</Text>
                {exs.map((ex) => {
                  const added = addedIds.includes(ex.id);
                  return (
                    <Pressable
                      key={ex.id}
                      style={[ps.item, added && ps.itemAdded]}
                      onPress={() => !added && onSelect(ex)}
                      android_ripple={{ color: C.ripple }}
                    >
                      <Text style={[ps.itemName, added && ps.itemNameAdded]}>{ex.name}</Text>
                      {added && <CheckCircle2 size={16} color={C.emerald} />}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          {filtered.length === 0 && (
            <Text style={ps.empty}>No exercises match "{query}"</Text>
          )}
        </ScrollView>
        <View style={ps.footer}>
          <Pressable style={ps.createBtn} onPress={onCreateNew} android_ripple={{ color: C.ripple }}>
            <Plus size={15} color={C.textPrimary} />
            <Text style={ps.createBtnText}>Create Custom Exercise</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const ps = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.overlay },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: C.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
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
  searchInput: { flex: 1, fontSize: 15, color: C.textPrimary },
  list: { paddingHorizontal: 16, paddingBottom: 8, gap: 2 },
  groupHeader: {
    fontSize: 11, fontWeight: '700', color: C.textMuted,
    letterSpacing: 0.8, paddingVertical: 8,
  },
  item: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 4,
    borderBottomWidth: 1, borderColor: C.borderSubtle,
  },
  itemAdded: { opacity: 0.45 },
  itemName: { fontSize: 15, color: C.textPrimary },
  itemNameAdded: { color: C.emerald },
  empty: { color: C.textMuted, textAlign: 'center', paddingTop: 24 },
  footer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13,
    backgroundColor: C.bgElevated, borderRadius: 12,
  },
  createBtnText: { color: C.textPrimary, fontSize: 14, fontWeight: '600' },
});

// ─── Edit Workout Modal ───────────────────────────────────────────────────────
interface EditWorkoutModalProps {
  workout: Workout | null;
  onClose: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function EditWorkoutModal({ workout, onClose }: EditWorkoutModalProps) {
  const { exercises, updateWorkout, addExercise } = useApp();
  const insets = useSafeAreaInsets();

  const [draft, setDraft] = useState<Workout | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);

  // Deep-clone into local draft whenever the modal opens with a workout
  React.useEffect(() => {
    if (workout) {
      setDraft(JSON.parse(JSON.stringify(workout)));
    }
  }, [workout]);

  const handleSave = useCallback(() => {
    if (!draft) return;
    updateWorkout(draft);
    onClose();
  }, [draft, updateWorkout, onClose]);

  // ── Set mutations ─────────────────────────────────────────────────────────
  const updateSet = useCallback((exIdx: number, updated: WorkoutSet) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const exs = prev.exercises.map((ex, i) =>
        i !== exIdx ? ex : { ...ex, sets: ex.sets.map((s) => (s.id === updated.id ? updated : s)) }
      );
      return { ...prev, exercises: exs };
    });
  }, []);

  const removeSet = useCallback((exIdx: number, setId: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const exs = prev.exercises.map((ex, i) =>
        i !== exIdx ? ex : { ...ex, sets: ex.sets.filter((s) => s.id !== setId) }
      );
      return { ...prev, exercises: exs };
    });
  }, []);

  const toggleSet = useCallback((exIdx: number, setId: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const exs = prev.exercises.map((ex, i) =>
        i !== exIdx
          ? ex
          : { ...ex, sets: ex.sets.map((s) => (s.id === setId ? { ...s, completed: !s.completed } : s)) }
      );
      return { ...prev, exercises: exs };
    });
  }, []);

  const addSet = useCallback((exIdx: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const exs = prev.exercises.map((ex, i) => {
        if (i !== exIdx) return ex;
        const last = ex.sets[ex.sets.length - 1];
        const newSet: WorkoutSet = {
          id: uuid(),
          weight: last?.weight ?? 0,
          reps: last?.reps ?? 0,
          completed: false,
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      });
      return { ...prev, exercises: exs };
    });
  }, []);

  const removeExercise = useCallback((exIdx: number) => {
    setDraft((prev) =>
      prev ? { ...prev, exercises: prev.exercises.filter((_, i) => i !== exIdx) } : prev
    );
  }, []);

  const addExerciseToDraft = useCallback((ex: Exercise) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const newEx: WorkoutExercise = {
        exerciseId: ex.id,
        exerciseName: ex.name,
        sets: [{ id: uuid(), weight: 0, reps: 0, completed: false }],
      };
      return { ...prev, exercises: [...prev.exercises, newEx] };
    });
    setPickerVisible(false);
  }, []);

  const handleCreateExercise = useCallback(
    (ex: Exercise) => {
      addExercise(ex);
      addExerciseToDraft(ex);
      setCreateVisible(false);
    },
    [addExercise, addExerciseToDraft]
  );

  const addedIds = draft?.exercises.map((e) => e.exerciseId) ?? [];

  if (!workout || !draft) return null;

  return (
    <Modal
      visible={!!workout}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            style={styles.headerBtn}
            android_ripple={{ color: C.ripple, radius: 24, borderless: true }}
          >
            <X size={20} color={C.textSecondary} />
          </Pressable>

          <View style={styles.headerCenter}>
            <Pencil size={13} color={C.emerald} />
            <Text style={styles.headerTitle}>{formatDate(draft.date)}</Text>
          </View>

          <Pressable
            onPress={handleSave}
            style={[styles.headerBtn, styles.saveBtn]}
            android_ripple={{ color: C.ripple }}
          >
            <Text style={styles.saveBtnText}>Save</Text>
          </Pressable>
        </View>

        {/* Body */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={[
              styles.list,
              { paddingBottom: Math.max(insets.bottom, 24) },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {draft.exercises.map((ex, exIdx) => {
              const completedCount = ex.sets.filter((s) => s.completed).length;
              return (
                <View key={exIdx} style={styles.exCard}>
                  <View style={styles.exHeader}>
                    <View style={styles.exHeaderLeft}>
                      <Text style={styles.exName}>{ex.exerciseName}</Text>
                      <Text style={styles.exMeta}>
                        {completedCount}/{ex.sets.length} sets completed
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => removeExercise(exIdx)}
                      style={styles.removeExBtn}
                      android_ripple={{ color: 'rgba(239,68,68,0.15)', radius: 18, borderless: true }}
                    >
                      <X size={16} color={C.textMuted} />
                    </Pressable>
                  </View>

                  {ex.sets.length > 0 && (
                    <View style={styles.colHeaders}>
                      <View style={{ width: 24 }} />
                      <Text style={[styles.colLabel, { flex: 1, textAlign: 'center' }]}>WEIGHT</Text>
                      <Text style={[styles.colLabel, { flex: 1, textAlign: 'center' }]}>REPS</Text>
                      <View style={{ width: 68 }} />
                    </View>
                  )}

                  {ex.sets.map((set, sIdx) => (
                    <SetRow
                      key={set.id}
                      set={set}
                      index={sIdx}
                      unit="lbs"
                      onUpdate={(updated) => updateSet(exIdx, updated)}
                      onRemove={() => removeSet(exIdx, set.id)}
                      onToggle={() => toggleSet(exIdx, set.id)}
                    />
                  ))}

                  <Pressable
                    style={styles.addSetBtn}
                    onPress={() => addSet(exIdx)}
                    android_ripple={{ color: C.ripple }}
                  >
                    <Plus size={15} color={C.emerald} strokeWidth={2.5} />
                    <Text style={styles.addSetText}>Add Set</Text>
                  </Pressable>
                </View>
              );
            })}

            {/* Add exercise button */}
            <Pressable
              style={styles.addExBtn}
              onPress={() => setPickerVisible(true)}
              android_ripple={{ color: C.ripple }}
            >
              <Plus size={16} color={C.textPrimary} strokeWidth={2.5} />
              <Text style={styles.addExText}>Add Exercise</Text>
            </Pressable>

            {/* Notes */}
            <View style={styles.notesCard}>
              <Text style={styles.notesLabel}>WORKOUT NOTES</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="How did it go? Any pains or PRs?"
                placeholderTextColor={C.textMuted}
                multiline
                value={draft.notes ?? ''}
                onChangeText={(t) =>
                  setDraft((prev) => (prev ? { ...prev, notes: t } : prev))
                }
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <ExercisePicker
        visible={pickerVisible}
        exercises={exercises}
        addedIds={addedIds}
        onSelect={addExerciseToDraft}
        onClose={() => setPickerVisible(false)}
        onCreateNew={() => {
          setPickerVisible(false);
          setCreateVisible(true);
        }}
      />

      <AddExerciseModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onSave={handleCreateExercise}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: C.borderSubtle,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  saveBtn: { width: 'auto' as any, paddingHorizontal: 16, backgroundColor: C.emeraldDim, borderRadius: 12 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  list: { padding: 16, gap: 0 },

  exCard: {
    backgroundColor: C.bgCard,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.borderSubtle,
    padding: 12,
  },
  exHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  exHeaderLeft: { gap: 2 },
  exName: { fontSize: 16, fontWeight: '700', color: C.textPrimary },
  exMeta: { fontSize: 12, color: C.textSecondary },
  removeExBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },

  colHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  colLabel: { fontSize: 10, fontWeight: '700', color: C.textMuted, letterSpacing: 0.8 },

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
  addSetText: { color: C.emerald, fontSize: 14, fontWeight: '600' },

  addExBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: C.bgElevated,
    marginBottom: 16,
  },
  addExText: { color: C.textPrimary, fontSize: 15, fontWeight: '600' },

  notesCard: {
    backgroundColor: C.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    padding: 14,
    gap: 8,
  },
  notesLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 0.8 },
  notesInput: {
    color: C.textPrimary,
    fontSize: 14,
    minHeight: 64,
    textAlignVertical: 'top',
  },
});
