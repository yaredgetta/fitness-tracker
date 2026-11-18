import { useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { CatalogExercise } from '../../models/exercise';
import { MUSCLE_LABELS_ES } from '../../models/muscle';
import { CATEGORIES, CATEGORY_LABELS_ES, type ExerciseCategory } from '../../constants/exerciseCategories';
import { getExerciseCatalog } from '../../services/exerciseCatalog';
import { searchExercises } from '../../services/exerciseSearch';
import { useCustomExerciseStore } from '../../store/customExerciseStore';
import { CreateExerciseForm } from './CreateExerciseForm';
import { colors, radius, spacing } from '../../theme/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPick: (exercise: CatalogExercise) => void;
}

export function ExercisePicker({ visible, onClose, onPick }: Props) {
  const customs = useCustomExerciseStore((s) => s.items);
  const removeCustom = useCustomExerciseStore((s) => s.remove);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ExerciseCategory | undefined>();
  const [creating, setCreating] = useState(false);

  const { items, total } = useMemo(
    () => (visible && !creating ? searchExercises(getExerciseCatalog(), customs, { query, category }) : { items: [], total: 0 }),
    [visible, creating, customs, query, category],
  );

  const close = () => {
    setCreating(false);
    onClose();
  };

  const confirmRemove = (id: string, name: string) =>
    Alert.alert(name, '¿Quitar este ejercicio personalizado? Tus sesiones anteriores conservarán su registro.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: () => void removeCustom(id) },
    ]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <View style={styles.screen}>
        {creating ? (
          <CreateExerciseForm
            initialName={query}
            onCancel={() => setCreating(false)}
            onCreated={(name) => { setQuery(name); setCategory(undefined); setCreating(false); }}
          />
        ) : (
          <>
            <View style={styles.top}>
              <TextInput
                style={styles.search}
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar ejercicio"
                placeholderTextColor={colors.textMuted}
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
              <Pressable onPress={close}><Text style={styles.link}>Cerrar</Text></Pressable>
            </View>

            {/* Cinco categorías en una sola fila, repartidas a partes iguales: no hace falta desplazarse. */}
            <View style={styles.chipsRow}>
              {CATEGORIES.map((c) => (
                <Pressable key={c} onPress={() => setCategory(category === c ? undefined : c)}
                  style={[styles.chip, category === c && { backgroundColor: colors.accent }]}>
                  <Text style={styles.chipText} numberOfLines={1} adjustsFontSizeToFit>{CATEGORY_LABELS_ES[c]}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.count}>
                {total === 0 ? 'Sin resultados' : total > items.length ? `Mostrando ${items.length} de ${total}` : `${total} ejercicios`}
              </Text>
              <Pressable onPress={() => setCreating(true)}><Text style={styles.link}>+ Crear ejercicio</Text></Pressable>
            </View>

            <FlatList
              style={{ flex: 1 }}
              data={items}
              keyExtractor={(i) => i.exercise.id}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Text style={styles.empty}>No hay ejercicios con esa búsqueda.</Text>
                  <Pressable onPress={() => setCreating(true)}>
                    <Text style={styles.link}>{query.trim() ? `Crear "${query.trim()}"` : 'Crear ejercicio'}</Text>
                  </Pressable>
                </View>
              }
              renderItem={({ item }) => (
                <Pressable
                  style={styles.item}
                  onPress={() => { onPick(item.exercise); setQuery(''); setCategory(undefined); close(); }}
                  onLongPress={item.custom ? () => confirmRemove(item.exercise.id, item.exercise.name.es) : undefined}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.exercise.name.es}</Text>
                    <Text style={styles.itemMeta}>
                      {item.exercise.primaryMuscle ? MUSCLE_LABELS_ES[item.exercise.primaryMuscle] : ''}
                      {item.custom ? '' : ` · ${item.exercise.equipment}`}
                    </Text>
                  </View>
                  {item.custom && <Text style={styles.tag}>Personalizado</Text>}
                </Pressable>
              )}
            />
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingTop: 60 },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md },
  search: { flex: 1, color: colors.text, backgroundColor: colors.surface, borderRadius: radius.md, padding: 12, fontSize: 16 },
  link: { color: colors.accent, fontWeight: '700' },
  chipsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  chip: { flex: 1, backgroundColor: colors.surfaceRaised, borderRadius: 20, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  chipText: { color: colors.text, fontWeight: '600' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  count: { color: colors.textMuted, fontSize: 12 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemName: { color: colors.text, fontSize: 16 },
  itemMeta: { color: colors.textMuted, marginTop: 2, fontSize: 12 },
  tag: { color: colors.accent, fontSize: 11, fontWeight: '800', backgroundColor: colors.accentSoft, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
  emptyWrap: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl },
  empty: { color: colors.textMuted, textAlign: 'center' },
});
