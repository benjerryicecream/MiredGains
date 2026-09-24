import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MonitorSmartphone,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Server,
} from 'lucide-react-native';
import C from '../../constants/colors';
import { useApp } from '../../context/AppContext';
import { load, save } from '../../hooks/useStorage';
import Button from '../../components/ui/Button';
import StyledInput from '../../components/ui/StyledInput';

const SYNC_ADDR_KEY = 'mg:sync_address';
const LAST_SYNC_KEY = 'mg:last_sync';
const DEFAULT_ADDR = '192.168.5.24:8500';

function formatLastSync(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SyncScreen() {
  const {
    exercises,
    workouts,
    bodyweights,
    scheduledWorkouts,
    templates,
    unit,
    unitUpdatedAt,
    replaceAll,
  } = useApp();

  const [address, setAddress] = useState('');
  const [lastSync, setLastSync] = useState('');
  const [status, setStatus] = useState<'idle' | 'busy' | 'ok' | 'error'>('idle');

  useEffect(() => {
    (async () => {
      setAddress(await load(SYNC_ADDR_KEY, ''));
      setLastSync(await load(LAST_SYNC_KEY, ''));
    })();
  }, []);

  const handleSync = async () => {
    const addr = (address.trim() || DEFAULT_ADDR).replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!addr) return;

    setStatus('busy');
    try {
      const res = await fetch(`http://${addr}/api/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercises,
          workouts,
          bodyweights,
          scheduledWorkouts,
          templates,
          unit,
          unitUpdatedAt,
        }),
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const merged = await res.json();

      // Adopt the merged state (server records we didn't have yet)
      replaceAll({
        exercises: merged.exercises,
        workouts: merged.workouts,
        bodyweights: merged.bodyweights,
        scheduledWorkouts: merged.scheduledWorkouts,
        templates: merged.templates,
        unit: merged.unit,
        unitUpdatedAt: merged.unitUpdatedAt,
      });

      const stamp = new Date().toISOString();
      setLastSync(stamp);
      save(LAST_SYNC_KEY, stamp);
      save(SYNC_ADDR_KEY, addr);
      setStatus('ok');
    } catch (e) {
      setStatus('error');
      Alert.alert(
        'Sync Failed',
        `Could not reach the desktop server at "${addr}".\n\nMake sure the server is running on your PC and both devices are on the same Wi-Fi network.`
      );
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sync</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <MonitorSmartphone size={40} color={C.emerald} strokeWidth={1.5} />
          </View>
          <Text style={styles.introTitle}>Desktop Sync</Text>
          <Text style={styles.introSub}>
            Keep workouts, body weight, and scheduled sessions identical on
            your phone and desktop. Syncing merges both sides — nothing is
            overwritten.
          </Text>
        </View>

        <StyledInput
          label="DESKTOP ADDRESS"
          value={address}
          onChangeText={setAddress}
          placeholder={DEFAULT_ADDR}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="numbers-and-punctuation"
        />

        <Button
          label={status === 'busy' ? 'Syncing…' : 'Sync Now'}
          variant="primary"
          size="lg"
          icon={<RefreshCw size={18} color="#fff" />}
          onPress={handleSync}
          disabled={status === 'busy'}
        />

        {status !== 'idle' && status !== 'busy' && (
          <View style={styles.statusRow}>
            {status === 'ok' ? (
              <>
                <CheckCircle2 size={15} color={C.emerald} />
                <Text style={styles.statusOk}>
                  Synced{lastSync ? ` · ${formatLastSync(lastSync)}` : ''}
                </Text>
              </>
            ) : (
              <>
                <XCircle size={15} color={C.danger} />
                <Text style={styles.statusError}>Couldn't reach the desktop server</Text>
              </>
            )}
          </View>
        )}

        <View style={styles.helpCard}>
          <View style={styles.helpHeader}>
            <Server size={14} color={C.textSecondary} />
            <Text style={styles.helpTitle}>HOW IT WORKS</Text>
          </View>
          <Text style={styles.helpText}>
            1. On your PC, double-click{' '}
            <Text style={styles.helpCode}>desktop\start-desktop.bat</Text> (or
            run <Text style={styles.helpCode}>node desktop/server.mjs</Text>).
          </Text>
          <Text style={styles.helpText}>
            2. Open the desktop app at{' '}
            <Text style={styles.helpCode}>http://localhost:8500</Text>.
          </Text>
          <Text style={styles.helpText}>
            3. Connect your phone to the same Wi-Fi, then enter the PC's
            address here (shown in the server window, e.g.{' '}
            <Text style={styles.helpCode}>{DEFAULT_ADDR}</Text>) and tap
            Sync Now.
          </Text>
          <Text style={styles.helpNote}>
            The desktop app picks up changes automatically. On your phone,
            tap Sync Now to pull and push. Deleting items on one device will
            not delete them on the other.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: C.borderSubtle,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: C.textPrimary },

  content: { padding: 16, paddingBottom: 48, gap: 16 },

  introCard: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: C.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.borderSubtle,
  },
  introIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: C.emeraldBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  introTitle: { fontSize: 20, fontWeight: '700', color: C.textPrimary },
  introSub: {
    fontSize: 13,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statusOk: { fontSize: 13, fontWeight: '600', color: C.emerald },
  statusError: { fontSize: 13, fontWeight: '600', color: C.danger },

  helpCard: {
    backgroundColor: C.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    gap: 10,
  },
  helpHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  helpTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textSecondary,
    letterSpacing: 0.8,
  },
  helpText: { fontSize: 13, color: C.textSecondary, lineHeight: 20 },
  helpCode: {
    color: C.textPrimary,
    fontWeight: '600',
    fontSize: 12,
  },
  helpNote: {
    fontSize: 12,
    color: C.textMuted,
    lineHeight: 18,
    marginTop: 2,
  },
});
