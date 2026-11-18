import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../theme/theme';

type Tab = 'dashboard' | 'session' | 'history';

interface Props {
  active: Tab;
  onDashboard: () => void;
  onSession: () => void;
  onHistory: () => void;
}

export function BottomBar({ active, onDashboard, onSession, onHistory }: Props) {
  const items: { key: Tab; label: string; onPress: () => void }[] = [
    { key: 'dashboard', label: 'Inicio', onPress: onDashboard },
    { key: 'session', label: 'Entrenar', onPress: onSession },
    { key: 'history', label: 'Historial', onPress: onHistory },
  ];
  return (
    <View style={styles.bar}>
      {items.map((i) => (
        <Pressable key={i.key} style={styles.item} onPress={i.onPress}>
          <Text style={[styles.text, active === i.key && styles.on]}>{i.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: 1,
    borderTopColor: colors.border, paddingBottom: spacing.lg, paddingTop: spacing.sm,
  },
  item: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
  text: { color: colors.textMuted, fontWeight: '700', fontSize: 15 },
  on: { color: colors.accent },
});
