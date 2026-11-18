import type { CatalogExercise, RawCatalogFile, RawExercise } from '../models/exercise';
import type { MuscleGroup } from '../models/muscle';
import { toMuscleGroup } from '../constants/muscleMap';

const TRACKABLE_CATEGORIES = new Set(['strength', 'plyometrics']);

/** Minúsculas, sin acentos ni signos ("Pull-up," -> "pull up"). */
export const normalizeText = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ]+/g, ' ')
    .trim();

/** Plural simple: "sentadillas" busca también "sentadilla". */
export const stemToken = (t: string): string => (t.length > 3 && t.endsWith('s') ? t.slice(0, -1) : t);

export const searchTokens = (query: string): string[] =>
  normalizeText(query).split(' ').filter(Boolean).map(stemToken);

/** Mayor puntaje = más relevante. Empezar con la palabra pesa más que contenerla. */
export function relevance(nameEs: string, nameEn: string, tokens: string[]): number {
  const es = normalizeText(nameEs);
  const en = normalizeText(nameEn);
  const words = es.split(' ');
  let score = 0;
  for (const t of tokens) {
    if (words.some((w) => w.startsWith(t))) score += 3;
    else if (es.includes(t)) score += 2;
    else if (en.includes(t)) score += 1;
  }
  return score - es.length / 1000; // a igual relevancia, nombres más cortos primero
}

export function toCatalogExercise(raw: RawExercise): CatalogExercise {
  const primary = toMuscleGroup(raw.muscle);
  const secondary = Array.from(
    new Set(
      raw.secondaryMuscles
        .map(toMuscleGroup)
        .filter((g): g is MuscleGroup => g !== null && g !== primary),
    ),
  );
  return {
    id: raw.id,
    name: raw.name,
    equipment: raw.equipment,
    category: raw.category,
    primaryMuscle: primary,
    secondaryMuscles: secondary,
    instructions: raw.instructions,
    trackable: primary !== null && TRACKABLE_CATEGORIES.has(raw.category),
  };
}

export interface SearchOptions {
  query?: string;
  muscle?: MuscleGroup;
  /** Alternativa a `muscle`: acepta cualquiera de estos músculos como principal. */
  muscles?: readonly MuscleGroup[];
  equipment?: string;
  includeNonTrackable?: boolean;
  limit?: number;
}

export interface ExerciseCatalog {
  all(): CatalogExercise[];
  getById(id: string): CatalogExercise | undefined;
  search(options?: SearchOptions): CatalogExercise[];
  equipmentOptions(): string[];
}

export function createCatalog(file: RawCatalogFile): ExerciseCatalog {
  const items = file.exercises.map(toCatalogExercise);
  const byId = new Map(items.map((e) => [e.id, e]));
  // Texto de búsqueda precalculado (es + en, sin acentos).
  const haystack = new Map(
    items.map((e) => [e.id, normalizeText(`${e.name.es} ${e.name.en}`)]),
  );

  return {
    all: () => items,
    getById: (id) => byId.get(id),
    equipmentOptions: () => Array.from(new Set(items.map((e) => e.equipment))).sort(),
    search({ query, muscle, muscles, equipment, includeNonTrackable = false, limit = 50 } = {}) {
      const tokens = query ? searchTokens(query) : [];
      const out: CatalogExercise[] = [];
      for (const e of items) {
        if (!includeNonTrackable && !e.trackable) continue;
        if (muscle && e.primaryMuscle !== muscle) continue;
        if (muscles && (!e.primaryMuscle || !muscles.includes(e.primaryMuscle))) continue;
        if (equipment && e.equipment !== equipment) continue;
        if (tokens.length) {
          const h = haystack.get(e.id)!;
          if (!tokens.every((t) => h.includes(t))) continue;
        }
        out.push(e);
        if (!tokens.length && out.length >= limit) break;
      }
      if (tokens.length) {
        out.sort((a, b) => relevance(b.name.es, b.name.en, tokens) - relevance(a.name.es, a.name.en, tokens));
      }
      return out.slice(0, limit);
    },
  };
}

let singleton: ExerciseCatalog | null = null;

/** Catálogo empaquetado con la app (se indexa una sola vez). */
export function getExerciseCatalog(): ExerciseCatalog {
  if (!singleton) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    singleton = createCatalog(require('../../assets/data/exercises.json') as RawCatalogFile);
  }
  return singleton;
}
