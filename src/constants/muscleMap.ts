import type { MuscleGroup } from '../models/muscle';

/**
 * Traducción de los 19 músculos del catálogo a los 11 grupos del mapa anatómico.
 * null = no se representa (cardio).
 */
export const CATALOG_TO_GROUP: Record<string, MuscleGroup | null> = {
  pectorals: 'chest',
  lats: 'back',
  'upper-back': 'back',
  traps: 'back',
  spine: 'back',
  'levator-scapulae': 'back',
  delts: 'shoulders',
  biceps: 'biceps',
  triceps: 'triceps',
  forearms: 'forearms',
  abs: 'abs',
  'serratus-anterior': 'abs',
  quads: 'quads',
  adductors: 'quads',
  hamstrings: 'hamstrings',
  glutes: 'glutes',
  abductors: 'glutes',
  calves: 'calves',
  cardio: null,
};

export function toMuscleGroup(raw: string): MuscleGroup | null {
  return CATALOG_TO_GROUP[raw] ?? null;
}

/** Cuánto del volumen de una serie se atribuye a cada tipo de músculo. */
export const MUSCLE_WEIGHT = { primary: 1, secondary: 0.5 } as const;
