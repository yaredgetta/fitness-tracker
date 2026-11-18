import type { MuscleGroup } from './muscle';

export interface SetEntry {
  id: string;
  setNumber: number;
  /** kg, >= 0. 0 es válido (peso corporal). */
  weight: number;
  /** Repeticiones, entero >= 1 para series completadas. */
  reps: number;
  /** 0..5 o null si aún no se registra. Si failure === true, rir === 0. */
  rir: number | null;
  failure: boolean;
  completed: boolean;
}

export interface SessionExercise {
  /** Id del catálogo ("pectorals/barbell-bench-press") o "custom/<uuid>". */
  exerciseId: string;
  /** Copia del nombre al momento de entrenar: el historial no depende del catálogo. */
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  sets: SetEntry[];
}

export type SessionStatus = 'active' | 'finished';

export interface WorkoutSession {
  id: string;
  /** ISO 8601 */
  startedAt: string;
  endedAt?: string;
  durationSec: number;
  status: SessionStatus;
  exercises: SessionExercise[];
}
