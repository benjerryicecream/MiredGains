import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { Pencil, Trash2, Check, X } from 'lucide-react-native';
import C from '../constants/colors';
import { BodyweightEntry } from '../types';

interface BodyweightEntryRowProps {
  entry: BodyweightEntry;
  unit: string;
  onUpdate: (entry: BodyweightEntry) => void;
  onDelete: () => void;
}

function formatEntryDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function BodyweightEntryRow({
  entry,
  unit,
  onUpdate,
  onDelete,
}: BodyweightEntryRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(entry.weight));

  const commit = () => {
    const val = parseFloat(draft);
    if (!isNaN(val) && val > 0) {
      onUpdate({ ...entry, weight: val });
    }
    setEditing(false);
  };

  const cancel = () => {
    setDraft(String(entry.weight));
    setEditing(false);
  };

  const confirmDelete = () =>
    Alert.alert('Delete Entry', 'Remove this bodyweight entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);

  return (
    <View style={styles.row}>
      <Text style={styles.date}>{formatEntryDate(entry.date)}</Text>

      {editing ? (
        <View style={styles.editRow}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            keyboardType="decimal-pad"
            selectTextOnFocus
            autoFocus
            onSubmitEditing={commit}
          />
          <Text style={styles.unit}>{unit}</Text>
          <Pressable onPress={commit} style={styles.iconBtn} android_ripple={{ color: C.ripple, radius: 16, borderless: true }}>
            <Check size={16} color={C.emerald} strokeWidth={2.5} />
          </Pressable>
          <Pressable onPress={cancel} style={styles.iconBtn} android_ripple={{ color: C.ripple, radius: 16, borderless: true }}>
            <X size={16} color={C.textMuted} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.viewRow}>
          <Text style={styles.weight}>
            {entry.weight}
            <Text style={styles.unit}> {unit}</Text>
          </Text>
          <Pressable onPress={() => setEditing(true)} style={styles.iconBtn} android_ripple={{ color: C.ripple, radius: 16, borderless: true }}>
            <Pencil size={14} color={C.textMuted} />
          </Pressable>
          <Pressable onPress={confirmDelete} style={styles.iconBtn} android_ripple={{ color: 'rgba(239,68,68,0.15)', radius: 16, borderless: true }}>
            <Trash2 size={14} color={C.textMuted} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: C.bgCard,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: C.borderSubtle,
  },
  date: { fontSize: 14, color: C.textSecondary, fontWeight: '500', flex: 1 },
  viewRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  weight: { fontSize: 16, fontWeight: '700', color: C.textPrimary },
  unit: { fontSize: 12, color: C.textMuted },
  input: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
    borderBottomWidth: 1.5,
    borderColor: C.emerald,
    minWidth: 50,
    textAlign: 'right',
    paddingVertical: 2,
  },
  iconBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
