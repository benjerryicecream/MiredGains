import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Platform,
} from 'react-native';
import { Check, Minus, Plus, Trash2 } from 'lucide-react-native';
import C from '../constants/colors';
import { WorkoutSet } from '../types';

interface SetRowProps {
  set: WorkoutSet;
  index: number;
  unit: string;
  onUpdate: (set: WorkoutSet) => void;
  onRemove: () => void;
  onToggle: () => void;
}

export default function SetRow({
  set,
  index,
  unit,
  onUpdate,
  onRemove,
  onToggle,
}: SetRowProps) {
  const step = (field: 'weight' | 'reps', delta: number) => {
    const precision = field === 'weight' ? 1 : 1;
    const value = Math.max(0, parseFloat(((set[field] ?? 0) + delta).toFixed(precision)));
    onUpdate({ ...set, [field]: value });
  };

  const handleWeightChange = (text: string) => {
    const val = parseFloat(text);
    if (!isNaN(val)) onUpdate({ ...set, weight: val });
    else if (text === '' || text === '-') onUpdate({ ...set, weight: 0 });
  };

  const handleRepsChange = (text: string) => {
    const val = parseInt(text, 10);
    if (!isNaN(val)) onUpdate({ ...set, reps: val });
    else if (text === '') onUpdate({ ...set, reps: 0 });
  };

  return (
    <View style={[styles.row, set.completed && styles.rowCompleted]}>
      {/* Set index badge */}
      <View style={[styles.badge, set.completed && styles.badgeDone]}>
        <Text style={[styles.badgeText, set.completed && styles.badgeTextDone]}>
          {index + 1}
        </Text>
      </View>

      {/* Weight column */}
      <View style={styles.col}>
        <View style={styles.stepperRow}>
          <Stepper onPress={() => step('weight', -2.5)} />
          <View style={styles.inputWrap}>
            <TextInput
              style={[styles.numInput, set.completed && styles.numInputDone]}
              value={set.weight === 0 ? '' : String(set.weight)}
              onChangeText={handleWeightChange}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={C.textMuted}
              selectTextOnFocus
            />
            <Text style={styles.unit}>{unit}</Text>
          </View>
          <Stepper onPress={() => step('weight', 2.5)} plus />
        </View>
      </View>

      {/* Reps column */}
      <View style={styles.col}>
        <View style={styles.stepperRow}>
          <Stepper onPress={() => step('reps', -1)} />
          <TextInput
            style={[styles.numInput, styles.repsInput, set.completed && styles.numInputDone]}
            value={set.reps === 0 ? '' : String(set.reps)}
            onChangeText={handleRepsChange}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={C.textMuted}
            selectTextOnFocus
          />
          <Stepper onPress={() => step('reps', 1)} plus />
        </View>
      </View>

      {/* Done checkbox */}
      <Pressable
        onPress={onToggle}
        android_ripple={{ color: C.ripple, radius: 20, borderless: true }}
        style={[styles.checkBtn, set.completed && styles.checkBtnDone]}
      >
        <Check size={16} color={set.completed ? '#fff' : C.textMuted} strokeWidth={2.5} />
      </Pressable>

      {/* Delete */}
      <Pressable
        onPress={onRemove}
        android_ripple={{ color: 'rgba(239,68,68,0.15)', radius: 20, borderless: true }}
        style={styles.deleteBtn}
      >
        <Trash2 size={15} color={C.textMuted} />
      </Pressable>
    </View>
  );
}

function Stepper({ onPress, plus }: { onPress: () => void; plus?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: C.ripple, radius: 18, borderless: true }}
      style={styles.stepper}
    >
      {plus ? (
        <Plus size={14} color={C.textSecondary} strokeWidth={2.5} />
      ) : (
        <Minus size={14} color={C.textSecondary} strokeWidth={2.5} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: C.bg,
    marginBottom: 6,
  },
  rowCompleted: {
    backgroundColor: C.emeraldBg,
  },

  badge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: C.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDone: { backgroundColor: C.emeraldDim },
  badgeText: { fontSize: 11, fontWeight: '700', color: C.textSecondary },
  badgeTextDone: { color: '#fff' },

  col: { flex: 1 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  stepper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },

  inputWrap: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 2 },

  numInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: C.textPrimary,
    paddingVertical: 4,
    minWidth: 38,
  },
  repsInput: { flex: 0, minWidth: 38 },
  numInputDone: { color: C.emerald },

  unit: { fontSize: 10, color: C.textMuted, fontWeight: '500' },

  checkBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnDone: {
    backgroundColor: C.emeraldDim,
    borderColor: C.emeraldDim,
  },

  deleteBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
