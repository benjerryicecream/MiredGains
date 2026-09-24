import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  X,
  Calendar,
  Clock,
  Bell,
  Dumbbell,
  Plus,
  Trash2,
  BookmarkPlus,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import C from '../constants/colors';
import { useApp } from '../context/AppContext';
import { useNotifications } from '../hooks/useNotifications';
import Button from './ui/Button';
import StyledInput from './ui/StyledInput';
import { PlannedExercise, TargetSet, WorkoutTemplate, ScheduledWorkout } from '../types';
import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';

interface ScheduleWorkoutModalProps {
  visible: boolean;
  onClose: () => void;
  onScheduled?: () => void;
  editing?: ScheduledWorkout | null;
}

const TEMPLATE_TITLES = ['Push Day', 'Pull Day', 'Leg Day', 'Full Body', 'Upper Body', 'Cardio & Core'];

const TIME_SLOTS = [
  { label: '7:00 AM', value: '07:00' },
  { label: '8:30 AM', value: '08:30' },
  { label: '12:00 PM', value: '12:00' },
  { label: '5:30 PM', value: '17:30' },
  { label: '7:00 PM', value: '19:00' },
];

function getRelativeDateStr(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getRelativeDateLabel(daysOffset: number): string {
  if (daysOffset === 0) return 'Today';
  if (daysOffset === 1) return 'Tomorrow';
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

export default function ScheduleWorkoutModal({
  visible,
  onClose,
  onScheduled,
  editing = null,
}: ScheduleWorkoutModalProps) {
  const insets = useSafeAreaInsets();
  const { exercises, templates, scheduleWorkout, updateScheduledWorkout, addTemplate, unit } = useApp();
  const { scheduleWorkoutNotification, cancelNotification } = useNotifications();

  const [title, setTitle] = useState('');
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(1);
  const [selectedTime, setSelectedTime] = useState<string>('08:30');
  const [customDate, setCustomDate] = useState<string>('');
  const [plannedExercises, setPlannedExercises] = useState<PlannedExercise[]>([]);
  const [error, setError] = useState('');

  const resetForm = () => {
    setTitle('');
    setSelectedDayOffset(1);
    setSelectedTime('08:30');
    setCustomDate('');
    setPlannedExercises([]);
    setError('');
  };

  // Prefill when editing an existing scheduled workout, reset when creating
  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setTitle(editing.title);
      setCustomDate(editing.date);
      setSelectedDayOffset(1);
      setSelectedTime(editing.time);
      setPlannedExercises(editing.plannedExercises ?? []);
      setError('');
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editing]);

  const handleAddExerciseToPlan = (exId: string) => {
    const ex = exercises.find((e) => e.id === exId);
    if (!ex) return;

    if (plannedExercises.some((pe) => pe.exerciseId === ex.id)) {
      // Remove if already added
      setPlannedExercises((prev) => prev.filter((pe) => pe.exerciseId !== ex.id));
    } else {
      // Add with 3 default target sets
      const defaultSets: TargetSet[] = [
        { id: uuid(), targetWeight: 135, targetReps: 10 },
        { id: uuid(), targetWeight: 135, targetReps: 10 },
        { id: uuid(), targetWeight: 135, targetReps: 10 },
      ];
      setPlannedExercises((prev) => [
        ...prev,
        { exerciseId: ex.id, exerciseName: ex.name, targetSets: defaultSets },
      ]);
    }
  };

  const handleAddTargetSet = (exId: string) => {
    setPlannedExercises((prev) =>
      prev.map((pe) => {
        if (pe.exerciseId !== exId) return pe;
        const lastSet = pe.targetSets[pe.targetSets.length - 1];
        const newSet: TargetSet = {
          id: uuid(),
          targetWeight: lastSet ? lastSet.targetWeight : 135,
          targetReps: lastSet ? lastSet.targetReps : 10,
        };
        return { ...pe, targetSets: [...pe.targetSets, newSet] };
      })
    );
  };

  const handleUpdateTargetSet = (exId: string, setId: string, field: 'targetWeight' | 'targetReps', val: number) => {
    setPlannedExercises((prev) =>
      prev.map((pe) => {
        if (pe.exerciseId !== exId) return pe;
        return {
          ...pe,
          targetSets: pe.targetSets.map((ts) =>
            ts.id === setId ? { ...ts, [field]: isNaN(val) ? 0 : val } : ts
          ),
        };
      })
    );
  };

  const handleRemoveTargetSet = (exId: string, setId: string) => {
    setPlannedExercises((prev) =>
      prev.map((pe) => {
        if (pe.exerciseId !== exId) return pe;
        return {
          ...pe,
          targetSets: pe.targetSets.filter((ts) => ts.id !== setId),
        };
      })
    );
  };

  const handleLoadTemplate = (template: WorkoutTemplate) => {
    setTitle(template.name);
    setPlannedExercises(template.plannedExercises);
  };

  const handleSaveAsTemplate = () => {
    const templateTitle = title.trim() || 'My Preset Routine';
    if (plannedExercises.length === 0) {
      Alert.alert('Empty Routine', 'Add at least one exercise to save a template.');
      return;
    }

    addTemplate({
      id: uuid(),
      name: templateTitle,
      plannedExercises,
    });

    Alert.alert('Template Saved! ⭐', `"${templateTitle}" was saved to your reusable routine templates.`);
  };

  const handleSchedule = async () => {
    const workoutTitle = title.trim();
    if (!workoutTitle) {
      setError('Please enter or select a workout name.');
      return;
    }

    const dateStr = customDate.trim() ? customDate.trim() : getRelativeDateStr(selectedDayOffset);
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      setError('Invalid date format. Use YYYY-MM-DD.');
      return;
    }

    const targetDate = new Date(`${dateStr}T${selectedTime.padStart(5, '0')}:00`);

    if (isNaN(targetDate.getTime())) {
      setError('Invalid date or time.');
      return;
    }

    if (targetDate.getTime() <= Date.now()) {
      setError('Scheduled time must be in the future.');
      return;
    }

    // Schedule Android notification
    const notificationId = await scheduleWorkoutNotification(workoutTitle, targetDate);

    if (editing) {
      // Cancel the old alert and replace the scheduled workout in place
      await cancelNotification(editing.notificationId);
      updateScheduledWorkout({
        ...editing,
        title: workoutTitle,
        date: dateStr,
        time: selectedTime,
        scheduledAt: targetDate.toISOString(),
        plannedExercises,
        exerciseIds: plannedExercises.map((pe) => pe.exerciseId),
        notificationId,
      });

      Alert.alert(
        'Workout Updated! ✏️',
        `"${workoutTitle}" is now scheduled for ${targetDate.toLocaleDateString()} at ${targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        [{ text: 'OK' }]
      );
    } else {
      // Save scheduled workout to App Context & AsyncStorage
      const newScheduledWorkout = {
        id: uuid(),
        title: workoutTitle,
        date: dateStr,
        time: selectedTime,
        scheduledAt: targetDate.toISOString(),
        plannedExercises,
        exerciseIds: plannedExercises.map((pe) => pe.exerciseId),
        notificationId,
        completed: false,
      };

      scheduleWorkout(newScheduledWorkout);

      Alert.alert(
        'Workout Scheduled! 🔔',
        `"${workoutTitle}" is scheduled for ${targetDate.toLocaleDateString()} at ${targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.\nAn Android alert will notify you!`,
        [{ text: 'OK' }]
      );
    }

    resetForm();
    onClose();
    if (onScheduled) onScheduled();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}
      >
        {/* Handle */}
        <View style={styles.handle} />

        {/* Title row */}
        <View style={styles.titleRow}>
          <View style={styles.titleWithIcon}>
            <Bell size={22} color={C.emerald} strokeWidth={2.5} />
            <Text style={styles.title}>{editing ? 'Edit Scheduled Workout' : 'Schedule & Plan Workout'}</Text>
          </View>
          <Pressable
            onPress={handleClose}
            android_ripple={{ color: C.ripple, radius: 20, borderless: true }}
            style={styles.closeBtn}
          >
            <X size={20} color={C.textSecondary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Saved Templates Row if available */}
          {templates.length > 0 && (
            <View style={styles.chipGroup}>
              <Text style={styles.groupLabel}>SAVED ROUTINE TEMPLATES</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsWrap}>
                {templates.map((tpl) => (
                  <Pressable
                    key={tpl.id}
                    onPress={() => handleLoadTemplate(tpl)}
                    android_ripple={{ color: C.ripple }}
                    style={styles.templateChip}
                  >
                    <Layers size={13} color={C.emerald} />
                    <Text style={styles.templateChipText}>{tpl.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Workout Title Input */}
          <StyledInput
            label="Workout Name"
            value={title}
            onChangeText={(t) => { setTitle(t); setError(''); }}
            placeholder="e.g. Morning Heavy Chest & Triceps"
            returnKeyType="done"
          />

          {/* Title Templates */}
          <View style={styles.chipGroup}>
            <Text style={styles.groupLabel}>QUICK PRESETS</Text>
            <View style={styles.chipsWrap}>
              {TEMPLATE_TITLES.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => { setTitle(t); setError(''); }}
                  android_ripple={{ color: C.ripple }}
                  style={[styles.chip, title === t && styles.chipActive]}
                >
                  <Text style={[styles.chipText, title === t && styles.chipTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Date Selector */}
          <View style={styles.chipGroup}>
            <Text style={styles.groupLabel}>SELECT DATE</Text>
            <View style={styles.chipsWrap}>
              {[0, 1, 2, 3, 7].map((offset) => {
                const label = getRelativeDateLabel(offset);
                const isSelected = selectedDayOffset === offset && !customDate;
                return (
                  <Pressable
                    key={offset}
                    onPress={() => {
                      setSelectedDayOffset(offset);
                      setCustomDate('');
                      setError('');
                    }}
                    android_ripple={{ color: C.ripple }}
                    style={[styles.chip, isSelected && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <StyledInput
              label="OR CUSTOM DATE"
              value={customDate}
              onChangeText={(t) => { setCustomDate(t); setError(''); }}
              placeholder="YYYY-MM-DD"
              maxLength={10}
              autoCapitalize="none"
            />
          </View>

          {/* Time Selector */}
          <View style={styles.chipGroup}>
            <Text style={styles.groupLabel}>SELECT ALERT TIME</Text>
            <View style={styles.chipsWrap}>
              {TIME_SLOTS.map((slot) => {
                const isSelected = selectedTime === slot.value;
                return (
                  <Pressable
                    key={slot.value}
                    onPress={() => {
                      setSelectedTime(slot.value);
                      setError('');
                    }}
                    android_ripple={{ color: C.ripple }}
                    style={[styles.chip, isSelected && styles.chipActive]}
                  >
                    <Clock size={12} color={isSelected ? C.emerald : C.textMuted} />
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {slot.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Exercise Selection */}
          <View style={styles.chipGroup}>
            <Text style={styles.groupLabel}>SELECT EXERCISES TO PRE-PLAN</Text>
            <View style={styles.chipsWrap}>
              {exercises.map((ex) => {
                const isSelected = plannedExercises.some((pe) => pe.exerciseId === ex.id);
                return (
                  <Pressable
                    key={ex.id}
                    onPress={() => handleAddExerciseToPlan(ex.id)}
                    android_ripple={{ color: C.ripple }}
                    style={[styles.chip, isSelected && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {isSelected ? '✓ ' : ''}{ex.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Pre-Plan Target Sets per Exercise */}
          {plannedExercises.length > 0 && (
            <View style={styles.prePlanSection}>
              <View style={styles.prePlanHeader}>
                <Text style={styles.groupLabel}>PRE-PLAN TARGET WEIGHTS & REPS</Text>
                <Pressable onPress={handleSaveAsTemplate} style={styles.saveTemplateBtn}>
                  <BookmarkPlus size={14} color={C.emerald} />
                  <Text style={styles.saveTemplateBtnText}>Save Template</Text>
                </Pressable>
              </View>

              {plannedExercises.map((pe) => (
                <View key={pe.exerciseId} style={styles.planCard}>
                  <View style={styles.planCardHeader}>
                    <Text style={styles.planCardTitle}>{pe.exerciseName}</Text>
                    <Pressable
                      onPress={() => handleAddExerciseToPlan(pe.exerciseId)}
                      style={styles.removeExBtn}
                    >
                      <Trash2 size={15} color={C.danger} />
                    </Pressable>
                  </View>

                  {/* Target Sets List */}
                  {pe.targetSets.map((ts, idx) => (
                    <View key={ts.id} style={styles.targetSetRow}>
                      <Text style={styles.setIndexLabel}>Set {idx + 1}</Text>
                      <View style={styles.targetInputGroup}>
                        <TextInput
                          style={styles.targetInput}
                          keyboardType="decimal-pad"
                          value={String(ts.targetWeight)}
                          onChangeText={(v) =>
                            handleUpdateTargetSet(pe.exerciseId, ts.id, 'targetWeight', parseFloat(v))
                          }
                        />
                        <Text style={styles.targetUnitLabel}>{unit}</Text>
                      </View>
                      <Text style={styles.xLabel}>×</Text>
                      <View style={styles.targetInputGroup}>
                        <TextInput
                          style={styles.targetInput}
                          keyboardType="number-pad"
                          value={String(ts.targetReps)}
                          onChangeText={(v) =>
                            handleUpdateTargetSet(pe.exerciseId, ts.id, 'targetReps', parseInt(v, 10))
                          }
                        />
                        <Text style={styles.targetUnitLabel}>reps</Text>
                      </View>

                      <Pressable
                        onPress={() => handleRemoveTargetSet(pe.exerciseId, ts.id)}
                        style={styles.removeSetBtn}
                      >
                        <X size={14} color={C.textMuted} />
                      </Pressable>
                    </View>
                  ))}

                  <Pressable
                    style={styles.addTargetSetBtn}
                    onPress={() => handleAddTargetSet(pe.exerciseId)}
                  >
                    <Plus size={14} color={C.emerald} />
                    <Text style={styles.addTargetSetText}>Add Target Set</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Submit Button */}
          <Button
            label="Schedule Workout & Set Alert"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleSchedule}
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
    maxHeight: '92%',
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
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 28,
  },
  chipGroup: {
    gap: 8,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 0.8,
  },
  templateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: C.emeraldBg,
  },
  templateChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.emerald,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: C.bgElevated,
  },
  chipActive: {
    backgroundColor: C.emeraldBg,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.textSecondary,
  },
  chipTextActive: {
    color: C.emerald,
    fontWeight: '700',
  },

  // Pre-Plan Cards
  prePlanSection: {
    gap: 12,
    marginTop: 4,
  },
  prePlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saveTemplateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  saveTemplateBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.emerald,
  },
  planCard: {
    backgroundColor: C.bgInput,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textPrimary,
  },
  removeExBtn: {
    padding: 4,
  },
  targetSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setIndexLabel: {
    width: 44,
    fontSize: 12,
    fontWeight: '700',
    color: C.textMuted,
  },
  targetInputGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bgCard,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  targetInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: C.textPrimary,
    padding: 2,
    textAlign: 'center',
  },
  targetUnitLabel: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: '600',
  },
  xLabel: {
    fontSize: 14,
    color: C.textMuted,
    fontWeight: '700',
  },
  removeSetBtn: {
    padding: 4,
  },
  addTargetSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  addTargetSetText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.emerald,
  },

  errorText: {
    color: C.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: 8,
  },
});
