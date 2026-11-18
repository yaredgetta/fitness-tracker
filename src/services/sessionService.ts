import type { CatalogExercise } from '../models/exercise';
import type { SessionExercise, SetEntry, WorkoutSession } from '../models/session';
import { applyFailure, applyRir } from '../utils/rir';
import { canCompleteSet } from '../utils/validation';
import { elapsedSeconds } from '../utils/dates';
import { uid } from '../utils/ids';

export function createSession(now: Date = new Date()): WorkoutSession {
  return {
    id: uid('session'),
    startedAt: now.toISOString(),
    durationSec: 0,
    status: 'active',
    exercises: [],
  };
}

export function createSet(setNumber: number, template?: SetEntry): SetEntry {
  return {
    id: uid('set'),
    setNumber,
    weight: template?.weight ?? 0,
    reps: template?.reps ?? 0,
    rir: null,
    failure: false,
    completed: false,
  };
}

/** Agrega un ejercicio del catálogo con una serie vacía. Ignora los no registrables (cardio, etc.). */
export function addExercise(session: WorkoutSession, ex: CatalogExercise): WorkoutSession {
  if (!ex.trackable || !ex.primaryMuscle) return session;
  const entry: SessionExercise = {
    exerciseId: ex.id,
    name: ex.name.es,
    primaryMuscle: ex.primaryMuscle,
    secondaryMuscles: ex.secondaryMuscles,
    sets: [createSet(1)],
  };
  return { ...session, exercises: [...session.exercises, entry] };
}

export function removeExercise(session: WorkoutSession, exIdx: number): WorkoutSession {
  return { ...session, exercises: session.exercises.filter((_, i) => i !== exIdx) };
}

function mapExercise(
  session: WorkoutSession,
  exIdx: number,
  fn: (e: SessionExercise) => SessionExercise,
): WorkoutSession {
  return { ...session, exercises: session.exercises.map((e, i) => (i === exIdx ? fn(e) : e)) };
}

function mapSet(
  session: WorkoutSession,
  exIdx: number,
  setId: string,
  fn: (s: SetEntry) => SetEntry,
): WorkoutSession {
  return mapExercise(session, exIdx, (e) => ({
    ...e,
    sets: e.sets.map((s) => (s.id === setId ? fn(s) : s)),
  }));
}

/** Nueva serie con el peso y repeticiones de la anterior como punto de partida. */
export function addSet(session: WorkoutSession, exIdx: number): WorkoutSession {
  return mapExercise(session, exIdx, (e) => ({
    ...e,
    sets: [...e.sets, createSet(e.sets.length + 1, e.sets[e.sets.length - 1])],
  }));
}

export function removeSet(session: WorkoutSession, exIdx: number, setId: string): WorkoutSession {
  return mapExercise(session, exIdx, (e) => ({
    ...e,
    sets: e.sets.filter((s) => s.id !== setId).map((s, i) => ({ ...s, setNumber: i + 1 })),
  }));
}

export const updateSetValues = (
  session: WorkoutSession,
  exIdx: number,
  setId: string,
  patch: Partial<Pick<SetEntry, 'weight' | 'reps'>>,
) => mapSet(session, exIdx, setId, (s) => ({ ...s, ...patch }));

export const setSetRir = (session: WorkoutSession, exIdx: number, setId: string, rir: number | null) =>
  mapSet(session, exIdx, setId, (s) => applyRir(s, rir));

export const setSetFailure = (session: WorkoutSession, exIdx: number, setId: string, failure: boolean) =>
  mapSet(session, exIdx, setId, (s) => applyFailure(s, failure));

/** Marca/desmarca la serie. No permite completar una serie inválida. */
export const toggleSetCompleted = (session: WorkoutSession, exIdx: number, setId: string) =>
  mapSet(session, exIdx, setId, (s) => {
    if (s.completed) return { ...s, completed: false };
    return canCompleteSet(s) && s.reps >= 1 ? { ...s, completed: true } : s;
  });

/** Cierra la sesión: conserva solo series completadas y quita ejercicios que queden vacíos. */
export function finishSession(session: WorkoutSession, now: Date = new Date()): WorkoutSession {
  const exercises = session.exercises
    .map((e) => ({
      ...e,
      sets: e.sets.filter((s) => s.completed).map((s, i) => ({ ...s, setNumber: i + 1 })),
    }))
    .filter((e) => e.sets.length > 0);
  return {
    ...session,
    exercises,
    status: 'finished',
    endedAt: now.toISOString(),
    durationSec: elapsedSeconds(session.startedAt, now),
  };
}
