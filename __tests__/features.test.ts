import fs from 'fs';
import path from 'path';
import { makeExercise, makeSession, makeSet, memoryStore } from './helpers';
import type { RawCatalogFile } from '../src/models/exercise';
import { setKeyValueStore } from '../src/storage/kv';
import { KEYS } from '../src/storage/keys';
import { wrap } from '../src/storage/envelope';
import { createCatalog, normalizeText, relevance, searchTokens } from '../src/services/exerciseCatalog';
import { searchExercises } from '../src/services/exerciseSearch';
import { createCustomExercise, customToCatalog, validateCustomExercise } from '../src/services/customExerciseService';
import { dayKey, groupSessionsByDay } from '../src/services/historyDayService';
import { buildExerciseIndex } from '../src/services/historyService';
import { multiSeries, SERIES_PALETTE } from '../src/services/progressionService';
import { computeMuscleStats } from '../src/services/muscleService';
import { addExercise, createSession, finishSession, toggleSetCompleted, updateSetValues } from '../src/services/sessionService';
import { useCustomExerciseStore } from '../src/store/customExerciseStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { settingsRepository } from '../src/storage/settingsRepository';
import { customExerciseRepository } from '../src/storage/customExerciseRepository';

const catalog = createCatalog(
  JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/data/exercises.json'), 'utf8')) as RawCatalogFile,
);

let kv: ReturnType<typeof memoryStore>;
beforeEach(() => {
  kv = memoryStore();
  setKeyValueStore(kv);
  useCustomExerciseStore.setState({ items: [], hydrated: false });
  useSettingsStore.setState({ weightUnit: 'kg', hydrated: false });
});
afterAll(() => setKeyValueStore(null));

describe('búsqueda de ejercicios', () => {
  it('ignora signos y guiones', () => {
    expect(normalizeText('Pull-up, agarre ancho')).toBe('pull up agarre ancho');
    expect(catalog.search({ query: 'pull up' }).length).toBeGreaterThan(0);
  });

  it('el plural encuentra el singular', () => {
    const sing = catalog.search({ query: 'sentadilla', limit: 5000 }).length;
    const plur = catalog.search({ query: 'sentadillas', limit: 5000 }).length;
    expect(sing).toBeGreaterThan(0);
    expect(plur).toBe(sing);
  });

  it('ordena por relevancia: puntaje no creciente', () => {
    const tokens = searchTokens('press banca');
    const r = catalog.search({ query: 'press banca', limit: 200 });
    expect(r.length).toBeGreaterThan(3);
    const scores = r.map((e) => relevance(e.name.es, e.name.en, tokens));
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(normalizeText(r[0].name.es)).toContain('banca');
  });

  it('lo que empieza con la palabra va antes que lo que solo la contiene', () => {
    const r = catalog.search({ query: 'sentadilla', limit: 5000 });
    const startsIdx = r.findIndex((e) => normalizeText(e.name.es).split(' ').some((w) => w.startsWith('sentadilla')));
    const onlyContainsIdx = r.findIndex((e) => !normalizeText(e.name.es).split(' ').some((w) => w.startsWith('sentadilla')));
    if (onlyContainsIdx !== -1) expect(startsIdx).toBeLessThan(onlyContainsIdx);
    expect(startsIdx).toBe(0);
  });

  it('mezcla personalizados y catálogo, personalizados primero', () => {
    const c = createCustomExercise({ name: 'Press banca raro', primaryMuscle: 'chest', secondaryMuscles: [] });
    const { items, total } = searchExercises(catalog, [c], { query: 'press banca' });
    expect(items[0]).toMatchObject({ custom: true });
    expect(items[0].exercise.name.es).toBe('Press banca raro');
    expect(total).toBe(items.length === 80 ? total : items.length);
    expect(total).toBeGreaterThan(1);
  });

  it('el filtro de categoría aplica también a personalizados', () => {
    const c = createCustomExercise({ name: 'Mi curl', primaryMuscle: 'biceps', secondaryMuscles: [] });
    expect(searchExercises(catalog, [c], { category: 'chest' }).items.some((i) => i.custom)).toBe(false);
    expect(searchExercises(catalog, [c], { category: 'arms' }).items[0].custom).toBe(true);
  });

  it('respeta el límite y reporta el total', () => {
    const r = searchExercises(catalog, [], {}, 10);
    expect(r.items).toHaveLength(10);
    expect(r.total).toBeGreaterThan(500);
  });

  it('sin resultados devuelve lista vacía', () => {
    expect(searchExercises(catalog, [], { query: 'zzzxqw' })).toEqual({ items: [], total: 0 });
  });
});

