import fs from 'fs';
import path from 'path';
import type { RawCatalogFile } from '../src/models/exercise';
import { MUSCLE_GROUPS } from '../src/models/muscle';
import { CATEGORIES, CATEGORY_LABELS_ES, CATEGORY_MUSCLES } from '../src/constants/exerciseCategories';
import { createCatalog } from '../src/services/exerciseCatalog';
import { searchExercises } from '../src/services/exerciseSearch';
import { createCustomExercise } from '../src/services/customExerciseService';

const catalog = createCatalog(
  JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/data/exercises.json'), 'utf8')) as RawCatalogFile,
);

describe('categorías de búsqueda', () => {
  it('son exactamente cinco, con nombre en español', () => {
    expect(CATEGORIES.map((c) => CATEGORY_LABELS_ES[c])).toEqual(['Piernas', 'Brazos', 'Pecho', 'Espalda', 'Abdomen']);
  });

  it('cada músculo pertenece a una y solo una categoría', () => {
    const all = CATEGORIES.flatMap((c) => CATEGORY_MUSCLES[c]);
    expect([...all].sort()).toEqual([...MUSCLE_GROUPS].sort());
    expect(new Set(all).size).toBe(all.length);
  });

  it('ningún ejercicio del catálogo queda sin categoría', () => {
    const covered = new Set(CATEGORIES.flatMap((c) => searchExercises(catalog, [], { category: c }, 5000).items.map((i) => i.exercise.id)));
    const trackable = catalog.all().filter((e) => e.trackable);
    expect(trackable.filter((e) => !covered.has(e.id))).toEqual([]);
  });

  it('cada categoría solo trae ejercicios de sus músculos', () => {
    for (const c of CATEGORIES) {
      const { items, total } = searchExercises(catalog, [], { category: c }, 5000);
      expect(total).toBeGreaterThan(20);
      expect(items.every((i) => CATEGORY_MUSCLES[c].includes(i.exercise.primaryMuscle!))).toBe(true);
    }
  });

  it('las categorías no se solapan', () => {
    const ids = CATEGORIES.map((c) => new Set(searchExercises(catalog, [], { category: c }, 5000).items.map((i) => i.exercise.id)));
    ids.forEach((a, i) => ids.slice(i + 1).forEach((b) => expect([...a].filter((id) => b.has(id))).toEqual([])));
  });

  it('Piernas incluye cuádriceps, isquios, glúteos y pantorrillas; Brazos incluye hombros', () => {
    const legs = new Set(searchExercises(catalog, [], { category: 'legs' }, 5000).items.map((i) => i.exercise.primaryMuscle));
    expect(legs).toEqual(new Set(['quads', 'hamstrings', 'glutes', 'calves']));
    const arms = new Set(searchExercises(catalog, [], { category: 'arms' }, 5000).items.map((i) => i.exercise.primaryMuscle));
    expect(arms.has('shoulders')).toBe(true);
  });

  it('la categoría se combina con el texto de búsqueda', () => {
    const { items } = searchExercises(catalog, [], { query: 'curl', category: 'arms' });
    expect(items.length).toBeGreaterThan(0);
    const none = searchExercises(catalog, [], { query: 'curl', category: 'chest' });
    expect(none.items.every((i) => i.exercise.primaryMuscle === 'chest')).toBe(true);
  });

  it('los personalizados se ubican según su músculo principal', () => {
    const leg = createCustomExercise({ name: 'Mi prensa', primaryMuscle: 'quads', secondaryMuscles: [] });
    const shoulder = createCustomExercise({ name: 'Mi elevación', primaryMuscle: 'shoulders', secondaryMuscles: [] });
    expect(searchExercises(catalog, [leg, shoulder], { category: 'legs' }).items.filter((i) => i.custom).map((i) => i.exercise.name.es)).toEqual(['Mi prensa']);
    expect(searchExercises(catalog, [leg, shoulder], { category: 'arms' }).items.filter((i) => i.custom).map((i) => i.exercise.name.es)).toEqual(['Mi elevación']);
  });
});
