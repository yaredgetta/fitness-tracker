import type { SessionExercise } from '../models/session';
import type { ExerciseHistoryEntry } from './historyService';
import { exerciseVolume, maxWeight } from '../utils/volume';

export type PRType = 'max_weight' | 'rep_record' | 'volume';

export interface ExercisePRs {
  /** setId -> récords que logró esa serie (la primera que los alcanza). */
  bySet: Record<string, PRType[]>;
  /** El volumen del ejercicio en esta sesión supera el mejor histórico. */
  volume: boolean;
}

/**
 * Detecta récords personales comparando con el historial real.
 * Sin historial previo no hay nada que superar, así que no se marca ningún PR.
 * Solo cuentan las series completadas; los PR se otorgan a la primera serie que supera la marca.
 */
export function detectPRs(current: SessionExercise, history: ExerciseHistoryEntry[]): ExercisePRs {
  if (history.length === 0) return { bySet: {}, volume: false };

  let bestWeight = Math.max(...history.map((h) => maxWeight(h.exercise)));
  const bestVolume = Math.max(...history.map((h) => exerciseVolume(h.exercise)));
  const bestReps = new Map<number, number>();
  for (const h of history) {
    for (const s of h.exercise.sets) bestReps.set(s.weight, Math.max(bestReps.get(s.weight) ?? 0, s.reps));
  }

  const bySet: Record<string, PRType[]> = {};
  for (const set of current.sets) {
    if (!set.completed || set.reps < 1) continue;
    const types: PRType[] = [];
    if (set.weight > 0 && set.weight > bestWeight) {
      types.push('max_weight');
      bestWeight = set.weight;
    }
    const prevReps = bestReps.get(set.weight);
    if (prevReps !== undefined && set.reps > prevReps) types.push('rep_record');
    bestReps.set(set.weight, Math.max(prevReps ?? 0, set.reps));
    if (types.length) bySet[set.id] = types;
  }

  return { bySet, volume: bestVolume > 0 && exerciseVolume(current) > bestVolume };
}
