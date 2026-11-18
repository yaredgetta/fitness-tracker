import fs from 'fs';
import path from 'path';
import { memoryStore } from './helpers';
import { setKeyValueStore } from '../src/storage/kv';
import { sessionRepository } from '../src/storage/sessionRepository';
import { useActiveSessionStore } from '../src/store/activeSessionStore';
import { useHistoryStore } from '../src/store/historyStore';
import { useUserStore } from '../src/store/userStore';
import { createCatalog } from '../src/services/exerciseCatalog';
import { buildExerciseIndex } from '../src/services/historyService';
import { detectPRs } from '../src/services/prService';
import { exerciseSeries } from '../src/services/progressionService';
import { computeMuscleStats } from '../src/services/muscleService';
import {
  addExercise, addSet, setSetFailure, setSetRir, toggleSetCompleted, updateSetValues,
} from '../src/services/sessionService';
import { compareSet } from '../src/utils/compare';
import { sessionVolume } from '../src/utils/volume';
import type { CatalogExercise } from '../src/models/exercise';

const catalog = createCatalog(
  JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/data/exercises.json'), 'utf8')),
);
const bench = catalog.getById('pectorals/barbell-bench-press')!;
const squat = catalog.search({ muscle: 'quads', limit: 1 })[0];

const A = () => useActiveSessionStore.getState();
const H = () => useHistoryStore.getState();

/** Simula cerrar la app por completo y volver a abrirla: se pierde la memoria, queda el almacenamiento. */
async function restartApp() {
  useUserStore.setState({ user: null, hydrated: false });
  useHistoryStore.setState({ sessions: [], hydrated: false });
  useActiveSessionStore.setState({ session: null, hydrated: false });
  await Promise.all([useUserStore.getState().hydrate(), H().hydrate(), A().hydrate()]);
}

type SetSpec = { weight: number; reps: number; rir?: number | null; failure?: boolean };

/** Registra y finaliza una sesión completa como lo haría el usuario. */
async function trainSession(date: string, work: [CatalogExercise, SetSpec[]][], minutes = 45) {
  vi.setSystemTime(new Date(date));
  await A().start();
  work.forEach(([ex, specs], exIdx) => {
    A().update((s) => addExercise(s, ex));
    specs.forEach((spec, i) => {
      if (i > 0) A().update((s) => addSet(s, exIdx));
      const id = A().session!.exercises[exIdx].sets[i].id;
      A().update((s) => updateSetValues(s, exIdx, id, { weight: spec.weight, reps: spec.reps }));
      if (spec.failure) A().update((s) => setSetFailure(s, exIdx, id, true));
      else if (spec.rir !== undefined) A().update((s) => setSetRir(s, exIdx, id, spec.rir!));
      A().update((s) => toggleSetCompleted(s, exIdx, id));
    });
  });
  vi.setSystemTime(new Date(new Date(date).getTime() + minutes * 60000));
  expect(await A().finish()).toBe(true);
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  setKeyValueStore(memoryStore());
  await restartApp();
});
afterEach(async () => {
  await A().discard();
  vi.useRealTimers();
});
afterAll(() => setKeyValueStore(null));

describe('recorrido completo: varias semanas con cierres de la app', () => {
  const W1 = '2026-11-03T10:00:00Z';
  const W2 = '2026-11-10T10:00:00Z';

  async function twoWeeks() {
    await trainSession(W1, [
      [bench, [{ weight: 60, reps: 10, rir: 2 }, { weight: 60, reps: 10, rir: 1 }, { weight: 60, reps: 8, failure: true }]],
      [squat, [{ weight: 80, reps: 8, rir: 2 }]],
    ]);
    await restartApp();
    await trainSession(W2, [
      [bench, [{ weight: 65, reps: 10, rir: 1 }, { weight: 65, reps: 9, rir: 1 }, { weight: 60, reps: 8, rir: 0 }]],
    ]);
    await restartApp();
  }

  it('las sesiones sobreviven a reiniciar y quedan en orden', async () => {
    await twoWeeks();
    expect(H().sessions.map((s) => s.startedAt)).toEqual([new Date(W2).toISOString(), new Date(W1).toISOString()]);
    expect(await sessionRepository.getAll()).toHaveLength(2);
    expect(A().session).toBeNull(); // nada pendiente
  });

  it('duración y volumen se guardan correctamente', async () => {
    await twoWeeks();
    const [w2, w1] = H().sessions;
    expect(w1.durationSec).toBe(45 * 60);
    expect(sessionVolume(w1)).toBe(600 + 600 + 480 + 640);
    expect(sessionVolume(w2)).toBe(650 + 585 + 480);
  });

  it('RIR y fallo quedan consistentes tras guardar y recargar', async () => {
    await twoWeeks();
    const sets = H().sessions[1].exercises[0].sets;
    expect(sets[2]).toMatchObject({ failure: true, rir: 0 });
    expect(sets[0]).toMatchObject({ failure: false, rir: 2 });
    expect(H().sessions[0].exercises[0].sets[2]).toMatchObject({ failure: true, rir: 0 }); // RIR 0 => fallo
  });

  it('la comparación contra la última sesión usa el historial real', async () => {
    await twoWeeks();
    const history = buildExerciseIndex(H().sessions).get(bench.id)!;
    expect(history).toHaveLength(2);
    const last = history[1].exercise.sets; // semana 1 (la última antes de una semana 3 hipotética)
    const wk2 = history[0].exercise.sets;
    expect(compareSet(wk2[0], last[0]).trend).toBe('up');   // 65x10 vs 60x10
    expect(compareSet(wk2[1], last[1]).trend).toBe('up');   // 65x9 vs 60x10: -2.5 % con más peso
    expect(compareSet(wk2[2], last[2]).trend).toBe('same'); // 60x8 vs 60x8
  });

  it('detecta PR de la semana 2 contra el historial de la semana 1', async () => {
    await twoWeeks();
    const [w2, w1] = H().sessions;
    const history = buildExerciseIndex([w1]).get(bench.id)!; // solo lo anterior
    const pr = detectPRs(w2.exercises[0], history);
    expect(pr.bySet[w2.exercises[0].sets[0].id]).toEqual(['max_weight']);
    expect(pr.volume).toBe(true); // 1715 > 1680... del press: 1715 vs 1680
  });

  it('las gráficas reflejan las dos sesiones', async () => {
    await twoWeeks();
    const entries = buildExerciseIndex(H().sessions).get(bench.id)!;
    expect(exerciseSeries(entries, 'weight').map((p) => p.value)).toEqual([60, 65]);
    expect(exerciseSeries(entries, 'volume').map((p) => p.value)).toEqual([1680, 1715]);
    expect(exerciseSeries(entries, 'rir').map((p) => p.value)).toEqual([1, 0.7]);
  });

  it('el mapa muscular cambia según el periodo', async () => {
    await twoWeeks();
    const now = new Date('2026-11-12T12:00:00Z');
    const d7 = computeMuscleStats(H().sessions, '7d', now);
    const all = computeMuscleStats(H().sessions, 'all', now);
    expect(d7.chest.volume).toBe(1715); // solo la semana 2
    expect(d7.quads.sets).toBe(0);
    expect(all.chest.volume).toBe(1680 + 1715);
    expect(all.quads.volume).toBe(640);
    expect(all.triceps.volume).toBe((1680 + 1715) * 0.5); // secundario ×0.5
  });
});

