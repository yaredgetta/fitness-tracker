import fs from 'fs';
import path from 'path';
import { configDefaults, defineConfig } from 'vitest/config';

/**
 * El catálogo de ejercicios no se sube al repositorio (ver README). Si falta,
 * se omiten las pruebas que lo leen, en lugar de fallar.
 * Para tenerlo: npm run fetch:exercises
 */
const CATALOG = path.resolve(process.cwd(), 'assets/data/exercises.json');
const NEEDS_CATALOG = [
  '__tests__/activeSessionStore.test.ts',
  '__tests__/catalog.test.ts',
  '__tests__/categories.test.ts',
  '__tests__/features.test.ts',
  '__tests__/integration.test.ts',
  '__tests__/persistence.test.ts',
  '__tests__/sessionService.test.ts',
];

const hasCatalog = fs.existsSync(CATALOG);
if (!hasCatalog) {
  console.warn(
    `\n⚠ No se encontró assets/data/exercises.json: se omiten ${NEEDS_CATALOG.length} archivos de pruebas que lo usan.\n` +
      '  Ejecuta "npm run fetch:exercises" para descargarlo y correr todas las pruebas.\n',
  );
}

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    exclude: hasCatalog ? configDefaults.exclude : [...configDefaults.exclude, ...NEEDS_CATALOG],
  },
});
