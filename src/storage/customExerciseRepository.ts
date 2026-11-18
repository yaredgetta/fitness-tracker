import type { CustomExercise } from '../models/customExercise';
import { getKeyValueStore } from './kv';
import { KEYS } from './keys';
import { unwrap, wrap } from './envelope';
import { isCustomExerciseList } from './guards';

export const customExerciseRepository = {
  async getAll(): Promise<CustomExercise[]> {
    return unwrap<CustomExercise[]>(await getKeyValueStore().getItem(KEYS.customExercises), isCustomExerciseList) ?? [];
  },
  async saveAll(list: CustomExercise[]): Promise<void> {
    await getKeyValueStore().setItem(KEYS.customExercises, wrap(list));
  },
};
