import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SessionExercise } from '../../models/session';
import { MUSCLE_LABELS_ES } from '../../models/muscle';
import type { ExerciseHistoryEntry } from '../../services/historyService';
import { detectPRs } from '../../services/prService';
import { summarizeEntry } from '../../services/progressionService';
import { compareExercise, compareSet } from '../../utils/compare';
import { formatShortDate } from '../../utils/dates';
import { completedSets, exerciseVolume, maxWeight } from '../../utils/volume';
import { formatSignedVolume, formatSignedWeight, formatVolume, formatWeight } from '../../utils/units';
import { useSettingsStore } from '../../store/settingsStore';
import { Card } from '../common/Card';
import { SetRow } from './SetRow';
import { colors, radius, spacing } from '../../theme/theme';

interface Props {
  exercise: SessionExercise;
  /** Registros anteriores de este ejercicio, el más reciente primero. */
  history: ExerciseHistoryEntry[];
  onValues: (setId: string, patch: { weight?: number; reps?: number }) => void;
  onRir: (setId: string, rir: number | null) => void;
  onFailure: (setId: string, failure: boolean) => void;
  onToggle: (setId: string) => void;
  onRemoveSet: (setId: string) => void;
  onAddSet: () => void;
  onRemoveExercise: () => void;
}


export function ExerciseCard(p: Props) {
  const [open, setOpen] = useState(true);
  const unit = useSettingsStore((s) => s.weightUnit);
  const { exercise, history } = p;
  const last = history[0];
  const lastSets = last?.exercise.sets;
  const lastSummary = useMemo(() => (last ? summarizeEntry(last) : null), [last]);
  const prs = useMemo(() => detectPRs(exercise, history), [exercise, history]);

  const done = completedSets(exercise);
  const volume = exerciseVolume(exercise);
  const max = maxWeight(exercise);
  const vs = last && done.length > 0 ? compareExercise(done, lastSets!) : null;

  const prLabels: string[] = [];
  const allTypes = Object.entries(prs.bySet);
  if (allTypes.some(([, t]) => t.includes('max_weight'))) prLabels.push('Nuevo peso máximo');
  for (const [setId, types] of allTypes) {
    if (types.includes('rep_record')) {
      const s = exercise.sets.find((x) => x.id === setId)!;
      prLabels.push(`Más repeticiones con ${formatWeight(s.weight, unit)}`);
    }
  }
  if (prs.volume) prLabels.push('Mayor volumen en una sesión');

  return (
    <Card style={{ gap: spacing.sm }}>
      <Pressable onPress={() => setOpen(!open)} onLongPress={p.onRemoveExercise} delayLongPress={600}>
        <Text style={styles.name}>{exercise.name}</Text>
        <Text style={styles.meta}>{MUSCLE_LABELS_ES[exercise.primaryMuscle]}</Text>
        <View style={styles.stats}>
          <Text style={styles.stat}>{done.length}/{exercise.sets.length} series</Text>
          {max > 0 && <Text style={styles.stat}>máx {formatWeight(max, unit)}</Text>}
          <Text style={styles.stat}>{formatVolume(volume, unit)}</Text>
        </View>
      </Pressable>

      {open && (
        <>
          {lastSummary ? (
            <View style={styles.last}>
              <Text style={styles.lastTitle}>Última sesión · {formatShortDate(last.date)}</Text>
              <Text style={styles.lastText}>
                {lastSummary.sets} series · mejor {formatWeight(lastSummary.topSet.weight, unit)} × {lastSummary.topSet.reps}
                {lastSummary.avgRir !== null ? ` · RIR prom. ${lastSummary.avgRir}` : ''} · {formatVolume(lastSummary.volume, unit)}
              </Text>
              {vs && (
                <Text style={[styles.vs, { color: vs.trend === 'up' ? colors.success : vs.trend === 'down' ? colors.danger : colors.textMuted }]}>
                  {vs.trend === 'up' ? '▲' : vs.trend === 'down' ? '▼' : '='} Hoy: {formatSignedVolume(vs.volumeDelta, unit)} de volumen
                  {vs.maxWeightDelta !== 0 ? ` · ${formatSignedWeight(vs.maxWeightDelta, unit)} de peso máx.` : ''}
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.first}>Este será tu primer registro de este ejercicio</Text>
          )}

          {prLabels.length > 0 && (
            <View style={styles.prs}>
              {prLabels.map((l) => (
                <View key={l} style={styles.prChip}>
                  <Text style={styles.prText}>🏆 {l}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.header}>
            <Text style={[styles.h, { width: 28 }]}>Serie</Text>
            <Text style={[styles.h, { flex: 1.3 }]}>Anterior</Text>
            <Text style={[styles.h, { flex: 1 }]}>{unit}</Text>
            <Text style={[styles.h, { flex: 1 }]}>Reps</Text>
            <Text style={[styles.h, { width: 36 }]}>RIR</Text>
            <Text style={[styles.h, { width: 36 }]}>Fallo</Text>
            <Text style={[styles.h, { width: 36 }]}> </Text>
          </View>
          {exercise.sets.map((s) => {
            const prev = lastSets?.find((x) => x.setNumber === s.setNumber);
            const comparison = last && s.reps >= 1 ? compareSet(s, prev) : null;
            return (
              <SetRow
                key={`${s.id}-${unit}`}
                set={s}
                unit={unit}
                previous={prev ? `${formatWeight(prev.weight, unit)} × ${prev.reps}` : '—'}
                comparison={comparison}
                isPR={Boolean(prs.bySet[s.id])}
                onValues={(patch) => p.onValues(s.id, patch)}
                onRir={(r) => p.onRir(s.id, r)}
                onFailure={(f) => p.onFailure(s.id, f)}
                onToggle={() => p.onToggle(s.id)}
                onRemove={() => p.onRemoveSet(s.id)}
              />
            );
          })}
          <Pressable onPress={p.onAddSet} style={styles.add}>
            <Text style={styles.addText}>+ Agregar serie</Text>
          </Pressable>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  name: { color: colors.text, fontSize: 17, fontWeight: '700' },
  meta: { color: colors.textMuted, marginTop: 2 },
  stats: { flexDirection: 'row', gap: 12, marginTop: 6 },
  stat: { color: colors.accent, fontSize: 13, fontWeight: '700' },
  last: { backgroundColor: colors.surfaceRaised, borderRadius: radius.md, padding: spacing.sm + 2, gap: 2 },
  lastTitle: { color: colors.text, fontWeight: '700', fontSize: 13 },
  lastText: { color: colors.textMuted, fontSize: 12 },
  vs: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  first: { color: colors.textMuted, fontStyle: 'italic' },
  prs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  prChip: { backgroundColor: colors.accentSoft, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  prText: { color: colors.accent, fontSize: 12, fontWeight: '800' },
  header: { flexDirection: 'row', gap: 6, paddingHorizontal: 4 },
  h: { color: colors.textMuted, fontSize: 11, textAlign: 'center' },
  add: { paddingVertical: 10, alignItems: 'center' },
  addText: { color: colors.accent, fontWeight: '700' },
});
