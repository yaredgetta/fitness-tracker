import fs from 'fs';
import path from 'path';
import type { RawCatalogFile } from '../src/models/exercise';
import { CATALOG_TO_GROUP } from '../src/constants/muscleMap';
import { createCatalog } from '../src/services/exerciseCatalog';

const raw: RawCatalogFile = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../assets/data/exercises.json'), 'utf8'),
);
const catalog = createCatalog(raw);

describe('catálogo', () => {
  it('carga los 1323 ejercicios con ids únicos', () => {
    expect(catalog.all()).toHaveLength(raw.count);
    expect(new Set(catalog.all().map((e) => e.id)).size).toBe(raw.count);
  });

  it('la tabla de músculos cubre todos los valores del catálogo', () => {
    const used = new Set<string>();
    raw.exercises.forEach((e) => { used.add(e.muscle); e.secondaryMuscles.forEach((m) => used.add(m)); });
    const missing = [...used].filter((m) => !(m in CATALOG_TO_GROUP));
    expect(missing).toEqual([]);
  });

  it('traduce el press de banca', () => {
    const e = catalog.getById('pectorals/barbell-bench-press')!;
    expect(e.primaryMuscle).toBe('chest');
    expect(e.secondaryMuscles).toContain('triceps');
    expect(e.secondaryMuscles).not.toContain('chest');
    expect(e.trackable).toBe(true);
  });

  it('excluye cardio y estiramientos por defecto', () => {
    const results = catalog.search({ limit: 5000 });
    expect(results.every((e) => e.trackable)).toBe(true);
    expect(results.length).toBeLessThan(raw.count);
    expect(catalog.search({ includeNonTrackable: true, limit: 5000 }).length).toBe(raw.count);
  });

  it('busca sin acentos y en ambos idiomas', () => {
    const es = catalog.search({ query: 'abduccion cadera' });
    expect(es.length).toBeGreaterThan(0);
    const en = catalog.search({ query: 'bench press barbell', muscle: 'chest' });
    expect(en.length).toBeGreaterThan(0);
    expect(en.every((e) => e.primaryMuscle === 'chest')).toBe(true);
  });

  it('secundarios sin duplicados', () => {
    for (const e of catalog.all()) {
      expect(new Set(e.secondaryMuscles).size).toBe(e.secondaryMuscles.length);
    }
  });
});
