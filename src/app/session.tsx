import { useEffect, useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useActiveSessionStore } from '../store/activeSessionStore';
import { useHistoryStore } from '../store/historyStore';
import { useSettingsStore } from '../store/settingsStore';
import { formatVolume } from '../utils/units';
import { buildExerciseIndex } from '../services/historyService';
import { Button } from '../components/common/Button';
import { ExerciseCard } from '../components/session/ExerciseCard';
import { ExercisePicker } from '../components/session/ExercisePicker';
import { SessionTimer } from '../components/session/SessionTimer';
import {
  addExercise, addSet, removeExercise, removeSet,
  setSetFailure, setSetRir, toggleSetCompleted, updateSetValues,
} from '../services/sessionService';
import { validateSessionForFinish } from '../utils/validation';
import { completedSetCount, sessionVolume } from '../utils/volume';
import { colors, spacing } from '../theme/theme';
import { useState } from 'react';

export default function Session() {
  const router = useRouter();
  const session = useActiveSessionStore((s) => s.session);
  const update = useActiveSessionStore((s) => s.update);
  const unit = useSettingsStore((s) => s.weightUnit);
  const [picking, setPicking] = useState(false);
  const sessions = useHistoryStore((s) => s.sessions);
  const index = useMemo(() => buildExerciseIndex(sessions), [sessions]);

  useEffect(() => {
    void useActiveSessionStore.getState().start();
  }, []);

  if (!session) return <View style={{ flex: 1 }} />;

  const confirmFinish = () => {
    if (!validateSessionForFinish(session).ok) {
      Alert.alert('Nada que guardar', 'Completa al menos una serie con repeticiones para finalizar.');
      return;
    }
    Alert.alert('Finalizar entrenamiento', '¿Guardar esta sesión? Las series sin completar se descartarán.', [
      { text: 'Seguir entrenando', style: 'cancel' },
      {
        text: 'Finalizar',
        onPress: async () => {
          if (await useActiveSessionStore.getState().finish()) router.back();
        },
      },
    ]);
  };

  const confirmDiscard = () => {
    Alert.alert('Descartar sesión', 'Se perderá todo lo registrado. ¿Continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: async () => {
          await useActiveSessionStore.getState().discard();
          router.back();
        },
      },
    ]);
  };

  const minimize = async () => {
    await useActiveSessionStore.getState().flush();
    router.back();
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <View>
          <SessionTimer startedAt={session.startedAt} />
          <Text style={styles.summary}>
            {completedSetCount(session)} series · {formatVolume(sessionVolume(session), unit)}
          </Text>
        </View>
        <Button label="Finalizar" onPress={confirmFinish} style={{ paddingVertical: 10 }} />
      </View>

      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        {session.exercises.length === 0 && (
          <Text style={styles.empty}>Agrega tu primer ejercicio para empezar a registrar series.</Text>
        )}
        {session.exercises.map((ex, i) => (
          <ExerciseCard
            key={`${ex.exerciseId}-${i}`}
            exercise={ex}
            history={index.get(ex.exerciseId) ?? []}
            onValues={(id, patch) => update((s) => updateSetValues(s, i, id, patch))}
            onRir={(id, r) => update((s) => setSetRir(s, i, id, r))}
            onFailure={(id, f) => update((s) => setSetFailure(s, i, id, f))}
            onToggle={(id) => update((s) => toggleSetCompleted(s, i, id))}
            onRemoveSet={(id) => update((s) => removeSet(s, i, id))}
            onAddSet={() => update((s) => addSet(s, i))}
            onRemoveExercise={() =>
              Alert.alert(ex.name, '¿Quitar este ejercicio de la sesión?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Quitar', style: 'destructive', onPress: () => update((s) => removeExercise(s, i)) },
              ])
            }
          />
        ))}
        <Button label="Agregar ejercicio" variant="secondary" onPress={() => setPicking(true)} />
        <Button label="Minimizar (sigue guardada)" variant="secondary" onPress={minimize} />
        <Button label="Descartar sesión" variant="secondary" onPress={confirmDiscard} />
      </ScrollView>

      <ExercisePicker
        visible={picking}
        onClose={() => setPicking(false)}
        onPick={(ex) => update((s) => addExercise(s, ex))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, paddingTop: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  summary: { color: colors.textMuted, marginTop: 2 },
  list: { padding: spacing.md, gap: spacing.md, paddingBottom: 60 },
  empty: { color: colors.textMuted, textAlign: 'center', marginVertical: spacing.lg },
});
