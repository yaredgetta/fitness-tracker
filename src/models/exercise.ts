import type { MuscleGroup } from './muscle';

/** Forma cruda de cada entrada de assets/data/exercises.json */
export interface RawExercise {
  id: string;
  slug: string;
  muscle: string;
  bodyPart: string;
  equipment: string;
  category: 'strength' | 'stretching' | 'cardio' | 'plyometrics' | string;
  secondaryMuscles: string[];
  name: { es: string; en: string };
  instructions: { es: string[]; en: string[] };
}

export interface RawCatalogFile {
  source: string;
  count: number;
  exercises: RawExercise[];
}

/** Ejercicio del catálogo ya normalizado para la app. */
export interface CatalogExercise {
  id: string;
  name: { es: string; en: string };
  equipment: string;
  category: string;
  /** Músculo principal traducido a los 11 grupos del mapa (null si no aplica, p. ej. cardio). */
  primaryMuscle: MuscleGroup | null;
  /** Grupos secundarios, sin duplicados y sin repetir el principal. */
  secondaryMuscles: MuscleGroup[];
  instructions: { es: string[]; en: string[] };
  /** Si puede registrarse con peso/reps/RIR y contar para volumen. */
  trackable: boolean;
}