describe('ejercicios personalizados', () => {
  const ok = { name: 'Remo en máquina X', primaryMuscle: 'back' as const, secondaryMuscles: ['biceps' as const, 'back' as const, 'biceps' as const] };

  it('valida nombre, longitud, músculo y duplicados', () => {
    expect(validateCustomExercise({ ...ok, name: '   ' }, [])).toBe('name_required');
    expect(validateCustomExercise({ ...ok, name: 'x'.repeat(61) }, [])).toBe('name_too_long');
    expect(validateCustomExercise({ ...ok, primaryMuscle: null }, [])).toBe('muscle_required');
    expect(validateCustomExercise(ok, [])).toBeNull();
    const existing = [createCustomExercise(ok)];
    expect(validateCustomExercise({ ...ok, name: '  remo EN  máquina x ' }, existing)).toBe('duplicate');
  });

  it('limpia secundarios duplicados y el principal', () => {
    const c = createCustomExercise(ok);
    expect(c.secondaryMuscles).toEqual(['biceps']);
    expect(c.id.startsWith('custom/')).toBe(true);
  });

  it('es registrable como cualquier otro ejercicio', () => {
    expect(customToCatalog(createCustomExercise(ok)).trackable).toBe(true);
  });

  it('se guarda, sobrevive a reiniciar y se puede quitar', async () => {
    const r = await useCustomExerciseStore.getState().add(ok);
    expect(r.ok).toBe(true);
    useCustomExerciseStore.setState({ items: [], hydrated: false });
    await useCustomExerciseStore.getState().hydrate();
    expect(useCustomExerciseStore.getState().items).toHaveLength(1);
    expect((await useCustomExerciseStore.getState().add(ok))).toEqual({ ok: false, error: 'duplicate' });
    await useCustomExerciseStore.getState().remove(useCustomExerciseStore.getState().items[0].id);
    expect(await customExerciseRepository.getAll()).toEqual([]);
  });

  it('datos dañados de ejercicios personalizados se ignoran', async () => {
    kv.data.set(KEYS.customExercises, wrap([{ id: 'sin-prefijo', name: 'x' }]));
    expect(await customExerciseRepository.getAll()).toEqual([]);
  });

  it('un ejercicio personalizado funciona en sesión, historial y mapa muscular', () => {
    const custom = customToCatalog(createCustomExercise({ name: 'Remo X', primaryMuscle: 'back', secondaryMuscles: ['biceps'] }));
    let s = addExercise(createSession(new Date('2026-11-10T10:00:00Z')), custom);
    const id = s.exercises[0].sets[0].id;
    s = toggleSetCompleted(updateSetValues(s, 0, id, { weight: 50, reps: 10 }), 0, id);
    const done = finishSession(s, new Date('2026-11-10T11:00:00Z'));
    expect(buildExerciseIndex([done]).get(custom.id)).toHaveLength(1);
    const stats = computeMuscleStats([done], 'all', new Date('2026-11-12T00:00:00Z'));
    expect(stats.back.volume).toBe(500);
    expect(stats.biceps.volume).toBe(250);
  });
});

describe('unidad de peso (ajuste)', () => {
  it('por defecto kg', async () => {
    expect(await settingsRepository.get()).toEqual({ weightUnit: 'kg' });
  });
  it('se guarda y se recupera al reiniciar', async () => {
    await useSettingsStore.getState().setWeightUnit('lb');
    useSettingsStore.setState({ weightUnit: 'kg', hydrated: false });
    await useSettingsStore.getState().hydrate();
    expect(useSettingsStore.getState().weightUnit).toBe('lb');
  });
  it('un ajuste dañado vuelve a kg', async () => {
    kv.data.set(KEYS.settings, wrap({ weightUnit: 'stones' }));
    expect((await settingsRepository.get()).weightUnit).toBe('kg');
  });
});

