import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MUSCLE_LABELS_ES, type MuscleGroup } from '../../models/muscle';
import type { WorkoutSession } from '../../models/session';
import { computeMuscleStats, intensityLevels, type Period } from '../../services/muscleService';
import { formatShortDate } from '../../utils/dates';
import { Card } from '../common/Card';
import { formatVolume } from '../../utils/units';
import { useSettingsStore } from '../../store/settingsStore';
import { PeriodSelector } from '../dashboard/PeriodSelector';
import { BodyFigure } from './BodyFigure';
import { HEAT_COLORS, colors, radius, spacing } from '../../theme/theme';

const LEGEND = ['Sin entrenar', 'Bajo', 'Medio', 'Alto'];

export function MuscleMapSection({ sessions }: { sessions: WorkoutSession[] }) {
  const unit = useSettingsStore((s) => s.weightUnit);
  const [period, setPeriod] = useState<Period>('7d');
  const [selected, setSelected] = useState<MuscleGroup | null>(null);

  const stats = useMemo(() => computeMuscleStats(sessions, period), [sessions, period]);
  const levels = useMemo(() => intensityLevels(stats), [stats]);
  const detail = selected ? stats[selected] : null;

  const toggle = (m: MuscleGroup) => setSelected((cur) => (cur === m ? null : m));

  return (
    <Card style={{ gap: spacing.md }}>
      <Text style={styles.title}>Mapa muscular</Text>
      <PeriodSelector value={period} onChange={setPeriod} />

      <View style={styles.figures}>
        <View style={styles.figureWrap}>
          <BodyFigure view="front" levels={levels} selected={selected} onSelect={toggle} />
          <Text style={styles.viewLabel}>Frente</Text>
        </View>
        <View style={styles.figureWrap}>
          <BodyFigure view="back" levels={levels} selected={selected} onSelect={toggle} />
          <Text style={styles.viewLabel}>Espalda</Text>
        </View>
      </View>

      <View style={styles.legend}>
        {LEGEND.map((label, i) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: HEAT_COLORS[i] }]} />
            <Text style={styles.legendText}>{label}</Text>
          </View>
        ))}
      </View>

      {detail ? (
        <View style={styles.detail}>
          <Text style={styles.detailTitle}>{MUSCLE_LABELS_ES[detail.muscle]}</Text>
          {detail.sets === 0 ? (
            <Text style={styles.muted}>Sin entrenamiento registrado en este periodo.</Text>
          ) : (
            <>
              <View style={styles.statsRow}>
                <Stat value={detail.lastDate ? formatShortDate(detail.lastDate) : '—'} label="Última vez" />
                <Stat value={`${detail.sets}`} label={`Series (${detail.primarySets} directas)`} />
                <Stat value={formatVolume(detail.volume, unit)} label="Volumen" />
              </View>
              <Text style={styles.sub}>Ejercicios</Text>
              {detail.exercises.map((e) => (
                <View key={`${e.exerciseId}-${e.role}`} style={styles.exRow}>
                  <Text style={styles.exName} numberOfLines={1}>{e.name}</Text>
                  <Text style={styles.exMeta}>
                    {e.role === 'secondary' ? 'secundario · ' : ''}{e.sets} series · {formatVolume(e.volume, unit)}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>
      ) : (
        <Text style={styles.muted}>Toca un músculo para ver su detalle.</Text>
      )}

      <Text style={styles.note}>
        Muestra el volumen registrado (peso × repeticiones), no fatiga ni recuperación. El color es relativo al
        músculo más trabajado del periodo; los músculos secundarios cuentan la mitad.
      </Text>
    </Card>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  figures: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.sm },
  figureWrap: { flex: 1, alignItems: 'center' },
  viewLabel: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  legend: { flexDirection: 'row', justifyContent: 'space-between' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 12, height: 12, borderRadius: 3 },
  legendText: { color: colors.textMuted, fontSize: 11 },
  detail: { backgroundColor: colors.surfaceRaised, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  detailTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statValue: { color: colors.accent, fontSize: 16, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: 11 },
  sub: { color: colors.text, fontWeight: '700', marginTop: 4 },
  exRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  exName: { color: colors.text, flex: 1, fontSize: 13 },
  exMeta: { color: colors.textMuted, fontSize: 12 },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  note: { color: colors.textMuted, fontSize: 11, lineHeight: 15 },
});
