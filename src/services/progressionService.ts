import type { SetEntry } from '../models/session';
import type { ExerciseHistoryEntry, ExerciseIndex } from './historyService';
import { exerciseVolume, maxWeight } from '../utils/volume';

export type Metric = 'weight' | 'reps' | 'volume' | 'rir';

export interface EntrySummary {
  sets: number;
  maxWeight: number;
  volume: number;
  avgReps: number;
  /** null si ninguna serie tiene RIR registrado. */
  avgRir: number | null;
  /** Serie más pesada (a igual peso, la de más repeticiones). */
  topSet: SetEntry;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function summarizeEntry(entry: ExerciseHistoryEntry): EntrySummary {
  const sets = entry.exercise.sets;
  const rirs = sets.map((s) => s.rir).filter((r): r is number => r !== null);
  const topSet = sets.reduce((best, s) =>
    s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps) ? s : best,
  );
  return {
    sets: sets.length,
    maxWeight: maxWeight(entry.exercise),
    volume: exerciseVolume(entry.exercise),
    avgReps: round1(sets.reduce((n, s) => n + s.reps, 0) / sets.length),
    avgRir: rirs.length ? round1(rirs.reduce((n, r) => n + r, 0) / rirs.length) : null,
    topSet,
  };
}

export interface SeriesPoint {
  date: string;
  value: number;
}

/** Valores por sesión, del más antiguo al más reciente (listo para graficar). */
export function exerciseSeries(entries: ExerciseHistoryEntry[], metric: Metric): SeriesPoint[] {
  const points: SeriesPoint[] = [];
  for (const entry of [...entries].reverse()) {
    const s = summarizeEntry(entry);
    const value =
      metric === 'weight' ? s.maxWeight : metric === 'reps' ? s.avgReps : metric === 'volume' ? s.volume : s.avgRir;
    if (value !== null) points.push({ date: entry.date, value });
  }
  return points;
}

export interface ExerciseOption {
  exerciseId: string;
  name: string;
  sessions: number;
}

/** Ejercicios con historial, el más reciente primero. */
export function exercisesWithHistory(index: ExerciseIndex): ExerciseOption[] {
  return [...index.entries()]
    .map(([exerciseId, entries]) => ({
      exerciseId, name: entries[0].exercise.name, sessions: entries.length, last: entries[0].date,
    }))
    .sort((a, b) => b.last.localeCompare(a.last))
    .map(({ exerciseId, name, sessions }) => ({ exerciseId, name, sessions }));
}

/** Colores distintos para distinguir cada ejercicio en la gráfica. */
export const SERIES_PALETTE = [
  '#FF6A2B', '#3DDC84', '#4DA3FF', '#FFD23F', '#C77DFF', '#FF5A9D', '#2EC4B6', '#B8F35A',
] as const;

export interface ExerciseSeries {
  exerciseId: string;
  name: string;
  /** Del más antiguo al más reciente. */
  points: SeriesPoint[];
  firstDate: string;
  lastDate: string;
}

/**
 * Una serie por ejercicio, para graficarlos todos juntos.
 * Si hay más de `maxSeries`, se quedan los trabajados más recientemente.
 * Se ordenan por su primera aparición: así cada ejercicio conserva su color
 * aunque se agreguen ejercicios nuevos después.
 */
export function multiSeries(
  index: ExerciseIndex,
  metric: Metric,
  maxSeries = SERIES_PALETTE.length,
): { series: ExerciseSeries[]; total: number } {
  const all: ExerciseSeries[] = [];
  for (const [exerciseId, entries] of index) {
    const points = exerciseSeries(entries, metric);
    if (points.length === 0) continue;
    all.push({
      exerciseId,
      name: entries[0].exercise.name,
      points,
      firstDate: points[0].date,
      lastDate: points[points.length - 1].date,
    });
  }
  const shown = all
    .sort((a, b) => b.lastDate.localeCompare(a.lastDate))
    .slice(0, maxSeries)
    .sort((a, b) => a.firstDate.localeCompare(b.firstDate) || a.exerciseId.localeCompare(b.exerciseId));
  return { series: shown, total: all.length };
}
