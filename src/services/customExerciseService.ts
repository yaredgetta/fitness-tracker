import type { CatalogExercise } from '../models/exercise';
import type { CustomExercise } from '../models/customExercise';
import type { MuscleGroup } from '../models/muscle';
import { uid } from '../utils/ids';

export const MAX_NAME_LENGTH = 60;

export interface CustomExerciseInput {
  name: string;
  primaryMuscle: MuscleGroup | null;
  secondaryMuscles: MuscleGroup[];
}

export type CustomExerciseError = 'name_required' | 'name_too_long' | 'duplicate' | 'muscle_required';

const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();

export function validateCustomExercise(
  input: CustomExerciseInput,
  existing: CustomExercise[],
): CustomExerciseError | null {
  const name = input.name.trim();
  if (!name) return 'name_required';
  if (name.length > MAX_NAME_LENGTH) return 'name_too_long';
  if (!input.primaryMuscle) return 'muscle_required';
  if (existing.some((e) => norm(e.name) === norm(name))) return 'duplicate';
  return null;
}

export function createCustomExercise(input: CustomExerciseInput, now: Date = new Date()): CustomExercise {
  const primary = input.primaryMuscle as MuscleGroup;
  return {
    id: `custom/${uid('c')}`,
    name: input.name.trim().replace(/\s+/g, ' '),
    primaryMuscle: primary,
    secondaryMuscles: Array.from(new Set(input.secondaryMuscles)).filter((m) => m !== primary),
    createdAt: now.toISOString(),
  };
}

/** Adapta un ejercicio personalizado al mismo formato que usa el catálogo. */
export function customToCatalog(c: CustomExercise): CatalogExercise {
  return {
    id: c.id,
    name: { es: c.name, en: c.name },
    equipment: 'personalizado',
    category: 'strength',
    primaryMuscle: c.primaryMuscle,
    secondaryMuscles: c.secondaryMuscles,
    instructions: { es: [], en: [] },
    trackable: true,
  };
}

export const CUSTOM_ERROR_MESSAGES: Record<CustomExerciseError, string> = {
  name_required: 'Escribe un nombre.',
  name_too_long: `El nombre es demasiado largo (máximo ${MAX_NAME_LENGTH} caracteres).`,
  duplicate: 'Ya tienes un ejercicio personalizado con ese nombre.',
  muscle_required: 'Elige el músculo principal.',
};
