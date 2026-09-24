import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../context/AppContext';
import { WorkoutProvider } from '../context/WorkoutContext';
import C from '../constants/colors';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.root}>
        <AppProvider>
          <WorkoutProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }} />
          </WorkoutProvider>
        </AppProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
});
