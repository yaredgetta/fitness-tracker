import type { SessionExercise, SetEntry, WorkoutSession } from '../models/session';

/** Volumen de una serie = peso × repeticiones. */
export function setVolume(set: Pick<SetEntry, 'weight' | 'reps'>): number {
  return set.weight * set.reps;
}

/** Solo las series completadas cuentan en estadísticas. */
export function completedSets(exercise: SessionExercise): SetEntry[] {
  return exercise.sets.filter((s) => s.completed);
}

export function exerciseVolume(exercise: SessionExercise): number {
  return completedSets(exercise).reduce((sum, s) => sum + setVolume(s), 0);
}

export function sessionVolume(session: WorkoutSession): number {
  return session.exercises.reduce((sum, e) => sum + exerciseVolume(e), 0);
}

export function completedSetCount(session: WorkoutSession): number {
  return session.exercises.reduce((n, e) => n + completedSets(e).length, 0);
}

export function maxWeight(exercise: SessionExercise): number {
  return completedSets(exercise).reduce((m, s) => Math.max(m, s.weight), 0);
}
