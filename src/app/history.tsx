import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { MUSCLE_LABELS_ES } from '../models/muscle';
import type { SessionExercise, WorkoutSession } from '../models/session';
import { groupSessionsByDay } from '../services/historyDayService';
import { summarizeEntry } from '../services/progressionService';
import { useHistoryStore } from '../store/historyStore';
import { useSettingsStore } from '../store/settingsStore';
import { useUserStore } from '../store/userStore';
import { Card } from '../components/common/Card';
import { BottomBar } from '../components/common/BottomBar';
import { UnitToggle } from '../components/common/UnitToggle';
import { formatDuration } from '../utils/dates';
import { formatVolume, formatWeight } from '../utils/units';
import { completedSetCount, sessionVolume } from '../utils/volume';
import type { WeightUnit } from '../models/settings';
import { colors, radius, spacing } from '../theme/theme';

const dayTitle = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const time = (iso: string) => new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

function ExerciseBlock({ exercise, expanded, unit }: { exercise: SessionExercise; expanded: boolean; unit: WeightUnit }) {
  const top = summarizeEntry({ sessionId: '', date: '', exercise }).topSet;
  return (
    <View style={styles.exBlock}>
      <View style={styles.exHead}>
        <Text style={styles.exName} numberOfLines={1}>{exercise.name}</Text>
        <Text style={styles.exMeta}>
          {exercise.sets.length} series · mejor {formatWeight(top.weight, unit)} × {top.reps}
        </Text>
      </View>
      {expanded &&
        exercise.sets.map((s) => (
          <Text key={s.id} style={styles.setLine}>
            {s.setNumber}.  {formatWeight(s.weight, unit)} × {s.reps}
            {s.failure ? '  · fallo' : s.rir !== null ? `  · RIR ${s.rir}` : ''}
          </Text>
        ))}
    </View>
  );
}

function SessionCard({ session, unit, onDelete }: { session: WorkoutSession; unit: WeightUnit; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card style={{ gap: spacing.sm }}>
      <Pressable onPress={() => setExpanded(!expanded)} onLongPress={onDelete} delayLongPress={600}>
        <View style={styles.sessionHead}>
          <Text style={styles.sessionTime}>{time(session.startedAt)} · {formatDuration(session.durationSec)}</Text>
          <Text style={styles.sessionVol}>{formatVolume(sessionVolume(session), unit)}</Text>
        </View>
        <Text style={styles.muted}>
          {session.exercises.length} ejercicios · {completedSetCount(session)} series
        </Text>
      </Pressable>
      {session.exercises.map((e, i) => (
        <ExerciseBlock key={`${e.exerciseId}-${i}`} exercise={e} expanded={expanded} unit={unit} />
      ))}
      <Text style={styles.hint}>{expanded ? 'Toca para contraer · mantén pulsado para eliminar' : 'Toca para ver todas las series'}</Text>
    </Card>
  );
}

export default function History() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const sessions = useHistoryStore((s) => s.sessions);
  const removeSession = useHistoryStore((s) => s.removeSession);
  const unit = useSettingsStore((s) => s.weightUnit);
  const days = useMemo(() => groupSessionsByDay(sessions), [sessions]);

  if (!user) return <Redirect href="/welcome" />;

  const confirmDelete = (s: WorkoutSession) =>
    Alert.alert('Eliminar sesión', 'Se borrará de tu historial y de las estadísticas. No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => void removeSession(s.id) },
    ]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Historial</Text>
          <UnitToggle />
        </View>

        {days.length === 0 && (
          <Text style={styles.muted}>Aún no hay entrenamientos. Cuando finalices una sesión aparecerá aquí, agrupada por día.</Text>
        )}

        {days.map((day) => (
          <View key={day.dayKey} style={{ gap: spacing.sm }}>
            <View>
              <Text style={styles.dayTitle}>{dayTitle(day.date)}</Text>
              <Text style={styles.muted}>
                {day.sessions.length > 1 ? `${day.sessions.length} sesiones · ` : ''}
                {day.sets} series · {formatVolume(day.volume, unit)}
              </Text>
              <Text style={styles.muscles}>{day.muscles.map((m) => MUSCLE_LABELS_ES[m]).join(', ')}</Text>
            </View>
            {day.sessions.map((s) => (
              <SessionCard key={s.id} session={s} unit={unit} onDelete={() => confirmDelete(s)} />
            ))}
          </View>
        ))}
      </ScrollView>
      <BottomBar
        active="history"
        onDashboard={() => router.replace('/dashboard')}
        onSession={() => router.push('/session')}
        onHistory={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingTop: 70, gap: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  dayTitle: { color: colors.text, fontSize: 17, fontWeight: '800', textTransform: 'capitalize' },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  muscles: { color: colors.accent, fontSize: 12, marginTop: 2 },
  sessionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  sessionTime: { color: colors.text, fontWeight: '700', fontSize: 15 },
  sessionVol: { color: colors.accent, fontWeight: '800' },
  exBlock: { backgroundColor: colors.surfaceRaised, borderRadius: radius.md, padding: spacing.sm + 2, gap: 4 },
  exHead: { gap: 2 },
  exName: { color: colors.text, fontWeight: '700' },
  exMeta: { color: colors.textMuted, fontSize: 12 },
  setLine: { color: colors.textMuted, fontSize: 13, paddingLeft: 4 },
  hint: { color: colors.textMuted, fontSize: 11 },
});
