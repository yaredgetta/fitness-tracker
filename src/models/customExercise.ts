import type { MuscleGroup } from './muscle';

/** Ejercicio creado por el usuario. Su id siempre empieza con "custom/". */
export interface CustomExercise {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  createdAt: string;
}
