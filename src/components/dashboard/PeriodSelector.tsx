import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Period } from '../../services/muscleService';
import { colors, radius } from '../../theme/theme';

export type { Period };

const OPTIONS: { key: Period; label: string }[] = [
  { key: '7d', label: '7 días' },
  { key: '30d', label: '30 días' },
  { key: 'all', label: 'Todo' },
];

export function PeriodSelector({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <View style={styles.wrap}>
      {OPTIONS.map((o) => (
        <Pressable key={o.key} onPress={() => onChange(o.key)} style={[styles.item, value === o.key && styles.active]}>
          <Text style={[styles.text, value === o.key && { color: colors.text }]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: colors.surfaceRaised, borderRadius: radius.md, padding: 3 },
  item: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radius.sm },
  active: { backgroundColor: colors.accent },
  text: { color: colors.textMuted, fontWeight: '600' },
});
