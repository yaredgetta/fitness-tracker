import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useUserStore } from '../store/userStore';
import { useHistoryStore } from '../store/historyStore';
import { useActiveSessionStore } from '../store/activeSessionStore';
import { completedSetCount } from '../utils/volume';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { BottomBar } from '../components/common/BottomBar';
import { UnitToggle } from '../components/common/UnitToggle';
import { LastSessionCard } from '../components/dashboard/LastSessionCard';
import { ProgressSection } from '../components/dashboard/ProgressSection';
import { MuscleMapSection } from '../components/muscle-map/MuscleMapSection';
import { buildExerciseIndex } from '../services/historyService';
import { colors, spacing } from '../theme/theme';

export default function Dashboard() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const sessions = useHistoryStore((s) => s.sessions);
  const lastSession = sessions[0] ?? null;
  const index = useMemo(() => buildExerciseIndex(sessions), [sessions]);
  const active = useActiveSessionStore((s) => s.session);

  if (!user) return <Redirect href="/welcome" />;

  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <View style={styles.topRow}>
            <Text style={styles.date}>{today}</Text>
            <UnitToggle />
          </View>
          <Text style={styles.greeting}>Hola, {user.name}. ¡Es hora de entrenar!</Text>
        </View>

        {active && (
          <Card style={{ gap: spacing.sm, borderColor: colors.accent }}>
            <Text style={styles.cardTitle}>Sesión en curso</Text>
            <Text style={styles.soon}>
              Iniciada a las{' '}
              {new Date(active.startedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              {' · '}{active.exercises.length} ejercicios · {completedSetCount(active)} series
            </Text>
          </Card>
        )}
        <Button label={active ? 'Reanudar sesión' : 'Nueva sesión'} onPress={() => router.push('/session')} />

        <LastSessionCard session={lastSession} />
        <MuscleMapSection sessions={sessions} />
        <ProgressSection index={index} />
      </ScrollView>
      <BottomBar
        active="dashboard"
        onDashboard={() => {}}
        onSession={() => router.push('/session')}
        onHistory={() => router.push('/history')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingTop: 70, gap: spacing.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  date: { color: colors.textMuted, textTransform: 'capitalize' },
  greeting: { color: colors.text, fontSize: 26, fontWeight: '800', lineHeight: 32 },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  soon: { color: colors.textMuted, lineHeight: 20 },
});
