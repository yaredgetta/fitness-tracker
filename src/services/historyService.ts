import type { SessionExercise, WorkoutSession } from '../models/session';

export interface ExerciseHistoryEntry {
  sessionId: string;
  /** Fecha de inicio de la sesión (ISO). */
  date: string;
  /** El ejercicio tal como se hizo, solo con series completadas. */
  exercise: SessionExercise;
}

/** exerciseId -> registros del más reciente al más antiguo. */
export type ExerciseIndex = Map<string, ExerciseHistoryEntry[]>;

export function buildExerciseIndex(sessions: WorkoutSession[]): ExerciseIndex {
  const index: ExerciseIndex = new Map();
  for (const session of sessions) {
    if (session.status !== 'finished') continue;
    for (const ex of session.exercises) {
      const sets = ex.sets.filter((s) => s.completed);
      if (sets.length === 0) continue;
      const list = index.get(ex.exerciseId) ?? [];
      list.push({ sessionId: session.id, date: session.startedAt, exercise: { ...ex, sets } });
      index.set(ex.exerciseId, list);
    }
  }
  for (const list of index.values()) list.sort((a, b) => b.date.localeCompare(a.date));
  return index;
}
