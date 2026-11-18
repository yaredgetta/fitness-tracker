import type { CatalogExercise } from '../models/exercise';
import type { CustomExercise } from '../models/customExercise';
import { CATEGORY_MUSCLES, type ExerciseCategory } from '../constants/exerciseCategories';
import { normalizeText, relevance, searchTokens, type ExerciseCatalog } from './exerciseCatalog';
import { customToCatalog } from './customExerciseService';

export interface PickerItem {
  exercise: CatalogExercise;
  custom: boolean;
}

export interface PickerSearch {
  query?: string;
  category?: ExerciseCategory;
}

/**
 * Busca en los ejercicios personalizados y en el catálogo.
 * Los personalizados van primero. Devuelve los primeros `limit` y el total encontrado.
 */
export function searchExercises(
  catalog: ExerciseCatalog,
  customs: CustomExercise[],
  { query, category }: PickerSearch,
  limit = 80,
): { items: PickerItem[]; total: number } {
  const tokens = query ? searchTokens(query) : [];
  const muscles = category ? CATEGORY_MUSCLES[category] : undefined;

  const customItems = customs
    .filter((c) => !muscles || muscles.includes(c.primaryMuscle))
    .filter((c) => tokens.every((t) => normalizeText(c.name).includes(t)))
    .sort((a, b) =>
      tokens.length
        ? relevance(b.name, b.name, tokens) - relevance(a.name, a.name, tokens)
        : a.name.localeCompare(b.name, 'es'),
    )
    .map((c): PickerItem => ({ exercise: customToCatalog(c), custom: true }));

  const catalogItems = catalog
    .search({ query, muscles, limit: Number.MAX_SAFE_INTEGER })
    .map((e): PickerItem => ({ exercise: e, custom: false }));

  const all = [...customItems, ...catalogItems];
  return { items: all.slice(0, limit), total: all.length };
}
