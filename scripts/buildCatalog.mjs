/**
 * Une las listas de ejercicios en español e inglés en el formato que usa la app
 * (assets/data/exercises.json). Lógica pura: no toca red ni disco.
 */
export const SOURCE_URL = 'https://github.com/JahelCuadrado/ExerciseGymGifsDB';

const REQUIRED = ['id', 'slug', 'muscle', 'bodyPart', 'equipment', 'category'];

/** Acepta una lista directa o un objeto con la lista dentro (`exercises`, `data` o `items`). */
function toList(data, label) {
  if (Array.isArray(data)) return data;
  for (const key of ['exercises', 'data', 'items']) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  throw new Error(`No reconozco el formato del archivo "${label}": se esperaba una lista de ejercicios.`);
}

const asLines = (v) => (Array.isArray(v) ? v.map(String) : typeof v === 'string' && v ? [v] : []);

/**
 * @param {unknown} esData contenido de api/es/exercises.json
 * @param {unknown} enData contenido de api/en/exercises.json
 * @returns {{ catalog: { source: string, count: number, exercises: object[] }, warnings: string[] }}
 */
export function buildCatalog(esData, enData) {
  const es = toList(esData, 'es');
  const en = toList(enData, 'en');
  const enById = new Map(en.map((e) => [e.id, e]));
  const warnings = [];

  const exercises = es.map((e) => {
    for (const field of REQUIRED) {
      if (typeof e[field] !== 'string' || !e[field]) {
        throw new Error(`Un ejercicio no tiene el campo "${field}" (id: ${e.id ?? 'desconocido'}).`);
      }
    }
    const twin = enById.get(e.id);
    if (!twin) warnings.push(`Sin versión en inglés: ${e.id}`);
    return {
      id: e.id,
      slug: e.slug,
      muscle: e.muscle,
      bodyPart: e.bodyPart,
      equipment: e.equipment,
      category: e.category,
      secondaryMuscles: Array.isArray(e.secondaryMuscles) ? e.secondaryMuscles.map(String) : [],
      name: { es: String(e.name ?? ''), en: String(twin?.name ?? e.name ?? '') },
      instructions: { es: asLines(e.instructions), en: twin ? asLines(twin.instructions) : [] },
    };
  });

  const esIds = new Set(es.map((e) => e.id));
  for (const e of en) if (!esIds.has(e.id)) warnings.push(`Solo existe en inglés (se omite): ${e.id}`);

  return { catalog: { source: SOURCE_URL, count: exercises.length, exercises }, warnings };
}
