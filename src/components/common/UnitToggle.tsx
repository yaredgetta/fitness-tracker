import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { WeightUnit } from '../../models/settings';
import { useSettingsStore } from '../../store/settingsStore';
import { colors, radius } from '../../theme/theme';

const UNITS: WeightUnit[] = ['kg', 'lb'];

export function UnitToggle() {
  const unit = useSettingsStore((s) => s.weightUnit);
  const setUnit = useSettingsStore((s) => s.setWeightUnit);
  return (
    <View style={styles.wrap}>
      {UNITS.map((u) => (
        <Pressable key={u} onPress={() => void setUnit(u)} style={[styles.item, unit === u && styles.on]}>
          <Text style={[styles.text, unit === u && { color: colors.text }]}>{u}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: colors.surfaceRaised, borderRadius: radius.md, padding: 3 },
  item: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: radius.sm },
  on: { backgroundColor: colors.accent },
  text: { color: colors.textMuted, fontWeight: '700' },
});
