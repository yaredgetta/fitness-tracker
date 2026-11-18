import type { SetEntry } from '../models/session';
import { setVolume } from './volume';

export type Trend = 'up' | 'same' | 'down' | 'new';

/** Una caída de rendimiento igual o mayor a este porcentaje anula un aumento de peso. */
export const MAJOR_DROP = 0.15;

export interface SetComparison {
  trend: Trend;
  weightDelta: number;
  repsDelta: number;
  volumeDelta: number;
}

type Lifts = Pick<SetEntry, 'weight' | 'reps'>;

const pct = (cur: number, prev: number) => (prev === 0 ? (cur > 0 ? 1 : 0) : (cur - prev) / prev);

/**
 * Regla común: el rendimiento se mide por volumen (o por repeticiones si es peso corporal).
 * - Caída >= 15 %  -> baja, aunque el peso haya subido.
 * - Sube el volumen, o sube el peso con caída menor al 15 % -> mejora.
 * - Baja el volumen sin subir el peso -> baja.
 * - En cualquier otro caso se mantiene.
 */
function trendFrom(change: number, weightUp: boolean): Trend {
  if (change <= -MAJOR_DROP) return 'down';
  if (change > 0 || (weightUp && change > -MAJOR_DROP)) return 'up';
  if (change < 0) return 'down';
  return 'same';
}

export function compareSet(current: Lifts, previous: Lifts | undefined): SetComparison {
  if (!previous) return { trend: 'new', weightDelta: 0, repsDelta: 0, volumeDelta: 0 };
  const weightDelta = current.weight - previous.weight;
  const repsDelta = current.reps - previous.reps;
  const volumeDelta = setVolume(current) - setVolume(previous);
  if (weightDelta === 0 && repsDelta === 0) return { trend: 'same', weightDelta, repsDelta, volumeDelta };
  const bodyweight = current.weight === 0 && previous.weight === 0;
  const change = bodyweight ? pct(current.reps, previous.reps) : pct(setVolume(current), setVolume(previous));
  return { trend: trendFrom(change, weightDelta > 0), weightDelta, repsDelta, volumeDelta };
}

export interface ExerciseComparison {
  trend: Trend;
  volumeDelta: number;
  volumePct: number;
  maxWeightDelta: number;
  setsDelta: number;
}

export function compareExercise(current: Lifts[], previous: Lifts[]): ExerciseComparison {
  const vol = (sets: Lifts[]) => sets.reduce((n, s) => n + setVolume(s), 0);
  const reps = (sets: Lifts[]) => sets.reduce((n, s) => n + s.reps, 0);
  const max = (sets: Lifts[]) => sets.reduce((m, s) => Math.max(m, s.weight), 0);

  const volumeDelta = vol(current) - vol(previous);
  const bodyweight = max(current) === 0 && max(previous) === 0;
  const change = bodyweight ? pct(reps(current), reps(previous)) : pct(vol(current), vol(previous));
  const maxWeightDelta = max(current) - max(previous);
  return {
    trend: trendFrom(change, maxWeightDelta > 0),
    volumeDelta,
    volumePct: change,
    maxWeightDelta,
    setsDelta: current.length - previous.length,
  };
}
