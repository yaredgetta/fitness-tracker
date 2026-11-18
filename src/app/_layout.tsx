import { useEffect } from 'react';
import { AppState, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useUserStore } from '../store/userStore';
import { useHistoryStore } from '../store/historyStore';
import { useActiveSessionStore } from '../store/activeSessionStore';
import { useSettingsStore } from '../store/settingsStore';
import { useCustomExerciseStore } from '../store/customExerciseStore';
import { colors } from '../theme/theme';

export default function RootLayout() {
  const userReady = useUserStore((s) => s.hydrated);
  const historyReady = useHistoryStore((s) => s.hydrated);
  const activeReady = useActiveSessionStore((s) => s.hydrated);
  const settingsReady = useSettingsStore((s) => s.hydrated);
  const customReady = useCustomExerciseStore((s) => s.hydrated);

  useEffect(() => {
    void useUserStore.getState().hydrate();
    void useHistoryStore.getState().hydrate();
    void useActiveSessionStore.getState().hydrate();
    void useSettingsStore.getState().hydrate();
    void useCustomExerciseStore.getState().hydrate();
  }, []);

  // Al salir de la app, escribe de inmediato lo que esté pendiente de guardar.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') void useActiveSessionStore.getState().flush();
    });
    return () => sub.remove();
  }, []);

  if (!userReady || !historyReady || !activeReady || !settingsReady || !customReady) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="session" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}
