import type { MuscleGroup } from '../models/muscle';

/** Categorías simples para filtrar al buscar un ejercicio. */
export type ExerciseCategory = 'legs' | 'arms' | 'chest' | 'back' | 'abs';

export const CATEGORIES: readonly ExerciseCategory[] = ['legs', 'arms', 'chest', 'back', 'abs'];

export const CATEGORY_LABELS_ES: Record<ExerciseCategory, string> = {
  legs: 'Piernas',
  arms: 'Brazos',
  chest: 'Pecho',
  back: 'Espalda',
  abs: 'Abdomen',
};

/**
 * Qué músculos (principal del ejercicio) pertenecen a cada categoría.
 * Los hombros se agrupan en Brazos para que ningún ejercicio quede sin categoría.
 * El mapa muscular del Dashboard sigue usando los 11 grupos.
 */
export const CATEGORY_MUSCLES: Record<ExerciseCategory, readonly MuscleGroup[]> = {
  legs: ['quads', 'hamstrings', 'glutes', 'calves'],
  arms: ['biceps', 'triceps', 'forearms', 'shoulders'],
  chest: ['chest'],
  back: ['back'],
  abs: ['abs'],
};
