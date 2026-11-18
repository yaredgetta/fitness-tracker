import type { RawCatalogFile } from '../src/models/exercise';
import fs from 'fs';
import path from 'path';
import { createCatalog } from '../src/services/exerciseCatalog';
import {
  addExercise, addSet, createSession, finishSession, removeSet,
  setSetFailure, setSetRir, toggleSetCompleted, updateSetValues,
} from '../src/services/sessionService';

const catalog = createCatalog(
  JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/data/exercises.json'), 'utf8')) as RawCatalogFile,
);
const bench = catalog.getById('pectorals/barbell-bench-press')!;
const NOW = new Date('2026-11-11T10:00:00Z');

const withBench = () => addExercise(createSession(NOW), bench);

describe('sessionService', () => {
  it('agrega ejercicio con una serie vacía', () => {
    const s = withBench();
    expect(s.exercises).toHaveLength(1);
    expect(s.exercises[0].sets).toHaveLength(1);
    expect(s.exercises[0].primaryMuscle).toBe('chest');
  });

  it('ignora ejercicios no registrables (cardio)', () => {
    const cardio = catalog.all().find((e) => !e.trackable)!;
    expect(addExercise(createSession(NOW), cardio).exercises).toHaveLength(0);
  });

  it('la nueva serie copia peso y reps de la anterior', () => {
    let s = withBench();
    const id = s.exercises[0].sets[0].id;
    s = updateSetValues(s, 0, id, { weight: 60, reps: 10 });
    s = addSet(s, 0);
    expect(s.exercises[0].sets[1]).toMatchObject({ setNumber: 2, weight: 60, reps: 10, completed: false });
  });

  it('no completa series sin repeticiones y sí las válidas', () => {
    let s = withBench();
    const id = s.exercises[0].sets[0].id;
    expect(toggleSetCompleted(s, 0, id).exercises[0].sets[0].completed).toBe(false);
    s = updateSetValues(s, 0, id, { weight: 0, reps: 12 }); // peso corporal
    expect(toggleSetCompleted(s, 0, id).exercises[0].sets[0].completed).toBe(true);
  });

  it('mantiene RIR y fallo consistentes', () => {
    let s = withBench();
    const id = s.exercises[0].sets[0].id;
    s = setSetFailure(s, 0, id, true);
    expect(s.exercises[0].sets[0]).toMatchObject({ rir: 0, failure: true });
    s = setSetRir(s, 0, id, 2);
    expect(s.exercises[0].sets[0]).toMatchObject({ rir: 2, failure: false });
  });

  it('al eliminar una serie renumera las demás', () => {
    let s = addSet(addSet(withBench(), 0), 0);
    const ids = s.exercises[0].sets.map((x) => x.id);
    s = removeSet(s, 0, ids[0]);
    expect(s.exercises[0].sets.map((x) => x.setNumber)).toEqual([1, 2]);
  });

  it('finalizar descarta series incompletas y calcula la duración', () => {
    let s = addSet(withBench(), 0);
    const [a] = s.exercises[0].sets;
    s = updateSetValues(s, 0, a.id, { weight: 60, reps: 10 });
    s = toggleSetCompleted(s, 0, a.id);
    const done = finishSession(s, new Date('2026-11-11T10:45:00Z'));
    expect(done.status).toBe('finished');
    expect(done.durationSec).toBe(45 * 60);
    expect(done.exercises[0].sets).toHaveLength(1);
  });

  it('finalizar quita ejercicios sin series completadas', () => {
    expect(finishSession(withBench(), NOW).exercises).toHaveLength(0);
  });
});
