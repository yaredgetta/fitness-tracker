import { StyleSheet, Text, View } from 'react-native';
import type { WorkoutSession } from '../../models/session';
import { MUSCLE_LABELS_ES } from '../../models/muscle';
import { completedSetCount, sessionVolume } from '../../utils/volume';
import { formatDuration } from '../../utils/dates';
import { Card } from '../common/Card';
import { formatVolume } from '../../utils/units';
import { useSettingsStore } from '../../store/settingsStore';
import { colors, spacing } from '../../theme/theme';

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export function LastSessionCard({ session }: { session: WorkoutSession | null }) {
  const unit = useSettingsStore((s) => s.weightUnit);
  if (!session) {
    return (
      <Card>
        <Text style={styles.title}>Última sesión</Text>
        <Text style={styles.empty}>Aún no hay entrenamientos. Empieza el primero y aquí verás tu resumen.</Text>
      </Card>
    );
  }
  const muscles = Array.from(new Set(session.exercises.map((e) => e.primaryMuscle)));
  const date = new Date(session.startedAt).toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  return (
    <Card>
      <Text style={styles.title}>Última sesión</Text>
      <Text style={styles.date}>{date}</Text>
      <View style={styles.row}>
        <Stat value={formatDuration(session.durationSec)} label="Duración" />
        <Stat value={String(session.exercises.length)} label="Ejercicios" />
        <Stat value={String(completedSetCount(session))} label="Series" />
      </View>
      <Stat value={formatVolume(sessionVolume(session), unit)} label="Volumen total" />
      <Text style={styles.muscles}>{muscles.map((m) => MUSCLE_LABELS_ES[m]).join(', ') || 'Sin músculos registrados'}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  date: { color: colors.textMuted, marginTop: 2, marginBottom: spacing.md, textTransform: 'capitalize' },
  row: { flexDirection: 'row', marginBottom: spacing.md },
  stat: { flex: 1 },
  value: { color: colors.text, fontSize: 22, fontWeight: '800' },
  label: { color: colors.textMuted, fontSize: 12 },
  muscles: { color: colors.accent, marginTop: spacing.md },
  empty: { color: colors.textMuted, marginTop: spacing.sm, lineHeight: 20 },
});
