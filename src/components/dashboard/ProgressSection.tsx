import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ExerciseIndex } from '../../services/historyService';
import { SERIES_PALETTE, multiSeries, summarizeEntry, type Metric } from '../../services/progressionService';
import { compareExercise } from '../../utils/compare';
import { formatShortDate } from '../../utils/dates';
import { formatSignedVolume, formatWeight, kgToUnit } from '../../utils/units';
import { useSettingsStore } from '../../store/settingsStore';
import { Card } from '../common/Card';
import { MultiLineChart } from './MultiLineChart';
import { colors, radius, spacing } from '../../theme/theme';

const METRICS: { key: Metric; label: string }[] = [
  { key: 'weight', label: 'Peso' },
  { key: 'reps', label: 'Reps' },
  { key: 'volume', label: 'Volumen' },
  { key: 'rir', label: 'RIR' },
];

export function ProgressSection({ index }: { index: ExerciseIndex }) {
  const unit = useSettingsStore((s) => s.weightUnit);
  const [metric, setMetric] = useState<Metric>('weight');
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const { series, total } = useMemo(() => multiSeries(index, metric), [index, metric]);
  // El color depende de la posición en la lista completa, no de lo que esté visible.
  const colorOf = (i: number) => SERIES_PALETTE[i % SERIES_PALETTE.length];
  const convert = (v: number) => (metric === 'weight' || metric === 'volume' ? kgToUnit(v, unit) : v);

  const chartSeries = series
    .map((s, i) => ({
      id: s.exerciseId,
      color: colorOf(i),
      points: s.points.map((p) => ({ t: new Date(p.date).getTime(), v: convert(p.value) })),
    }))
    .filter((s) => !hidden.has(s.id));

  const unitLabel =
    metric === 'weight' ? `${unit} · peso máximo por sesión`
    : metric === 'volume' ? `${unit} · volumen por sesión`
    : metric === 'reps' ? 'repeticiones promedio por serie'
    : 'RIR promedio';

  const toggle = (id: string) =>
    setHidden((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Card style={{ gap: spacing.md }}>
      <Text style={styles.title}>Progresión</Text>
      {total === 0 ? (
        <Text style={styles.muted}>
          {index.size === 0
            ? 'Termina una sesión y aquí verás la evolución de tus ejercicios.'
            : 'Ningún ejercicio tiene datos para esta métrica todavía (el RIR solo aparece si lo registras).'}
        </Text>
      ) : null}

      <View style={styles.tabs}>
        {METRICS.map((m) => (
          <Pressable key={m.key} onPress={() => setMetric(m.key)} style={[styles.tab, metric === m.key && styles.tabOn]}>
            <Text style={[styles.tabText, metric === m.key && { color: colors.text }]}>{m.label}</Text>
          </Pressable>
        ))}
      </View>

      {series.length > 0 && (
        <>
          <Text style={styles.muted}>{unitLabel}</Text>
          <MultiLineChart series={chartSeries} formatDate={(t) => formatShortDate(new Date(t).toISOString())} />

          <View style={styles.legend}>
            {series.map((s, i) => {
              const off = hidden.has(s.exerciseId);
              return (
                <Pressable key={s.exerciseId} onPress={() => toggle(s.exerciseId)} style={[styles.legendItem, off && { opacity: 0.35 }]}>
                  <View style={[styles.dot, { backgroundColor: colorOf(i) }]} />
                  <Text style={styles.legendText} numberOfLines={1}>{s.name}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.hint}>
            Toca un ejercicio para ocultarlo o mostrarlo.
            {total > series.length ? ` Se muestran los ${series.length} trabajados más recientemente, de ${total}.` : ''}
          </Text>

          <View style={{ gap: 2 }}>
            <Text style={styles.sub}>Última sesión vs. la anterior</Text>
            {series.map((s, i) => {
              const entries = index.get(s.exerciseId)!;
              const top = summarizeEntry(entries[0]).topSet;
              const prev = entries[1];
              const cmp = prev ? compareExercise(entries[0].exercise.sets, prev.exercise.sets) : null;
              const color = !cmp ? colors.textMuted : cmp.trend === 'up' ? colors.success : cmp.trend === 'down' ? colors.danger : colors.textMuted;
              return (
                <View key={s.exerciseId} style={styles.row}>
                  <View style={[styles.dot, { backgroundColor: colorOf(i) }]} />
                  <Text style={[styles.cell, { flex: 1.6, color: colors.text }]} numberOfLines={1}>{s.name}</Text>
                  <Text style={[styles.cell, { flex: 1.3 }]}>{formatWeight(top.weight, unit)} × {top.reps}</Text>
                  <Text style={[styles.cell, { flex: 1.1, color, fontWeight: '700', textAlign: 'right' }]}>
                    {cmp ? `${cmp.trend === 'up' ? '▲' : cmp.trend === 'down' ? '▼' : '='} ${formatSignedVolume(cmp.volumeDelta, unit)}` : '1.ª vez'}
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  hint: { color: colors.textMuted, fontSize: 11 },
  sub: { color: colors.text, fontWeight: '700', marginBottom: 4 },
  tabs: { flexDirection: 'row', backgroundColor: colors.surfaceRaised, borderRadius: radius.md, padding: 3 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radius.sm },
  tabOn: { backgroundColor: colors.accent },
  tabText: { color: colors.textMuted, fontWeight: '600', fontSize: 13 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surfaceRaised, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, maxWidth: '100%' },
  legendText: { color: colors.text, fontSize: 12, flexShrink: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border },
  cell: { color: colors.textMuted, fontSize: 12 },
});
