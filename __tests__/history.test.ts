import { makeExercise, makeSession, makeSet } from './helpers';
import { buildExerciseIndex } from '../src/services/historyService';
import { detectPRs } from '../src/services/prService';
import { exerciseSeries, exercisesWithHistory, summarizeEntry } from '../src/services/progressionService';

const bench = (sets: ReturnType<typeof makeSet>[]) => makeExercise(sets);
const sess = (id: string, startedAt: string, sets: ReturnType<typeof makeSet>[]) =>
  makeSession({ id, startedAt, exercises: [bench(sets)] });

const sessions = [
  sess('s3', '2026-11-09T10:00:00Z', [makeSet({ id: 'a', weight: 65, reps: 8, rir: 1 })]),
  sess('s2', '2026-11-05T10:00:00Z', [
    makeSet({ id: 'b', weight: 60, reps: 10, rir: 2 }),
    makeSet({ id: 'c', weight: 60, reps: 8, rir: 0, failure: true }),
  ]),
  sess('s1', '2026-11-01T10:00:00Z', [makeSet({ id: 'd', weight: 55, reps: 10, rir: null })]),
];
const index = buildExerciseIndex(sessions);
const id = 'pectorals/barbell-bench-press';

describe('historial por ejercicio', () => {
  it('ordena del más reciente al más antiguo', () => {
    expect(index.get(id)!.map((e) => e.sessionId)).toEqual(['s3', 's2', 's1']);
  });
  it('ignora sesiones activas y series incompletas', () => {
    const idx = buildExerciseIndex([
      makeSession({ id: 'x', status: 'active', exercises: [bench([makeSet()])] }),
      makeSession({ id: 'y', exercises: [bench([makeSet({ completed: false })])] }),
    ]);
    expect(idx.size).toBe(0);
  });
});

describe('progresión', () => {
  it('resume un registro', () => {
    const s = summarizeEntry(index.get(id)![1]);
    expect(s).toMatchObject({ sets: 2, maxWeight: 60, volume: 1080, avgReps: 9, avgRir: 1 });
    expect(s.topSet.reps).toBe(10);
  });
  it('series en orden cronológico', () => {
    expect(exerciseSeries(index.get(id)!, 'weight').map((p) => p.value)).toEqual([55, 60, 65]);
    expect(exerciseSeries(index.get(id)!, 'volume').map((p) => p.value)).toEqual([550, 1080, 520]);
  });
  it('omite sesiones sin RIR', () => {
    expect(exerciseSeries(index.get(id)!, 'rir')).toHaveLength(2);
  });
  it('lista ejercicios con historial', () => {
    expect(exercisesWithHistory(index)).toEqual([{ exerciseId: id, name: 'Press de banca', sessions: 3 }]);
  });
});

describe('récords personales', () => {
  const history = index.get(id)!;
  const cur = (sets: ReturnType<typeof makeSet>[]) => bench(sets);

  it('sin historial no hay PR', () => {
    expect(detectPRs(cur([makeSet({ weight: 200 })]), [])).toEqual({ bySet: {}, volume: false });
  });
  it('nuevo peso máximo', () => {
    const r = detectPRs(cur([makeSet({ id: 'n', weight: 70, reps: 5 })]), history);
    expect(r.bySet.n).toEqual(['max_weight']);
  });
  it('mismo peso máximo no es PR', () => {
    expect(detectPRs(cur([makeSet({ id: 'n', weight: 65, reps: 8 })]), history).bySet.n).toBeUndefined();
  });
  it('más repeticiones con un peso ya usado', () => {
    const r = detectPRs(cur([makeSet({ id: 'n', weight: 60, reps: 11 })]), history);
    expect(r.bySet.n).toEqual(['rep_record']);
  });
  it('solo la primera serie que supera la marca recibe el PR', () => {
    const r = detectPRs(cur([makeSet({ id: 'a1', weight: 70, reps: 5 }), makeSet({ id: 'a2', weight: 70, reps: 5 })]), history);
    expect(Object.keys(r.bySet)).toEqual(['a1']);
  });
  it('mayor volumen que cualquier sesión previa', () => {
    const sets = [1, 2, 3].map((n) => makeSet({ id: `v${n}`, weight: 60, reps: 10 }));
    expect(detectPRs(cur(sets), history).volume).toBe(true); // 1800 > 1080
  });
  it('series incompletas no cuentan', () => {
    expect(detectPRs(cur([makeSet({ id: 'n', weight: 100, completed: false })]), history).bySet).toEqual({});
  });
});
