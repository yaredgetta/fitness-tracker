import type { SetEntry, WorkoutSession } from '../models/session';
import { MAX_RIR } from './rir';

export type SetError =
  | 'weight_invalid'
  | 'reps_invalid'
  | 'rir_invalid'
  | 'failure_inconsistent';

const isFiniteNonNegative = (n: unknown): n is number =>
  typeof n === 'number' && Number.isFinite(n) && n >= 0;

/** Errores que impiden completar/guardar la serie. Lista vacía = válida. */
export function validateSet(set: SetEntry): SetError[] {
  const errors: SetError[] = [];
  if (!isFiniteNonNegative(set.weight)) errors.push('weight_invalid'); // 0 permitido
  if (!Number.isInteger(set.reps) || set.reps < 1) errors.push('reps_invalid');
  if (set.rir !== null && (!Number.isInteger(set.rir) || set.rir < 0 || set.rir > MAX_RIR)) {
    errors.push('rir_invalid');
  }
  if (set.failure && set.rir !== 0) errors.push('failure_inconsistent');
  if (!set.failure && set.rir === 0) errors.push('failure_inconsistent');
  return errors;
}

export const isSetValid = (set: SetEntry): boolean => validateSet(set).length === 0;

/** Una serie solo puede marcarse como completada si es válida. */
export function canCompleteSet(set: SetEntry): boolean {
  return isSetValid(set);
}

/** Sesión lista para finalizar: al menos una serie completada y todas las completadas válidas. */
export function validateSessionForFinish(session: WorkoutSession): { ok: boolean; reason?: string } {
  const completed = session.exercises.flatMap((e) => e.sets.filter((s) => s.completed));
  if (completed.length === 0) return { ok: false, reason: 'no_completed_sets' };
  if (completed.some((s) => !isSetValid(s))) return { ok: false, reason: 'invalid_set' };
  return { ok: true };
}
