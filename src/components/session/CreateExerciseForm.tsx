import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MUSCLE_GROUPS, MUSCLE_LABELS_ES, type MuscleGroup } from '../../models/muscle';
import { CUSTOM_ERROR_MESSAGES, MAX_NAME_LENGTH } from '../../services/customExerciseService';
import { useCustomExerciseStore } from '../../store/customExerciseStore';
import { Button } from '../common/Button';
import { colors, radius, spacing } from '../../theme/theme';

interface Props {
  initialName?: string;
  onCancel: () => void;
  /** Se llama con el nombre del ejercicio creado. */
  onCreated: (name: string) => void;
}

function MuscleChips({
  selected, onToggle, disabled,
}: { selected: MuscleGroup[]; onToggle: (m: MuscleGroup) => void; disabled?: MuscleGroup | null }) {
  return (
    <View style={styles.chips}>
      {MUSCLE_GROUPS.filter((m) => m !== disabled).map((m) => (
        <Pressable key={m} onPress={() => onToggle(m)} style={[styles.chip, selected.includes(m) && styles.chipOn]}>
          <Text style={styles.chipText}>{MUSCLE_LABELS_ES[m]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function CreateExerciseForm({ initialName = '', onCancel, onCreated }: Props) {
  const add = useCustomExerciseStore((s) => s.add);
  const [name, setName] = useState(initialName);
  const [primary, setPrimary] = useState<MuscleGroup | null>(null);
  const [secondary, setSecondary] = useState<MuscleGroup[]>([]);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const result = await add({ name, primaryMuscle: primary, secondaryMuscles: secondary });
    if (result.ok) onCreated(result.exercise.name);
    else setError(CUSTOM_ERROR_MESSAGES[result.error]);
  };

  return (
    <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
      <View style={styles.top}>
        <Text style={styles.title}>Nuevo ejercicio</Text>
        <Pressable onPress={onCancel}><Text style={styles.link}>Cancelar</Text></Pressable>
      </View>

      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={(t) => { setName(t); setError(null); }}
        placeholder="Ej. Remo en máquina X"
        placeholderTextColor={colors.textMuted}
        maxLength={MAX_NAME_LENGTH + 10}
        autoCapitalize="sentences"
      />

      <Text style={styles.label}>Músculo principal</Text>
      <MuscleChips
        selected={primary ? [primary] : []}
        onToggle={(m) => {
          setPrimary(m);
          setSecondary((cur) => cur.filter((x) => x !== m));
          setError(null);
        }}
      />

      <Text style={styles.label}>Músculos secundarios (opcional)</Text>
      <MuscleChips
        selected={secondary}
        disabled={primary}
        onToggle={(m) => setSecondary((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]))}
      />

      {error && <Text style={styles.error}>{error}</Text>}
      <Button label="Guardar ejercicio" onPress={save} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  form: { padding: spacing.md, gap: spacing.sm, paddingTop: 60 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  link: { color: colors.accent, fontWeight: '700' },
  label: { color: colors.textMuted, fontWeight: '600', marginTop: spacing.sm },
  input: { color: colors.text, backgroundColor: colors.surface, borderRadius: radius.md, padding: 12, fontSize: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: colors.surfaceRaised, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chipOn: { backgroundColor: colors.accent },
  chipText: { color: colors.text, fontWeight: '600' },
  error: { color: colors.danger, marginTop: spacing.sm },
});