describe('cierres inesperados durante el entrenamiento', () => {
  it('con guardado pendiente (flush) no se pierde nada', async () => {
    await A().start();
    A().update((s) => addExercise(s, bench));
    const id = A().session!.exercises[0].sets[0].id;
    A().update((s) => updateSetValues(s, 0, id, { weight: 60, reps: 10 }));
    A().update((s) => toggleSetCompleted(s, 0, id));
    await A().flush(); // la app pasa a segundo plano
    await restartApp(); // el sistema la cierra
    expect(A().session!.exercises[0].sets[0]).toMatchObject({ weight: 60, reps: 10, completed: true });
  });

  it('límite conocido: un cambio de los últimos 500 ms sin flush puede perderse, lo anterior no', async () => {
    await A().start();
    A().update((s) => addExercise(s, bench));
    await A().flush(); // todo hasta aquí está a salvo
    const id = A().session!.exercises[0].sets[0].id;
    A().update((s) => updateSetValues(s, 0, id, { weight: 99, reps: 9 })); // aún no escrito
    await restartApp(); // cierre brusco antes del debounce
    const recovered = A().session!;
    expect(recovered.exercises).toHaveLength(1); // el ejercicio sí está
    expect(recovered.exercises[0].sets[0].weight).toBe(0); // el último cambio se perdió
  });

  it('se puede reanudar el borrador y finalizarlo después del reinicio', async () => {
    vi.setSystemTime(new Date('2026-11-12T09:00:00Z'));
    await A().start();
    A().update((s) => addExercise(s, bench));
    const id = A().session!.exercises[0].sets[0].id;
    A().update((s) => updateSetValues(s, 0, id, { weight: 70, reps: 5 }));
    A().update((s) => toggleSetCompleted(s, 0, id));
    await A().flush();
    await restartApp();
    expect(A().session).not.toBeNull();
    expect(await A().finish()).toBe(true);
    expect(H().sessions).toHaveLength(1);
    await restartApp();
    expect(A().session).toBeNull();
    expect(H().sessions).toHaveLength(1);
  });
});

describe('volumen de datos', () => {
  it('300 sesiones se cargan, indexan y analizan en tiempo razonable', async () => {
    vi.useRealTimers();
    const exercises = catalog.search({ limit: 5 });
    for (let i = 0; i < 300; i++) {
      const date = new Date(Date.UTC(2025, 0, 1) + i * 86400000).toISOString();
      const session = {
        id: `s${i}`, startedAt: date, durationSec: 3600, status: 'finished' as const,
        exercises: exercises.map((e) => ({
          exerciseId: e.id, name: e.name.es, primaryMuscle: e.primaryMuscle!, secondaryMuscles: e.secondaryMuscles,
          sets: [1, 2, 3, 4].map((n) => ({ id: `s${i}-${e.id}-${n}`, setNumber: n, weight: 50 + (i % 20), reps: 10, rir: 1, failure: false, completed: true })),
        })),
      };
      await sessionRepository.save(session);
    }
    const t0 = Date.now();
    const all = await sessionRepository.getAll();
    const index = buildExerciseIndex(all);
    const stats = computeMuscleStats(all, 'all', new Date('2026-12-31'));
    const elapsed = Date.now() - t0;
    expect(all).toHaveLength(300);
    expect(all[0].id).toBe('s299');
    expect(index.size).toBe(5);
    expect(stats[exercises[0].primaryMuscle!].sets).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(3000);
  });
});
