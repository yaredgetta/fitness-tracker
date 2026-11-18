import { create } from 'zustand';
import type { CustomExercise } from '../models/customExercise';
import { customExerciseRepository } from '../storage/customExerciseRepository';
import {
  createCustomExercise, validateCustomExercise,
  type CustomExerciseError, type CustomExerciseInput,
} from '../services/customExerciseService';

export type AddResult = { ok: true; exercise: CustomExercise } | { ok: false; error: CustomExerciseError };

interface CustomExerciseState {
  items: CustomExercise[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  add: (input: CustomExerciseInput) => Promise<AddResult>;
  /** Quita el ejercicio de la lista. Las sesiones ya guardadas conservan su nombre y músculos. */
  remove: (id: string) => Promise<void>;
}

export const useCustomExerciseStore = create<CustomExerciseState>((set, get) => ({
  items: [],
  hydrated: false,
  async hydrate() {
    set({ items: await customExerciseRepository.getAll(), hydrated: true });
  },
  async add(input) {
    const error = validateCustomExercise(input, get().items);
    if (error) return { ok: false, error };
    const exercise = createCustomExercise(input);
    const items = [...get().items, exercise];
    await customExerciseRepository.saveAll(items);
    set({ items });
    return { ok: true, exercise };
  },
  async remove(id) {
    const items = get().items.filter((e) => e.id !== id);
    await customExerciseRepository.saveAll(items);
    set({ items });
  },
}));
