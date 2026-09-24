import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import C from '../constants/colors';
import { Exercise } from '../types';
import Button from './ui/Button';
import StyledInput from './ui/StyledInput';
import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';

const MUSCLE_GROUPS = [
  'Back', 'Chest', 'Shoulders', 'Biceps', 'Triceps',
  'Legs', 'Core', 'Glutes', 'Calves', 'Cardio', 'Other',
];

interface AddExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (exercise: Exercise) => void;
}

export default function AddExerciseModal({
  visible,
  onClose,
  onSave,
}: AddExerciseModalProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [error, setError] = useState('');

  const reset = () => {
    setName('');
    setMuscleGroup('');
    setError('');
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Exercise name is required.');
      return;
    }
    if (!muscleGroup) {
      setError('Select a muscle group.');
      return;
    }
    onSave({ id: uuid(), name: trimmed, muscleGroup, isCustom: true });
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
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
        style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}
      >
        {/* Handle */}
        <View style={styles.handle} />

        {/* Title row */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>New Exercise</Text>
          <Pressable onPress={handleClose} android_ripple={{ color: C.ripple, radius: 20, borderless: true }}>
            <X size={20} color={C.textSecondary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <StyledInput
            label="Exercise Name"
            value={name}
            onChangeText={(t) => { setName(t); setError(''); }}
            placeholder="e.g. Cable Fly"
            autoFocus
            returnKeyType="done"
          />

          <Text style={styles.groupLabel}>MUSCLE GROUP</Text>
          <View style={styles.chips}>
            {MUSCLE_GROUPS.map((g) => (
              <Pressable
                key={g}
                onPress={() => { setMuscleGroup(g); setError(''); }}
                android_ripple={{ color: C.ripple }}
                style={[
                  styles.chip,
                  muscleGroup === g && styles.chipSelected,
                ]}
              >
                <Text style={[styles.chipText, muscleGroup === g && styles.chipTextSelected]}>
                  {g}
                </Text>
              </Pressable>
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            label="Save Exercise"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleSave}
            style={styles.saveBtn}
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
    paddingBottom: 36,
    maxHeight: '85%',
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
    paddingVertical: 14,
  },
  title: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
  content: { paddingHorizontal: 20, gap: 16, paddingBottom: 12 },
  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textSecondary,
    letterSpacing: 0.8,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: C.bgElevated,
  },
  chipSelected: { backgroundColor: C.emeraldBg },
  chipText: { color: C.textSecondary, fontSize: 13, fontWeight: '500' },
  chipTextSelected: { color: C.emerald, fontWeight: '700' },
  error: { color: C.danger, fontSize: 13 },
  saveBtn: { marginTop: 8 },
});
