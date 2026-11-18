import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { WeightUnit } from '../../models/settings';
import type { SetEntry } from '../../models/session';
import type { SetComparison } from '../../utils/compare';
import { formatNumber, formatSignedWeight, kgToUnit, unitToKg } from '../../utils/units';
import { colors, radius } from '../../theme/theme';

interface Props {
  set: SetEntry;
  unit: WeightUnit;
  /** Texto de la serie equivalente anterior, p. ej. "60 kg × 10". */
  previous: string;
  comparison: SetComparison | null;
  isPR: boolean;
  onValues: (patch: Partial<Pick<SetEntry, 'weight' | 'reps'>>) => void;
  onRir: (rir: number | null) => void;
  onFailure: (failure: boolean) => void;
  onToggle: () => void;
  onRemove: () => void;
}

const TREND_COLOR = { up: colors.success, down: colors.danger, same: colors.textMuted, new: colors.textMuted } as const;

function deltaLabel(c: SetComparison, unit: WeightUnit): string {
  if (c.trend === 'new') return 'nueva';
  if (c.weightDelta === 0 && c.repsDelta === 0) return '= igual';
  const parts: string[] = [];
  if (c.weightDelta !== 0) parts.push(formatSignedWeight(c.weightDelta, unit));
  if (c.repsDelta !== 0) parts.push(`${c.repsDelta > 0 ? '+' : ''}${c.repsDelta} rep`);
  const arrow = c.trend === 'up' ? '▲' : c.trend === 'down' ? '▼' : '=';
  return `${arrow} ${parts.join(' ')}`;
}

// null -> 3 -> 2 -> 1 -> 0 (fallo) -> null
const nextRir = (r: number | null) => (r === null ? 3 : r === 0 ? null : r - 1);

export function SetRow({ set, unit, previous, comparison, isPR, onValues, onRir, onFailure, onToggle, onRemove }: Props) {
  const [weightText, setWeightText] = useState(set.weight ? formatNumber(kgToUnit(set.weight, unit)) : '');
  const [repsText, setRepsText] = useState(set.reps ? String(set.reps) : '');
  const [blocked, setBlocked] = useState(false);

  const tryToggle = () => {
    setBlocked(!(set.completed || set.reps >= 1));
    onToggle();
  };

  return (
    <View style={[styles.row, set.completed && styles.done]}>
      <Pressable style={styles.num} onLongPress={onRemove} delayLongPress={500}>
        <Text style={styles.numText}>{set.setNumber}</Text>
        {isPR && <Text style={styles.pr}>PR</Text>}
      </Pressable>
      <View style={styles.prevCell}>
        <Text style={styles.prev}>{previous}</Text>
        {comparison && (
          <Text style={[styles.delta, { color: TREND_COLOR[comparison.trend] }]}>{deltaLabel(comparison, unit)}</Text>
        )}
      </View>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        value={weightText}
        placeholder="0"
        placeholderTextColor={colors.textMuted}
        editable={!set.completed}
        onChangeText={(t) => {
          setWeightText(t);
          const n = parseFloat(t.replace(',', '.'));
          onValues({ weight: Number.isFinite(n) && n >= 0 ? unitToKg(n, unit) : 0 });
        }}
      />
      <TextInput
        style={[styles.input, blocked && { borderColor: colors.danger }]}
        keyboardType="number-pad"
        value={repsText}
        placeholder="0"
        placeholderTextColor={colors.textMuted}
        editable={!set.completed}
        onChangeText={(t) => {
          setRepsText(t);
          setBlocked(false);
          const n = parseInt(t, 10);
          onValues({ reps: Number.isFinite(n) && n >= 0 ? n : 0 });
        }}
      />
      <Pressable style={styles.chip} onPress={() => onRir(nextRir(set.rir))} disabled={set.completed}>
        <Text style={styles.chipText}>{set.rir === null ? '–' : set.rir}</Text>
      </Pressable>
      <Pressable
        style={[styles.chip, set.failure && { backgroundColor: colors.accent }]}
        onPress={() => onFailure(!set.failure)}
        disabled={set.completed}
      >
        <Text style={styles.chipText}>F</Text>
      </Pressable>
      <Pressable style={[styles.chip, set.completed && { backgroundColor: colors.success }]} onPress={tryToggle}>
        <Text style={[styles.chipText, set.completed && { color: '#000' }]}>✓</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 4, borderRadius: radius.sm },
  done: { backgroundColor: 'rgba(61, 220, 132, 0.10)' },
  num: { width: 28, alignItems: 'center' },
  numText: { color: colors.textMuted, fontWeight: '700' },
  prevCell: { flex: 1.3, alignItems: 'center' },
  prev: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  delta: { fontSize: 10, fontWeight: '700', marginTop: 1, textAlign: 'center' },
  pr: { color: colors.accent, fontSize: 9, fontWeight: '900' },
  input: {
    flex: 1, color: colors.text, backgroundColor: colors.surfaceRaised, borderRadius: radius.sm,
    textAlign: 'center', paddingVertical: 8, fontSize: 16, fontWeight: '700',
    borderWidth: 1, borderColor: 'transparent',
  },
  chip: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  chipText: { color: colors.text, fontWeight: '800' },
});
