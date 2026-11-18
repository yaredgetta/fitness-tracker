export const SOURCE_URL: string;

export interface CatalogFileExercise {
  id: string;
  slug: string;
  muscle: string;
  bodyPart: string;
  equipment: string;
  category: string;
  secondaryMuscles: string[];
  name: { es: string; en: string };
  instructions: { es: string[]; en: string[] };
}

export interface BuildResult {
  catalog: { source: string; count: number; exercises: CatalogFileExercise[] };
  warnings: string[];
}

export function buildCatalog(esData: unknown, enData: unknown): BuildResult;