describe('historial por día', () => {
  const sess = (id: string, startedAt: string, w = 60) =>
    makeSession({ id, startedAt, exercises: [makeExercise([makeSet({ weight: w, reps: 10 })])] });

  it('agrupa por día y ordena del más reciente al más antiguo', () => {
    const groups = groupSessionsByDay([
      sess('a', '2026-11-03T10:00:00'),
      sess('b', '2026-11-10T08:00:00'),
      sess('c', '2026-11-10T18:00:00'),
    ]);
    expect(groups.map((g) => g.dayKey)).toEqual(['2026-11-10', '2026-11-03']);
    expect(groups[0].sessions.map((s) => s.id)).toEqual(['c', 'b']);
  });

  it('suma volumen, series y músculos del día', () => {
    const [g] = groupSessionsByDay([sess('a', '2026-11-10T08:00:00', 60), sess('b', '2026-11-10T18:00:00', 70)]);
    expect(g.volume).toBe(600 + 700);
    expect(g.sets).toBe(2);
    expect(g.muscles).toEqual(['chest']);
  });

  it('omite sesiones activas y no rompe sin datos', () => {
    expect(groupSessionsByDay([])).toEqual([]);
    expect(groupSessionsByDay([makeSession({ status: 'active' })])).toEqual([]);
  });

  it('el día se calcula en hora local', () => {
    expect(dayKey('2026-11-10T12:00:00')).toBe('2026-11-10');
  });
});

describe('gráfica de progresión con varios ejercicios', () => {
  const ex = (id: string, name: string, w: number) =>
    makeExercise([makeSet({ weight: w, reps: 10 })], { exerciseId: id, name });
  const sessions = [
    makeSession({ id: 's1', startedAt: '2026-10-01T10:00:00Z', exercises: [ex('a', 'Press', 60), ex('b', 'Remo', 50)] }),
    makeSession({ id: 's2', startedAt: '2026-10-08T10:00:00Z', exercises: [ex('a', 'Press', 65)] }),
    makeSession({ id: 's3', startedAt: '2026-10-15T10:00:00Z', exercises: [ex('a', 'Press', 70), ex('c', 'Curl', 20)] }),
  ];

  it('una serie por ejercicio con sus puntos en orden', () => {
    const { series, total } = multiSeries(buildExerciseIndex(sessions), 'weight');
    expect(total).toBe(3);
    const press = series.find((s) => s.exerciseId === 'a')!;
    expect(press.points.map((p) => p.value)).toEqual([60, 65, 70]);
    expect(series.find((s) => s.exerciseId === 'b')!.points).toHaveLength(1);
  });

  it('ordena por primera aparición (colores estables)', () => {
    const { series } = multiSeries(buildExerciseIndex(sessions), 'weight');
    expect(series.map((s) => s.exerciseId)).toEqual(['a', 'b', 'c']);
  });

  it('limita a 8 ejercicios y conserva los más recientes', () => {
    const many = Array.from({ length: 12 }, (_, i) =>
      makeSession({
        id: `m${i}`,
        startedAt: new Date(Date.UTC(2026, 0, 1 + i)).toISOString(),
        exercises: [ex(`e${i}`, `Ej ${i}`, 40)],
      }),
    );
    const { series, total } = multiSeries(buildExerciseIndex(many), 'weight');
    expect(total).toBe(12);
    expect(series).toHaveLength(SERIES_PALETTE.length);
    expect(series.map((s) => s.exerciseId)).not.toContain('e0'); // el más antiguo queda fuera
    expect(series.map((s) => s.exerciseId)).toContain('e11');
  });

  it('la paleta tiene colores distintos', () => {
    expect(new Set(SERIES_PALETTE).size).toBe(SERIES_PALETTE.length);
  });

  it('el RIR omite ejercicios sin RIR registrado', () => {
    const noRir = [makeSession({ exercises: [makeExercise([makeSet({ rir: null })], { exerciseId: 'z', name: 'Z' })] })];
    expect(multiSeries(buildExerciseIndex(noRir), 'rir')).toEqual({ series: [], total: 0 });
  });
});
