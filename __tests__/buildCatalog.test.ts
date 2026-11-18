import fs from 'fs';
import path from 'path';
import { buildCatalog, SOURCE_URL } from '../scripts/buildCatalog.mjs';

const es = [
  { id: 'biceps/barbell-curl', slug: 'barbell-curl', muscle: 'biceps', bodyPart: 'arms', equipment: 'barbell', category: 'strength', secondaryMuscles: ['forearms'], name: 'Curl con barra', instructions: ['Paso uno.', 'Paso dos.'] },
  { id: 'abs/crunch', slug: 'crunch', muscle: 'abs', bodyPart: 'waist', equipment: 'bodyweight', category: 'strength', secondaryMuscles: [], name: 'Abdominal', instructions: ['Sube.'] },
];
const en = [
  { ...es[0], name: 'Barbell Curl', instructions: ['Step one.', 'Step two.'] },
  { ...es[1], name: 'Crunch', instructions: ['Lift.'] },
];

describe('buildCatalog (une español e inglés)', () => {
  it('combina nombre e instrucciones de ambos idiomas', () => {
    const { catalog, warnings } = buildCatalog(es, en);
    expect(warnings).toEqual([]);
    expect(catalog.source).toBe(SOURCE_URL);
    expect(catalog.count).toBe(2);
    expect(catalog.exercises[0]).toEqual({
      id: 'biceps/barbell-curl', slug: 'barbell-curl', muscle: 'biceps', bodyPart: 'arms', equipment: 'barbell',
      category: 'strength', secondaryMuscles: ['forearms'],
      name: { es: 'Curl con barra', en: 'Barbell Curl' },
      instructions: { es: ['Paso uno.', 'Paso dos.'], en: ['Step one.', 'Step two.'] },
    });
  });

  it('acepta una lista directa o un objeto con "exercises"', () => {
    const a = buildCatalog(es, en).catalog;
    const b = buildCatalog({ exercises: es }, { exercises: en }).catalog;
    expect(b).toEqual(a);
  });

  it('avisa si falta la versión en inglés y no se cae', () => {
    const { catalog, warnings } = buildCatalog(es, [en[0]]);
    expect(catalog.count).toBe(2);
    expect(warnings).toEqual(['Sin versión en inglés: abs/crunch']);
    expect(catalog.exercises[1].name.en).toBe('Abdominal');
  });

  it('avisa de los ejercicios que solo existen en inglés', () => {
    const extra = { ...en[0], id: 'x/only-en' };
    expect(buildCatalog(es, [...en, extra]).warnings).toEqual(['Solo existe en inglés (se omite): x/only-en']);
  });

  it('rechaza formatos que no reconoce, con un mensaje claro', () => {
    expect(() => buildCatalog({ foo: 1 }, en)).toThrow(/formato/);
    expect(() => buildCatalog(es, 'texto')).toThrow(/formato/);
  });

  it('rechaza ejercicios sin los campos necesarios', () => {
    expect(() => buildCatalog([{ id: 'a' }], en)).toThrow(/slug/);
  });

  it('instrucciones en texto suelto se convierten en lista', () => {
    const { catalog } = buildCatalog([{ ...es[1], instructions: 'Solo una línea.' }], en);
    expect(catalog.exercises[0].instructions.es).toEqual(['Solo una línea.']);
  });

  it('procesa el ejemplo documentado por el proyecto original (con file y gifUrl)', () => {
    const documented = {
      id: 'biceps/barbell-curl', slug: 'barbell-curl', name: 'Curl con barra', muscle: 'biceps', bodyPart: 'arms',
      equipment: 'barbell', category: 'strength', secondaryMuscles: ['forearms'],
      instructions: [
        'Carga el peso adecuado en la barra y adopta la postura inicial.',
        'Activa el biceps antes de iniciar el movimiento.',
      ],
      file: 'biceps/barbell-curl.gif',
      gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/barbell-curl.gif',
    };
    const english = { ...documented, name: 'Barbell Curl', instructions: ['Load the bar.', 'Engage the biceps.'] };

    // como lista directa y como objeto con metadatos + "exercises" (así se usa en el ejemplo `biceps.exercises[0]`)
    for (const [a, b] of [
      [[documented], [english]],
      [{ lang: 'es', count: 1, exercises: [documented] }, { lang: 'en', count: 1, exercises: [english] }],
    ] as const) {
      const { catalog, warnings } = buildCatalog(a, b);
      expect(warnings).toEqual([]);
      const ex = catalog.exercises[0];
      expect(Object.keys(ex)).toEqual(['id', 'slug', 'muscle', 'bodyPart', 'equipment', 'category', 'secondaryMuscles', 'name', 'instructions']);
      expect(ex).not.toHaveProperty('gifUrl');
      expect(ex).not.toHaveProperty('file');
      expect(ex.name).toEqual({ es: 'Curl con barra', en: 'Barbell Curl' });
      expect(ex.instructions.en).toEqual(['Load the bar.', 'Engage the biceps.']);
    }
  });

  // Prueba de fidelidad: separar el catálogo real en dos idiomas y volver a unirlo
  // debe dar exactamente el mismo archivo. Solo se ejecuta si el catálogo existe.
  const file = path.join(__dirname, '../assets/data/exercises.json');
  it.skipIf(!fs.existsSync(file))('reconstruye el catálogo real sin cambios', () => {
    const real = JSON.parse(fs.readFileSync(file, 'utf8'));
    const split = (lang: 'es' | 'en') =>
      real.exercises.map(({ name, instructions, ...rest }: any) => ({ ...rest, name: name[lang], instructions: instructions[lang] }));
    const { catalog, warnings } = buildCatalog(split('es'), split('en'));
    expect(warnings).toEqual([]);
    expect(catalog).toEqual(real);
    expect(JSON.stringify(catalog)).toBe(JSON.stringify(real)); // incluso el orden de los campos
  });
});
