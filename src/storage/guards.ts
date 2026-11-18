import { MUSCLE_GROUPS } from '../models/muscle';
import type { SessionExercise, SetEntry, WorkoutSession } from '../models/session';
import type { UserProfile } from '../models/user';
import type { Settings } from '../models/settings';
import type { CustomExercise } from '../models/customExercise';

/**
 * Comprobaciones estructurales de lo que se lee del almacenamiento.
 * Son deliberadamente permisivas (solo tipos): su objetivo es evitar que un dato
 * dañado rompa la app, no rechazar sesiones legítimas.
 */
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;
const isStr = (x: unknown): x is string => typeof x === 'string';
const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const isMuscle = (x: unknown) => isStr(x) && (MUSCLE_GROUPS as readonly string[]).includes(x);

export function isSetEntry(x: unknown): x is SetEntry {
  return (
    isObj(x) && isStr(x.id) && isNum(x.setNumber) && isNum(x.weight) && isNum(x.reps) &&
    (x.rir === null || isNum(x.rir)) && typeof x.failure === 'boolean' && typeof x.completed === 'boolean'
  );
}

export function isSessionExercise(x: unknown): x is SessionExercise {
  return (
    isObj(x) && isStr(x.exerciseId) && isStr(x.name) && isMuscle(x.primaryMuscle) &&
    Array.isArray(x.secondaryMuscles) && x.secondaryMuscles.every(isMuscle) &&
    Array.isArray(x.sets) && x.sets.every(isSetEntry)
  );
}

export function isWorkoutSession(x: unknown): x is WorkoutSession {
  return (
    isObj(x) && isStr(x.id) && isStr(x.startedAt) && !Number.isNaN(new Date(x.startedAt).getTime()) &&
    isNum(x.durationSec) && (x.status === 'active' || x.status === 'finished') &&
    Array.isArray(x.exercises) && x.exercises.every(isSessionExercise)
  );
}

export function isUserProfile(x: unknown): x is UserProfile {
  return isObj(x) && isStr(x.id) && isStr(x.name) && isStr(x.createdAt);
}

export function isSessionIndex(x: unknown): x is { id: string; startedAt: string }[] {
  return Array.isArray(x) && x.every((e) => isObj(e) && isStr(e.id) && isStr(e.startedAt));
}

export function isSettings(x: unknown): x is Settings {
  return isObj(x) && (x.weightUnit === 'kg' || x.weightUnit === 'lb');
}

export function isCustomExercise(x: unknown): x is CustomExercise {
  return (
    isObj(x) && isStr(x.id) && x.id.startsWith('custom/') && isStr(x.name) && isMuscle(x.primaryMuscle) &&
    Array.isArray(x.secondaryMuscles) && x.secondaryMuscles.every(isMuscle) && isStr(x.createdAt)
  );
}

export function isCustomExerciseList(x: unknown): x is CustomExercise[] {
  return Array.isArray(x) && x.every(isCustomExercise);
}
